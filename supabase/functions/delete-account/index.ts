import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Verify the user via their JWT ────────────────────────────────────────
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const uid = user.id

    // ── Use service role to delete all data ──────────────────────────────────
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Delete from all user data tables — order doesn't matter since there are
    // no foreign key constraints between these tables, but we do data first
    // and auth user last so RLS can't interfere.
    const deletions = await Promise.allSettled([
      adminClient.from('user_finance_data').delete().eq('user_id', uid),
      adminClient.from('user_profile_data').delete().eq('user_id', uid),
    ])

    // Log any table deletion errors but don't abort — auth user must still be deleted
    for (const result of deletions) {
      if (result.status === 'rejected') {
        console.error('Table deletion error:', result.reason)
      } else if (result.value.error) {
        console.error('Table deletion error:', result.value.error.message)
      }
    }

    // ── Delete the auth user ─────────────────────────────────────────────────
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(uid)

    if (deleteAuthError) {
      return new Response(JSON.stringify({ error: deleteAuthError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(JSON.stringify({ error: 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})