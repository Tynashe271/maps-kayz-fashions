import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { CustomerSidebar } from './src/CustomerSidebar'

const STOREFRONT_URL = 'https://shop.tinashenyenyesa.co.zw/'

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [path, setPath] = useState('/')
  return (
    <View style={styles.app}>
      <StatusBar style="light" backgroundColor="#070707" />
      <View style={styles.appBar}><View style={styles.appBarSpacer} /><Pressable accessibilityLabel="Open customer menu" style={styles.brandButton} onPress={() => setMenuOpen(true)}><View style={styles.brandMark}><Text style={styles.brandMarkText}>MK</Text></View><Text style={styles.appBarTitle}>MAPS KAYZ</Text></Pressable><Pressable style={styles.cartButton} onPress={() => setPath('/cart')}><Text style={styles.cartText}>CART</Text></Pressable></View>
      {React.createElement('iframe', {
        src: new URL(path, STOREFRONT_URL).toString(),
        title: 'Maps Kayz customer storefront',
        allow: 'clipboard-read; clipboard-write; payment; camera',
        style: {
          width: '100%',
          flex: 1,
          border: 0,
          display: 'block',
          background: '#070707',
        },
      })}
      <CustomerSidebar open={menuOpen} onClose={() => setMenuOpen(false)} onNavigate={setPath} />
    </View>
  )
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: '#070707',
  },
  appBar: { height: 54, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#302c2d', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  appBarSpacer: { width: 44 }, brandButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9 }, brandMark: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#f2a8c4', alignItems: 'center', justifyContent: 'center' }, brandMarkText: { color: '#f2a8c4', fontFamily: 'serif', fontSize: 11 },
  appBarTitle: { color: '#f7f2ea', fontFamily: 'serif', fontSize: 14, letterSpacing: 1.5 }, cartButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, cartText: { color: '#f2a8c4', fontSize: 9, fontWeight: '800' },
})
