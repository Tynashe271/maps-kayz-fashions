import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, BackHandler, Linking, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native'
import { StatusBar as ExpoStatusBar } from 'expo-status-bar'
import { WebView } from 'react-native-webview'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { CustomerSidebar } from './src/CustomerSidebar'

const STOREFRONT_URL = 'https://shop.tinashenyenyesa.co.zw/'
const APP_START_URL = STOREFRONT_URL
const APP_ROUTE_STORAGE = 'mk_customer_app_route_v2'
const INTERNAL_HOSTS = new Set(['shop.tinashenyenyesa.co.zw', 'maps-kayz-backend.onrender.com'])
const APP_VIEWPORT_SCRIPT = `
  (function () {
    document.documentElement.classList.add('maps-kayz-mobile-app');
    var id = 'maps-kayz-mobile-app-styles';
    if (!document.getElementById(id)) {
      var style = document.createElement('style');
      style.id = id;
      style.textContent = \`
        html.maps-kayz-mobile-app, html.maps-kayz-mobile-app body { width: 100%; max-width: 100%; overflow-x: hidden; }
        html.maps-kayz-mobile-app .announcement,
        html.maps-kayz-mobile-app .site-header,
        html.maps-kayz-mobile-app footer { display: none !important; }
        html.maps-kayz-mobile-app .customer-dashboard { padding: 28px 16px 40px !important; }
        html.maps-kayz-mobile-app .dashboard-hero { padding-bottom: 24px !important; }
        html.maps-kayz-mobile-app .dashboard-hero h1 { font-size: 38px !important; line-height: 1.05 !important; }
        html.maps-kayz-mobile-app .dashboard-layout { padding-top: 22px !important; }
        html.maps-kayz-mobile-app .dashboard-card { padding: 20px !important; }
        html.maps-kayz-mobile-app .dashboard-summary article { min-height: 128px !important; padding: 18px !important; }
        html.maps-kayz-mobile-app .page-header,
        html.maps-kayz-mobile-app .auth-page,
        html.maps-kayz-mobile-app .cart-page { padding-left: 16px !important; padding-right: 16px !important; }
        html.maps-kayz-mobile-app button,
        html.maps-kayz-mobile-app .btn,
        html.maps-kayz-mobile-app input,
        html.maps-kayz-mobile-app select,
        html.maps-kayz-mobile-app textarea { min-height: 46px; }
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
    return ''
  }
}

export default function App() {
  const webView = useRef(null)
  const [canGoBack, setCanGoBack] = useState(false)
  const [failed, setFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [sourceUrl, setSourceUrl] = useState(APP_START_URL)
  const [currentUrl, setCurrentUrl] = useState(APP_START_URL)
  const [routeReady, setRouteReady] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem(APP_ROUTE_STORAGE).then((savedUrl) => {
      if (savedUrl) {
        try {
          if (INTERNAL_HOSTS.has(new URL(savedUrl).hostname)) {
            setSourceUrl(savedUrl)
            setCurrentUrl(savedUrl)
          }
        } catch {}
      }
    }).finally(() => setRouteReady(true))
  }, [])

  const goBack = useCallback(() => {
    const route = routeFromUrl(currentUrl)
    // Dashboard sections use router.replace(), so they do not create browser
    // history. In that case Back must explicitly return to the overview.
    if (route.startsWith('/account?')) {
      navigate('/account')
      return true
    }
    if (route === '/account') {
      navigate('/')
      return true
    }
    if (canGoBack) {
      webView.current?.goBack()
      return true
    }
    if (route !== '/') {
      navigate('/account')
      return true
    }
    return false
  }, [canGoBack, currentUrl])

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

  function navigate(path) {
    setFailed(false)
    const nextUrl = new URL(path, STOREFRONT_URL).toString()
    setSourceUrl(nextUrl)
    setCurrentUrl(nextUrl)
    AsyncStorage.setItem(APP_ROUTE_STORAGE, nextUrl).catch(() => {})
  }

  const currentRoute = routeFromUrl(currentUrl)
  const currentPathname = currentRoute.split('?')[0]
  const showTabBar = currentPathname !== '/login' && currentPathname !== '/register'
  const canNavigateBack = currentRoute !== '/'

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="light" backgroundColor="#070707" />
      <View style={styles.app}>
        {showTabBar && <View style={styles.appBar}><Pressable accessibilityLabel="Go back" accessibilityState={{ disabled: !canNavigateBack }} disabled={!canNavigateBack} style={[styles.backButton, !canNavigateBack && styles.backButtonDisabled]} onPress={goBack}><Text style={styles.backText}>‹</Text></Pressable><Pressable accessibilityLabel="Open customer menu" style={styles.brandButton} onPress={() => setMenuOpen(true)}><View style={styles.brandMark}><Text style={styles.brandMarkText}>MK</Text></View><Text style={styles.appBarTitle}>MAPS KAYZ</Text></Pressable><Pressable style={styles.cartButton} onPress={() => navigate('/account?tab=bag')}><Text style={styles.cartText}>CART</Text></Pressable></View>}
        {!routeReady ? <LoadingState /> : failed ? <ErrorState onRetry={reload} /> : (
          <WebView
            key={reloadKey}
            ref={webView}
            source={{ uri: sourceUrl }}
            style={styles.webView}
            containerStyle={styles.webViewContainer}
            originWhitelist={['*']}
            onShouldStartLoadWithRequest={allowNavigation}
            onNavigationStateChange={(state) => { setCanGoBack(state.canGoBack); setCurrentUrl(state.url); if (state.url) AsyncStorage.setItem(APP_ROUTE_STORAGE, state.url).catch(() => {}) }}
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
            applicationNameForUserAgent="MapsKayzCustomerApp/1.0"
            injectedJavaScript={APP_VIEWPORT_SCRIPT}
          />
        )}
        {showTabBar && <CustomerSidebar open={menuOpen} onClose={() => setMenuOpen(false)} onNavigate={navigate} />}
      </View>
    </SafeAreaView>
  )
}

function LoadingState() {
  return <View style={styles.loadingState}><View style={styles.logo}><Text style={styles.logoText}>MK</Text></View><ActivityIndicator color="#f2a8c4" size="large" /><Text style={styles.loadingText}>Opening Maps Kayz…</Text></View>
}

function ErrorState({ onRetry }) {
  return <View style={styles.errorState}><View style={styles.logo}><Text style={styles.logoText}>MK</Text></View><Text style={styles.eyebrow}>MAPS KAYZ FASHIONS</Text><Text style={styles.errorTitle}>We couldn’t load the store.</Text><Text style={styles.errorCopy}>Check your internet connection and try again.</Text><Pressable style={styles.retryButton} onPress={onRetry}><Text style={styles.retryText}>TRY AGAIN</Text></Pressable></View>
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, paddingTop: StatusBar.currentHeight || 0, backgroundColor: '#070707' },
  app: { flex: 1, backgroundColor: '#070707' },
  appBar: { height: 54, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#302c2d', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, backButtonDisabled: { opacity: 0.25 }, backText: { color: '#f2a8c4', fontSize: 34, lineHeight: 36 }, brandButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9 }, brandMark: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#f2a8c4', alignItems: 'center', justifyContent: 'center' }, brandMarkText: { color: '#f2a8c4', fontFamily: 'serif', fontSize: 11 },
  appBarTitle: { color: '#f7f2ea', fontFamily: 'serif', fontSize: 14, letterSpacing: 1.5 }, cartButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, cartText: { color: '#f2a8c4', fontSize: 9, fontWeight: '800' },
  webViewContainer: { flex: 1, backgroundColor: '#070707' },
  webView: { flex: 1, backgroundColor: '#070707' },
  loadingState: { ...StyleSheet.absoluteFillObject, zIndex: 2, alignItems: 'center', justifyContent: 'center', gap: 22, backgroundColor: '#070707' },
  loadingText: { color: '#aaa3a0', fontSize: 13, letterSpacing: 0.5 },
  logo: { width: 68, height: 68, marginBottom: 8, borderRadius: 34, borderWidth: 1, borderColor: '#f2a8c4', alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#f2a8c4', fontFamily: 'serif', fontSize: 24 },
  errorState: { flex: 1, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: '#070707' },
  eyebrow: { marginTop: 18, color: '#f2a8c4', fontSize: 10, fontWeight: '700', letterSpacing: 2.2 },
  errorTitle: { marginTop: 18, color: '#f7f2ea', fontFamily: 'serif', fontSize: 32, lineHeight: 38, textAlign: 'center' },
  errorCopy: { marginTop: 12, color: '#aaa3a0', fontSize: 14, lineHeight: 21, textAlign: 'center' },
  retryButton: { minWidth: 180, minHeight: 50, marginTop: 28, backgroundColor: '#f2a8c4', alignItems: 'center', justifyContent: 'center' },
  retryText: { color: '#070707', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
})
