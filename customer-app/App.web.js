import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { CustomerSidebar } from './src/CustomerSidebar'

const STOREFRONT_URL = __DEV__ ? 'http://localhost:9990/' : 'https://shop.tinashenyenyesa.co.zw/'
const APP_ROUTE_STORAGE = 'mk_customer_app_route_v2'

function savedRoute() {
  try { return sessionStorage.getItem(APP_ROUTE_STORAGE) || '/' } catch { return '/' }
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [path, setPath] = useState(savedRoute)
  // Keep app navigation hidden until the embedded storefront reports its
  // actual route. This prevents the authenticated taskbar flashing on login.
  const [framePath, setFramePath] = useState(null)
  const [loading, setLoading] = useState(true)
  const history = useRef([path])
  useEffect(() => {
    function receiveRoute(event) {
      if (event.origin !== new URL(STOREFRONT_URL).origin || event.data?.type !== 'maps-kayz-route') return
      setFramePath(event.data.path)
      try { sessionStorage.setItem(APP_ROUTE_STORAGE, event.data.path) } catch {}
    }
    window.addEventListener('message', receiveRoute)
    return () => window.removeEventListener('message', receiveRoute)
  }, [])
  function navigate(target) {
    if (history.current.at(-1) !== target) history.current.push(target)
    setLoading(true)
    setPath(target)
    setFramePath(target)
    try { sessionStorage.setItem(APP_ROUTE_STORAGE, target) } catch {}
  }
  function goBack() {
    if (framePath?.startsWith('/account?')) return navigate('/account')
    if (framePath === '/account') return navigate('/')
    if (history.current.length > 1) history.current.pop()
    navigate(history.current.at(-1) || '/')
  }
  const showTabBar = Boolean(framePath) && !['/login', '/register'].includes(framePath.split('?')[0])
  const canNavigateBack = framePath !== '/'
  return (
    <View style={styles.app}>
      <StatusBar style="light" backgroundColor="#070707" />
      {showTabBar && <View style={styles.appBar}><Pressable accessibilityLabel="Go back" disabled={!canNavigateBack} style={[styles.backButton, !canNavigateBack && styles.backButtonDisabled]} onPress={goBack}><Text style={styles.backText}>‹</Text></Pressable><Pressable accessibilityLabel="Open customer menu" style={styles.brandButton} onPress={() => setMenuOpen(true)}><View style={styles.brandMark}><Text style={styles.brandMarkText}>MK</Text></View><Text style={styles.appBarTitle}>MAPS KAYZ</Text></Pressable><Pressable style={styles.cartButton} onPress={() => navigate('/account?tab=bag')}><Text style={styles.cartText}>CART</Text></Pressable></View>}
      {React.createElement('iframe', {
        src: new URL(path, STOREFRONT_URL).toString(),
        title: 'Maps Kayz customer storefront',
        onLoad: () => setLoading(false),
        allow: 'clipboard-read; clipboard-write; payment; camera',
        style: {
          width: '100%',
          flex: 1,
          border: 0,
          display: 'block',
          background: '#070707',
        },
      })}
      {loading && <View style={styles.loadingState}><View style={styles.loadingLogo}><Text style={styles.loadingLogoText}>MK</Text></View><ActivityIndicator color="#f2a8c4" size="large" /><Text style={styles.loadingText}>Opening Maps Kayz…</Text></View>}
      {showTabBar && <CustomerSidebar open={menuOpen} onClose={() => setMenuOpen(false)} onNavigate={navigate} />}
    </View>
  )
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    height: '100vh',
    alignSelf: 'center',
    overflow: 'hidden',
    backgroundColor: '#070707',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#302c2d',
  },
  appBar: { height: 54, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#302c2d', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, backButtonDisabled: { opacity: 0.25 }, backText: { color: '#f2a8c4', fontSize: 34, lineHeight: 36 }, brandButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9 }, brandMark: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#f2a8c4', alignItems: 'center', justifyContent: 'center' }, brandMarkText: { color: '#f2a8c4', fontFamily: 'serif', fontSize: 11 },
  appBarTitle: { color: '#f7f2ea', fontFamily: 'serif', fontSize: 14, letterSpacing: 1.5 }, cartButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, cartText: { color: '#f2a8c4', fontSize: 9, fontWeight: '800' },
  loadingState: { ...StyleSheet.absoluteFillObject, zIndex: 50, alignItems: 'center', justifyContent: 'center', gap: 20, backgroundColor: '#070707' },
  loadingLogo: { width: 68, height: 68, borderRadius: 34, borderWidth: 1, borderColor: '#f2a8c4', alignItems: 'center', justifyContent: 'center' },
  loadingLogoText: { color: '#f2a8c4', fontFamily: 'serif', fontSize: 24 },
  loadingText: { color: '#aaa3a0', fontSize: 13, letterSpacing: 0.5 },
})
