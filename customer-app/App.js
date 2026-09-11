import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, BackHandler, Linking, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native'
import { StatusBar as ExpoStatusBar } from 'expo-status-bar'
import { WebView } from 'react-native-webview'
import { CustomerSidebar } from './src/CustomerSidebar'

const STOREFRONT_URL = 'https://shop.tinashenyenyesa.co.zw/'
const INTERNAL_HOSTS = new Set(['shop.tinashenyenyesa.co.zw', 'maps-kayz-backend.onrender.com'])

export default function App() {
  const webView = useRef(null)
  const [canGoBack, setCanGoBack] = useState(false)
  const [failed, setFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [currentUrl, setCurrentUrl] = useState(STOREFRONT_URL)

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

  function navigate(path) {
    setFailed(false)
    setCurrentUrl(new URL(path, STOREFRONT_URL).toString())
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="light" backgroundColor="#070707" />
      <View style={styles.app}>
        <View style={styles.appBar}><Pressable accessibilityLabel="Open customer menu" style={styles.menuButton} onPress={() => setMenuOpen(true)}><Text style={styles.menuIcon}>☰</Text></Pressable><Text style={styles.appBarTitle}>MAPS KAYZ</Text><Pressable style={styles.cartButton} onPress={() => navigate('/cart')}><Text style={styles.cartText}>CART</Text></Pressable></View>
        {failed ? <ErrorState onRetry={reload} /> : (
          <WebView
            key={reloadKey}
            ref={webView}
            source={{ uri: currentUrl }}
            style={styles.webView}
            containerStyle={styles.webViewContainer}
            originWhitelist={['*']}
            onShouldStartLoadWithRequest={allowNavigation}
            onNavigationStateChange={(state) => setCanGoBack(state.canGoBack)}
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
          />
        )}
        <CustomerSidebar open={menuOpen} onClose={() => setMenuOpen(false)} onNavigate={navigate} />
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
  menuButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, menuIcon: { color: '#f7f2ea', fontSize: 25 },
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
