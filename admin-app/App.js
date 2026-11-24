import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, BackHandler, Linking, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native'
import { StatusBar as ExpoStatusBar } from 'expo-status-bar'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { WebView } from 'react-native-webview'

const ADMIN_URL = process.env.EXPO_PUBLIC_ADMIN_URL || 'https://maps-kayz-admin.pages.dev/'
const ADMIN_BASIC_AUTH_USER = process.env.EXPO_PUBLIC_ADMIN_BASIC_AUTH_USER || ''
const ADMIN_BASIC_AUTH_PASS = process.env.EXPO_PUBLIC_ADMIN_BASIC_AUTH_PASS || ''
const ROUTE_STORAGE_KEY = 'mk_admin_app_route_v1'
const INTERNAL_HOSTS = new Set([new URL(ADMIN_URL).hostname, 'maps-kayz-admin.pages.dev', 'admin.tinashenyenyesa.co.zw'])

// Cloudflare Pages Function gates every request (HTML + assets) behind HTTP
// Basic Auth (see frontend-admin/functions/_middleware.js). Embedding the
// credentials as URL userinfo makes the WebView's engine cache them for the
// origin and auto-attach Authorization to all same-origin requests — a
// `source.headers` Authorization header only covers the top-level request,
// not the subresources the Function also gates.
function withBasicAuth(url) {
  if (!ADMIN_BASIC_AUTH_USER) return url
  try {
    const parsed = new URL(url)
    parsed.username = ADMIN_BASIC_AUTH_USER
    parsed.password = ADMIN_BASIC_AUTH_PASS
    return parsed.toString()
  } catch {
    return url
  }
}
const MOBILE_APP_SCRIPT = `
  (function () {
    document.documentElement.classList.add('maps-kayz-admin-mobile-app');
    var id = 'maps-kayz-admin-mobile-app-style';
    if (!document.getElementById(id)) {
      var style = document.createElement('style');
      style.id = id;
      style.textContent = \`
        html.maps-kayz-admin-mobile-app,
        html.maps-kayz-admin-mobile-app body,
        html.maps-kayz-admin-mobile-app #app { width: 100%; max-width: 100%; min-height: 100%; overflow-x: hidden; }
        html.maps-kayz-admin-mobile-app button,
        html.maps-kayz-admin-mobile-app .btn,
        html.maps-kayz-admin-mobile-app input,
        html.maps-kayz-admin-mobile-app select,
        html.maps-kayz-admin-mobile-app textarea { min-height: 44px; }
      \`;
      document.head.appendChild(style);
    }
  })();
  true;
`

function routeFromUrl(url) {
  try {
    const parsed = new URL(url)
    return `${parsed.pathname}${parsed.search}`
  } catch {
    return '/'
  }
}

function isInternalUrl(url) {
  try {
    return INTERNAL_HOSTS.has(new URL(url).hostname)
  } catch {
    return false
  }
}

export default function App() {
  const webView = useRef(null)
  const [sourceUrl, setSourceUrl] = useState(ADMIN_URL)
  const [routeReady, setRouteReady] = useState(false)
  const [canGoBack, setCanGoBack] = useState(false)
  const [failed, setFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    AsyncStorage.getItem(ROUTE_STORAGE_KEY)
      .then((savedUrl) => {
        if (!savedUrl) return
        if (isInternalUrl(savedUrl)) setSourceUrl(savedUrl)
      })
      .finally(() => setRouteReady(true))
  }, [])

  const goBack = useCallback(() => {
    if (!canGoBack) return false
    webView.current?.goBack()
    return true
  }, [canGoBack])

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', goBack)
    return () => subscription.remove()
  }, [goBack])

  function allowNavigation(request) {
    const url = request.url || ''
    if (url === 'about:blank' || url.startsWith('data:') || url.startsWith('blob:')) return true
    try {
      if (INTERNAL_HOSTS.has(new URL(url).hostname)) return true
    } catch {
      return true
    }
    Linking.openURL(url).catch(() => {})
    return false
  }

  function reload() {
    setFailed(false)
    setReloadKey((value) => value + 1)
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="light" backgroundColor="#070707" />
      <View style={styles.app}>
        {!routeReady ? <LoadingState /> : failed ? <ErrorState onRetry={reload} /> : (
          <WebView
            key={reloadKey}
            ref={webView}
            source={{ uri: withBasicAuth(sourceUrl) }}
            style={styles.webView}
            containerStyle={styles.webViewContainer}
            originWhitelist={['*']}
            onShouldStartLoadWithRequest={allowNavigation}
            onNavigationStateChange={(state) => {
              setCanGoBack(state.canGoBack)
              if (isInternalUrl(state.url)) {
                AsyncStorage.setItem(ROUTE_STORAGE_KEY, state.url).catch(() => {})
              }
            }}
            onError={() => setFailed(true)}
            onHttpError={(event) => { if (event.nativeEvent.statusCode >= 500) setFailed(true) }}
            startInLoadingState
            renderLoading={() => <LoadingState />}
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            domStorageEnabled
            javaScriptEnabled
            allowsBackForwardNavigationGestures
            pullToRefreshEnabled
            setSupportMultipleWindows={false}
            applicationNameForUserAgent="MapsKayzAdminApp/1.0"
            injectedJavaScript={MOBILE_APP_SCRIPT}
          />
        )}
      </View>
    </SafeAreaView>
  )
}

function LoadingState() {
  return <View style={styles.state}><View style={styles.logo}><Text style={styles.logoText}>MK</Text></View><ActivityIndicator color="#f2a8c4" size="large" /><Text style={styles.stateText}>Opening admin workspace…</Text></View>
}

function ErrorState({ onRetry }) {
  return <View style={styles.state}><View style={styles.logo}><Text style={styles.logoText}>MK</Text></View><Text style={styles.eyebrow}>MAPS KAYZ ADMIN</Text><Text style={styles.errorTitle}>Workspace unavailable.</Text><Text style={styles.stateText}>Check your internet connection and try again.</Text><Pressable style={styles.retryButton} onPress={onRetry}><Text style={styles.retryText}>TRY AGAIN</Text></Pressable></View>
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, paddingTop: StatusBar.currentHeight || 0, backgroundColor: '#070707' },
  app: { flex: 1, backgroundColor: '#070707' },
  webViewContainer: { flex: 1, backgroundColor: '#070707' },
  webView: { flex: 1, backgroundColor: '#070707' },
  state: { ...StyleSheet.absoluteFillObject, zIndex: 2, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center', gap: 20, backgroundColor: '#070707' },
  logo: { width: 68, height: 68, marginBottom: 8, borderRadius: 34, borderWidth: 1, borderColor: '#f2a8c4', alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#f2a8c4', fontFamily: 'serif', fontSize: 24 },
  eyebrow: { color: '#f2a8c4', fontSize: 10, fontWeight: '700', letterSpacing: 2.2 },
  errorTitle: { color: '#f7f2ea', fontFamily: 'serif', fontSize: 31, textAlign: 'center' },
  stateText: { color: '#aaa3a0', fontSize: 14, lineHeight: 21, textAlign: 'center' },
  retryButton: { minWidth: 180, minHeight: 50, marginTop: 8, backgroundColor: '#f2a8c4', alignItems: 'center', justifyContent: 'center' },
  retryText: { color: '#070707', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
})
