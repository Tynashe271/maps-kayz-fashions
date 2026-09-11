import React from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

export const customerMenu = [
  ['/', 'Home'],
  ['/shop', 'Shop'],
  ['/categories', 'Categories'],
  ['/cart', 'My Cart'],
  ['/account', 'Overview'],
  ['/account?tab=orders', 'My Orders'],
  ['/account?tab=track', 'Track Order'],
  ['/account?tab=returns', 'Returns & Exchanges'],
  ['/account?tab=wishlist', 'Wishlist'],
  ['/account?tab=looks', 'Saved Looks'],
  ['/account?tab=recent', 'Recently Viewed'],
  ['/account?tab=style', 'My Sizes & Style'],
  ['/account?tab=loyalty', 'Loyalty & Rewards'],
  ['/account?tab=coupons', 'Coupons'],
  ['/account?tab=credit', 'Gift Cards & Credit'],
  ['/account?tab=addresses', 'Addresses'],
  ['/account?tab=notifications', 'Notifications'],
  ['/account?tab=reviews', 'Reviews & Questions'],
  ['/account?tab=referrals', 'Referrals'],
  ['/account?tab=support', 'Support Centre'],
  ['/account?tab=profile', 'Profile'],
  ['/account?tab=security', 'Privacy & Security'],
]

export function CustomerSidebar({ open, onClose, onNavigate }) {
  if (!open) return null
  return (
    <View style={styles.layer}>
      <Pressable accessibilityLabel="Close menu" style={styles.backdrop} onPress={onClose} />
      <View style={styles.drawer}>
        <View style={styles.heading}><View><Text style={styles.eyebrow}>MAPS KAYZ</Text><Text style={styles.title}>Customer menu</Text></View><Pressable accessibilityLabel="Close menu" style={styles.close} onPress={onClose}><Text style={styles.closeText}>×</Text></Pressable></View>
        <ScrollView contentContainerStyle={styles.menu}>
          {customerMenu.map(([path, label], index) => <Pressable key={path} style={styles.item} onPress={() => { onNavigate(path); onClose() }}><Text style={styles.number}>{String(index + 1).padStart(2, '0')}</Text><Text style={styles.label}>{label}</Text><Text style={styles.arrow}>→</Text></Pressable>)}
          <Pressable style={styles.shopButton} onPress={() => { onNavigate('/shop'); onClose() }}><Text style={styles.shopText}>CONTINUE SHOPPING →</Text></Pressable>
          <Pressable style={styles.logoutButton} onPress={() => { onNavigate('/account'); onClose() }}><Text style={styles.logoutText}>ACCOUNT & LOG OUT</Text></Pressable>
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFillObject, zIndex: 100 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,.72)' },
  drawer: { width: '84%', maxWidth: 340, height: '100%', backgroundColor: '#0b0b0b', borderRightWidth: 1, borderRightColor: '#302c2d' },
  heading: { minHeight: 92, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#302c2d', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: '#f2a8c4', fontSize: 9, fontWeight: '700', letterSpacing: 2 },
  title: { marginTop: 6, color: '#f7f2ea', fontFamily: 'serif', fontSize: 22 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, closeText: { color: '#f7f2ea', fontSize: 30, lineHeight: 32 },
  menu: { padding: 18, paddingBottom: 40 },
  item: { minHeight: 49, borderBottomWidth: 1, borderBottomColor: '#252223', flexDirection: 'row', alignItems: 'center', gap: 12 },
  number: { width: 22, color: '#776f70', fontSize: 9 }, label: { flex: 1, color: '#d8d2ce', fontSize: 12 }, arrow: { color: '#f2a8c4', fontSize: 15 },
  shopButton: { minHeight: 50, marginTop: 22, backgroundColor: '#f2a8c4', alignItems: 'center', justifyContent: 'center' }, shopText: { color: '#090707', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  logoutButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center' }, logoutText: { color: '#e57782', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
})
