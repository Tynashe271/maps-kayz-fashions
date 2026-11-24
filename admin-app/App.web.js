import React, { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'

const ADMIN_URL = process.env.EXPO_PUBLIC_ADMIN_URL || (__DEV__ ? 'http://localhost:9100/' : 'https://maps-kayz-admin.pages.dev/')

export default function App() {
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = () => { setFailed(false); setLoading(true); setReloadKey((value) => value + 1) }
  return (
    <View style={styles.app}>
      <StatusBar style="light" backgroundColor="#070707" />
      {failed ? <ErrorState onRetry={reload} /> : <><iframe key={reloadKey} title="Maps Kayz Admin" src={ADMIN_URL} onLoad={() => setLoading(false)} onError={() => setFailed(true)} style={styles.frame} />{loading && <LoadingState />}</>}
    </View>
  )
}

function LoadingState() {
  return <View style={styles.state}><View style={styles.logo}><Text style={styles.logoText}>MK</Text></View><ActivityIndicator color="#f2a8c4" size="large" /><Text style={styles.stateText}>Opening admin workspace…</Text></View>
}

function ErrorState({ onRetry }) {
  return <View style={styles.state}><Text style={styles.errorTitle}>Workspace unavailable.</Text><Text style={styles.stateText}>Check that the admin web app is running.</Text><Pressable style={styles.retryButton} onPress={onRetry}><Text style={styles.retryText}>TRY AGAIN</Text></Pressable></View>
}

const styles = StyleSheet.create({
  app: { flex: 1, minHeight: '100vh', backgroundColor: '#070707' },
  frame: { width: '100%', height: '100vh', borderWidth: 0, backgroundColor: '#070707' },
  state: { ...StyleSheet.absoluteFillObject, zIndex: 2, alignItems: 'center', justifyContent: 'center', gap: 20, backgroundColor: '#070707' },
  logo: { width: 68, height: 68, borderRadius: 34, borderWidth: 1, borderColor: '#f2a8c4', alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#f2a8c4', fontFamily: 'serif', fontSize: 24 },
  errorTitle: { color: '#f7f2ea', fontFamily: 'serif', fontSize: 31 },
  stateText: { color: '#aaa3a0', fontSize: 14 },
  retryButton: { minWidth: 180, minHeight: 50, backgroundColor: '#f2a8c4', alignItems: 'center', justifyContent: 'center' },
  retryText: { color: '#070707', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
})
