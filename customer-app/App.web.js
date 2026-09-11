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
      <View style={styles.appBar}><Pressable accessibilityLabel="Open customer menu" style={styles.menuButton} onPress={() => setMenuOpen(true)}><Text style={styles.menuIcon}>☰</Text></Pressable><Text style={styles.appBarTitle}>MAPS KAYZ</Text><Pressable style={styles.cartButton} onPress={() => setPath('/cart')}><Text style={styles.cartText}>CART</Text></Pressable></View>
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
  menuButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, menuIcon: { color: '#f7f2ea', fontSize: 25 },
  appBarTitle: { color: '#f7f2ea', fontFamily: 'serif', fontSize: 14, letterSpacing: 1.5 }, cartButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, cartText: { color: '#f2a8c4', fontSize: 9, fontWeight: '800' },
})
