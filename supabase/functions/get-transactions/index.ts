import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const PLAID_CLIENT_ID = Deno.env.get('PLAID_CLIENT_ID')!
const PLAID_SECRET = Deno.env.get('PLAID_SECRET')!
const PLAID_ENV = Deno.env.get('PLAID_ENV') ?? 'sandbox'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const { userId } = await req.json()

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Get the user's access token from Supabase
  const itemRes = await fetch(
    `${supabaseUrl}/rest/v1/plaid_items?user_id=eq.${userId}&select=access_token`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    }
  )

  const items = await itemRes.json()

  if (!items.length) {
    return new Response(JSON.stringify({ transactions: [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const access_token = items[0].access_token

  // Fetch transactions from Plaid
  const today = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const response = await fetch(`https://${PLAID_ENV}.plaid.com/transactions/get`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: PLAID_CLIENT_ID,
      secret: PLAID_SECRET,
      access_token,
      start_date: startDate,
      end_date: today,
    }),
  })

  const data = await response.json()

  return new Response(JSON.stringify({ transactions: data.transactions, accounts: data.accounts }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})