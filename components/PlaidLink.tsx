import { supabase } from '@/lib/supabase'
import { useState } from 'react'
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { WebView } from 'react-native-webview'

interface Props {
  userId: string
  onSuccess: () => void
  onClose: () => void
}

export default function PlaidLink({ userId, onSuccess, onClose }: Props) {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLinkToken = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-link-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ userId }),
        }
      )
      const data = await res.json()
      console.log('Plaid response:', JSON.stringify(data))
      if (data.link_token) {
        setLinkToken(data.link_token)
      } else {
        setError(data.error_message || data.error_code || 'Failed to get link token')
      }
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  useState(() => { fetchLinkToken() })

  const handleMessage = async (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data)
      if (msg.type === 'SUCCESS' && msg.public_token) {
        const { data: { session } } = await supabase.auth.getSession()
        await fetch(
          `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/exchange-token`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({ public_token: msg.public_token, userId }),
          }
        )
        onSuccess()
      }
      if (msg.type === 'EXIT') onClose()
      if (msg.type === 'ERROR') setError(msg.message)
    } catch (err) {
      console.error('Message handler error:', err)
    }
  }

  // Use Plaid's hosted Link page with the token as a param
  const plaidUrl = `https://cdn.plaid.com/link/v2/stable/link.html?token=${linkToken}&receiverUrl=https://cdn.plaid.com`

  const injectedJS = `
    (function() {
      // Listen for Plaid events and forward to React Native
      window.addEventListener('message', function(e) {
        try {
          var data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
          if (data && data.action) {
            if (data.action === 'plaid_link-undefined::exit') {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'EXIT' }));
            }
          }
        } catch(err) {}
      });
    })();
    true;
  `

  // Simpler approach: just use Plaid's own hosted link page
  const hostedHtml = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    #loading { color: #aaa; font-family: sans-serif; font-size: 14px; text-align: center; }
  </style>
</head>
<body>
  <div id="loading">Opening Plaid...</div>
  <script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"></script>
  <script>
    if (typeof Plaid !== 'undefined') {
      var handler = Plaid.create({
        token: '${linkToken}',
        onSuccess: function(public_token, metadata) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SUCCESS', public_token: public_token }));
        },
        onExit: function(err, metadata) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'EXIT' }));
        },
        onEvent: function(eventName, metadata) {
          console.log('Plaid event:', eventName);
        }
      });
      document.getElementById('loading').style.display = 'none';
      handler.open();
    } else {
      document.getElementById('loading').innerText = 'Failed to load Plaid SDK';
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: 'Plaid SDK not loaded' }));
    }
  </script>
</body>
</html>`

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.close} onPress={onClose}>
          <Text style={styles.closeText}>✕ Close</Text>
        </TouchableOpacity>

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Connecting to your bank...</Text>
          </View>
        )}

        {!loading && error && (
          <View style={styles.center}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorMsg}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); setError(null); fetchLinkToken() }}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && linkToken && (
          <WebView
            source={{ html: hostedHtml, baseUrl: 'https://cdn.plaid.com' }}
            onMessage={handleMessage}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={['*']}
            mixedContentMode="always"
            allowUniversalAccessFromFileURLs
            allowFileAccessFromFileURLs
            thirdPartyCookiesEnabled
            onError={(e) => {
              console.error('WebView error:', e.nativeEvent)
              setError(`WebView error: ${e.nativeEvent.description}`)
            }}
            onHttpError={(e) => console.error('HTTP error:', e.nativeEvent.statusCode)}
            style={{ flex: 1, backgroundColor: '#000' }}
          />
        )}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  close: { padding: 16, paddingTop: 50 },
  closeText: { color: '#fff', fontSize: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  loadingText: { color: '#aaa', marginTop: 16, fontSize: 14 },
  errorIcon: { fontSize: 48, marginBottom: 16 },
  errorTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  errorMsg: { color: '#FF6B6B', fontSize: 13, textAlign: 'center', marginBottom: 24 },
  retryBtn: { backgroundColor: '#6c47ff', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  retryText: { color: '#fff', fontWeight: '700' },
})