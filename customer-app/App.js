import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { StatusBar as ExpoStatusBar } from 'expo-status-bar'
import { WebView } from 'react-native-webview'
import { api } from './src/api'
import { colors } from './src/theme'

const tabs = [
  ['home', '⌂', 'Home'],
  ['shop', '◇', 'Shop'],
  ['cart', '▢', 'Cart'],
  ['account', '○', 'Account'],
  ['more', '☰', 'More'],
]

export default function App() {
  const [tab, setTab] = useState('home')
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [cart, setCart] = useState({ items: [], itemCount: 0, total: 0 })
  const [booting, setBooting] = useState(true)
  const [webPath, setWebPath] = useState('/')

  const restore = useCallback(async () => {
    try {
      const [storedUser, storedToken, cartId] = await Promise.all([
        AsyncStorage.getItem('mk_user'),
        AsyncStorage.getItem('mk_token'),
        AsyncStorage.getItem('mk_cart_id'),
      ])
      if (storedUser) setUser(JSON.parse(storedUser))
      if (storedToken) setToken(storedToken)
      if (cartId) setCart(await api.cart(cartId))
    } catch {
      await AsyncStorage.removeItem('mk_cart_id')
    } finally {
      setBooting(false)
    }
  }, [])

  useEffect(() => { restore() }, [restore])

  async function signIn(session) {
    const nextToken = session.accessToken || session.token
    await AsyncStorage.multiSet([
      ['mk_token', nextToken],
      ['mk_user', JSON.stringify(session.user)],
    ])
    setToken(nextToken)
    setUser(session.user)
    setTab('account')
  }

  async function signOut() {
    await AsyncStorage.multiRemove(['mk_token', 'mk_user'])
    setUser(null)
    setToken(null)
    setTab('home')
  }

  async function add(product) {
    try {
      let cartId = await AsyncStorage.getItem('mk_cart_id')
      if (!cartId) {
        const created = await api.createCart()
        cartId = created.id
        await AsyncStorage.setItem('mk_cart_id', cartId)
      }
      const next = await api.addToCart(cartId, {
        productId: product.id,
        quantity: 1,
        size: product.sizes?.[0],
        colour: product.colours?.[0],
      })
      setCart(next)
      Alert.alert('Added to cart', product.name)
    } catch (error) {
      Alert.alert('Could not add item', error.message)
    }
  }

  if (booting) return <LoadingScreen />

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="light" />
      <View style={styles.app}>
        <Header cartCount={cart.itemCount || 0} onCart={() => setTab('cart')} />
        <View style={styles.content}>
          {tab === 'home' && <HomeScreen goShop={() => setTab('shop')} />}
          {tab === 'shop' && <ShopScreen onAdd={add} />}
          {tab === 'cart' && <CartScreen cart={cart} setCart={setCart} />}
          {tab === 'account' && (user
            ? <AccountScreen user={user} onLogout={signOut} onOpenWeb={() => { setWebPath('/account'); setTab('web') }} />
            : <AuthScreen onSuccess={signIn} />)}
          {tab === 'more' && <MoreScreen open={(path) => { setWebPath(path); setTab('web') }} />}
          {tab === 'web' && <WebStorefront path={webPath} user={user} token={token} onBack={() => setTab('more')} />}
        </View>
        {tab !== 'web' && <BottomTabs active={tab} cartCount={cart.itemCount || 0} onChange={setTab} />}
      </View>
    </SafeAreaView>
  )
}

function LoadingScreen() {
  return <SafeAreaView style={[styles.safe, styles.center]}><ExpoStatusBar style="light" /><ActivityIndicator color={colors.pink} size="large" /></SafeAreaView>
}

function Header({ cartCount, onCart }) {
  return (
    <View style={styles.header}>
      <View style={styles.mark}><Text style={styles.markText}>MK</Text></View>
      <View style={styles.brand}><Text style={styles.brandName}>MAPS KAYZ</Text><Text style={styles.brandSmall}>FASHIONS · BYO</Text></View>
      <Pressable style={styles.headerCart} onPress={onCart}><Text style={styles.headerCartText}>Cart</Text><Text style={styles.badge}>{cartCount}</Text></Pressable>
    </View>
  )
}

function HomeScreen({ goShop }) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>THE SIGNATURE EDIT · 2026</Text>
        <Text style={styles.heroTitle}>Style, made{`\n`}<Text style={styles.italic}>unforgettable.</Text></Text>
        <Text style={styles.lead}>Curated fashion and authentic fragrances for every entrance, every occasion, every version of you.</Text>
        <Pressable style={styles.primaryButton} onPress={goShop}><Text style={styles.primaryButtonText}>SHOP NEW ARRIVALS  →</Text></Pressable>
      </View>
      <View style={styles.benefits}>
        {[
          ['Authentic products', 'Carefully sourced, always genuine'],
          ['Nationwide delivery', 'From Bulawayo to your door'],
          ['Secure payments', 'EcoCash, Paynow, Visa & Mastercard'],
          ['Personal styling', 'Expert help via WhatsApp'],
        ].map(([title, body]) => <View key={title} style={styles.benefit}><Text style={styles.benefitTitle}>{title}</Text><Text style={styles.muted}>{body}</Text></View>)}
      </View>
    </ScrollView>
  )
}

function ShopScreen({ onAdd }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [query, setQuery] = useState('')

  const load = useCallback(async () => {
    try { setProducts(await api.products()) }
    catch (error) { Alert.alert('Could not load products', error.message) }
    finally { setLoading(false); setRefreshing(false) }
  }, [])
  useEffect(() => { load() }, [load])
  const shown = useMemo(() => products.filter((item) => item.isActive !== false && item.name.toLowerCase().includes(query.toLowerCase())), [products, query])

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.pink} /></View>
  return (
    <FlatList
      data={shown}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} tintColor={colors.pink} onRefresh={() => { setRefreshing(true); load() }} />}
      ListHeaderComponent={<View><Text style={styles.eyebrow}>THE COLLECTION</Text><Text style={styles.pageTitle}>Shop</Text><TextInput style={styles.input} value={query} onChangeText={setQuery} placeholder="Search products" placeholderTextColor={colors.muted} /></View>}
      ListEmptyComponent={<Text style={styles.empty}>No products found.</Text>}
      renderItem={({ item }) => <ProductCard product={item} onAdd={() => onAdd(item)} />}
    />
  )
}

function ProductCard({ product, onAdd }) {
  return (
    <View style={styles.product}>
      <View style={styles.productVisual}><Text style={styles.productMonogram}>MK</Text>{product.isFeatured && <Text style={styles.featured}>FEATURED</Text>}</View>
      <Text style={styles.productCategory}>{product.category || 'MAPS KAYZ'}</Text>
      <Text style={styles.productName}>{product.name}</Text>
      <View style={styles.productBottom}><Text style={styles.price}>US${Number(product.price).toFixed(2)}</Text><Pressable disabled={product.stock < 1} style={[styles.addButton, product.stock < 1 && styles.disabled]} onPress={onAdd}><Text style={styles.addText}>{product.stock < 1 ? 'OUT OF STOCK' : 'ADD TO CART'}</Text></Pressable></View>
    </View>
  )
}

function CartScreen({ cart, setCart }) {
  const [busy, setBusy] = useState(false)
  async function remove(item) {
    try {
      const id = await AsyncStorage.getItem('mk_cart_id')
      setCart(await api.removeCartItem(id, item.id))
    } catch (error) { Alert.alert('Could not remove item', error.message) }
  }
  async function checkout() {
    try {
      setBusy(true)
      const id = await AsyncStorage.getItem('mk_cart_id')
      const result = await api.cartWhatsApp(id)
      const url = result.whatsappUrl || result.url
      if (url) await Linking.openURL(url)
      else Alert.alert('Cart ready', 'Your order has been prepared for WhatsApp.')
    } catch (error) { Alert.alert('Could not continue', error.message) }
    finally { setBusy(false) }
  }
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.eyebrow}>YOUR SELECTION</Text><Text style={styles.pageTitle}>Shopping cart</Text>
      {!cart.items?.length ? <Text style={styles.empty}>Your cart is empty.</Text> : <>
        {cart.items.map((item) => <View key={item.id} style={styles.cartItem}><View style={styles.cartThumb}><Text style={styles.productMonogram}>MK</Text></View><View style={styles.cartInfo}><Text style={styles.productName}>{item.product?.name || item.name}</Text><Text style={styles.muted}>Qty {item.quantity}{item.size ? ` · ${item.size}` : ''}</Text><Text style={styles.price}>US${Number(item.unitPrice * item.quantity).toFixed(2)}</Text></View><Pressable onPress={() => remove(item)}><Text style={styles.remove}>Remove</Text></Pressable></View>)}
        <View style={styles.total}><Text style={styles.productName}>Total</Text><Text style={styles.totalPrice}>US${Number(cart.total || 0).toFixed(2)}</Text></View>
        <Pressable disabled={busy} style={styles.primaryButton} onPress={checkout}><Text style={styles.primaryButtonText}>{busy ? 'PREPARING…' : 'ORDER VIA WHATSAPP  →'}</Text></Pressable>
      </>}
    </ScrollView>
  )
}

function AuthScreen({ onSuccess }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit() {
    try {
      setBusy(true)
      let session
      if (mode === 'login') session = await api.login({ email, password })
      else {
        await api.register({ email, password })
        session = await api.login({ email, password })
      }
      await onSuccess(session)
    } catch (error) { Alert.alert(mode === 'login' ? 'Sign in failed' : 'Registration failed', error.message) }
    finally { setBusy(false) }
  }
  return (
    <ScrollView contentContainerStyle={styles.auth} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>CUSTOMER ACCOUNT</Text><Text style={styles.pageTitle}>{mode === 'login' ? 'Welcome back.' : 'Join Maps Kayz.'}</Text>
      <TextInput autoCapitalize="none" keyboardType="email-address" style={styles.input} value={email} onChangeText={setEmail} placeholder="Email address" placeholderTextColor={colors.muted} />
      <TextInput secureTextEntry style={styles.input} value={password} onChangeText={setPassword} placeholder="Password (8+ characters)" placeholderTextColor={colors.muted} />
      <Pressable disabled={busy || !email || password.length < 8} style={[styles.primaryButton, (busy || !email || password.length < 8) && styles.disabled]} onPress={submit}><Text style={styles.primaryButtonText}>{busy ? 'PLEASE WAIT…' : mode === 'login' ? 'SIGN IN  →' : 'CREATE ACCOUNT  →'}</Text></Pressable>
      <Pressable style={styles.switchButton} onPress={() => setMode(mode === 'login' ? 'register' : 'login')}><Text style={styles.switchText}>{mode === 'login' ? 'New here? Create an account' : 'Already have an account? Sign in'}</Text></Pressable>
    </ScrollView>
  )
}

function AccountScreen({ user, onLogout, onOpenWeb }) {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { api.dashboard().then(setDashboard).catch(() => {}).finally(() => setLoading(false)) }, [])
  const name = dashboard?.profile?.name || user.email?.split('@')[0] || 'Customer'
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.eyebrow}>CUSTOMER DASHBOARD</Text><Text style={styles.pageTitle}>Welcome back,{`\n`}<Text style={styles.italic}>{name}.</Text></Text>
      <Text style={styles.lead}>{user.email}</Text>
      {loading ? <ActivityIndicator color={colors.pink} style={styles.loader} /> : <View style={styles.stats}>
        <Stat title="Active orders" value={dashboard?.orders?.filter((x) => !['Delivered', 'Cancelled'].includes(x.status)).length || 0} />
        <Stat title="Cart items" value={dashboard?.cart?.itemCount || 0} />
        <Stat title="Wishlist" value={dashboard?.wishlist?.length || 0} />
      </View>}
      <Pressable style={styles.outlineButton} onPress={onOpenWeb}><Text style={styles.outlineText}>OPEN ALL ACCOUNT TOOLS  →</Text></Pressable>
      <Pressable style={styles.logoutButton} onPress={onLogout}><Text style={styles.logoutText}>LOG OUT</Text></Pressable>
    </ScrollView>
  )
}

const webSections = [
  ['/categories', 'Categories', 'Browse every fashion and fragrance collection'],
  ['/checkout', 'Checkout', 'Delivery details, payment and order placement'],
  ['/track-order', 'Track an order', 'See current order and delivery status'],
  ['/returns', 'Returns & exchanges', 'Check eligibility and submit a request'],
  ['/account?tab=orders', 'My orders', 'Purchase history, invoices and reordering'],
  ['/account?tab=wishlist', 'Wishlist', 'Saved products and personal notes'],
  ['/account?tab=looks', 'Saved looks', 'Saved outfits and styling combinations'],
  ['/account?tab=recent', 'Recently viewed', 'Return to products you viewed'],
  ['/account?tab=style', 'Sizes & style', 'Fit, colour and fragrance preferences'],
  ['/account?tab=loyalty', 'Loyalty & rewards', 'Points, rewards and referrals'],
  ['/account?tab=coupons', 'Coupons & credit', 'Offers, gift cards and store credit'],
  ['/account?tab=addresses', 'Addresses', 'Saved delivery destinations'],
  ['/account?tab=notifications', 'Notifications', 'Updates and communication preferences'],
  ['/account?tab=reviews', 'Reviews & questions', 'Product feedback and questions'],
  ['/account?tab=support', 'Support centre', 'Tickets and WhatsApp support'],
  ['/account?tab=profile', 'Profile & security', 'Personal details and privacy settings'],
]

function MoreScreen({ open }) {
  return (
    <FlatList
      data={webSections}
      keyExtractor={(item) => item[0]}
      contentContainerStyle={styles.list}
      ListHeaderComponent={<View><Text style={styles.eyebrow}>EVERYTHING MAPS KAYZ</Text><Text style={styles.pageTitle}>More</Text><Text style={styles.lead}>Every customer website feature is available here without leaving the app.</Text></View>}
      renderItem={({ item }) => <Pressable style={styles.moreRow} onPress={() => open(item[0])}><View style={styles.moreCopy}><Text style={styles.moreTitle}>{item[1]}</Text><Text style={styles.muted}>{item[2]}</Text></View><Text style={styles.moreArrow}>→</Text></Pressable>}
    />
  )
}

function WebStorefront({ path, user, token, onBack }) {
  const injection = token && user
    ? `localStorage.setItem('mk_token', ${JSON.stringify(token)}); localStorage.setItem('mk_user', ${JSON.stringify(JSON.stringify(user))}); true;`
    : 'true;'
  return (
    <View style={styles.webScreen}>
      <View style={styles.webBar}><Pressable style={styles.webBack} onPress={onBack}><Text style={styles.webBackText}>← Back to app</Text></Pressable><Text style={styles.webBarTitle}>MAPS KAYZ</Text></View>
      <WebView
        source={{ uri: `https://shop.tinashenyenyesa.co.zw${path}` }}
        injectedJavaScriptBeforeContentLoaded={injection}
        sharedCookiesEnabled
        startInLoadingState
        renderLoading={() => <View style={[styles.webLoader, styles.center]}><ActivityIndicator color={colors.pink} size="large" /></View>}
        style={styles.webView}
      />
    </View>
  )
}

function Stat({ title, value }) {
  return <View style={styles.stat}><Text style={styles.productCategory}>{title}</Text><Text style={styles.statValue}>{value}</Text></View>
}

function BottomTabs({ active, cartCount, onChange }) {
  return (
    <View style={styles.tabs}>{tabs.map(([id, icon, label]) => <Pressable key={id} accessibilityRole="tab" accessibilityState={{ selected: active === id }} style={styles.tab} onPress={() => onChange(id)}><Text style={[styles.tabIcon, active === id && styles.tabActive]}>{icon}</Text><Text style={[styles.tabLabel, active === id && styles.tabActive]}>{label}{id === 'cart' && cartCount ? ` (${cartCount})` : ''}</Text></Pressable>)}</View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, paddingTop: StatusBar.currentHeight || 0 },
  app: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 }, center: { alignItems: 'center', justifyContent: 'center' },
  header: { height: 78, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.line },
  mark: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: colors.pink, alignItems: 'center', justifyContent: 'center' },
  markText: { color: colors.pink, fontFamily: 'serif', fontSize: 17 },
  brand: { marginLeft: 11, flex: 1 }, brandName: { color: colors.text, fontFamily: 'serif', fontSize: 16, letterSpacing: 1 }, brandSmall: { color: colors.muted, fontSize: 8, letterSpacing: 2, marginTop: 4 },
  headerCart: { flexDirection: 'row', alignItems: 'center', gap: 7 }, headerCartText: { color: colors.text, fontWeight: '700' }, badge: { color: colors.background, backgroundColor: colors.pink, minWidth: 27, height: 27, borderRadius: 14, textAlign: 'center', lineHeight: 27, fontWeight: '700' },
  scroll: { padding: 22, paddingBottom: 44 }, list: { padding: 22, paddingBottom: 44 },
  hero: { minHeight: 560, padding: 24, justifyContent: 'flex-end', backgroundColor: '#25191d', borderWidth: 1, borderColor: '#4a3039' },
  eyebrow: { color: colors.pink, fontSize: 11, fontWeight: '700', letterSpacing: 2.2, marginBottom: 15 },
  heroTitle: { color: colors.text, fontFamily: 'serif', fontSize: 50, lineHeight: 54, letterSpacing: -2 }, italic: { color: colors.pink, fontStyle: 'italic' },
  lead: { color: '#ddd5d1', fontSize: 15, lineHeight: 23, marginTop: 18, marginBottom: 24 },
  primaryButton: { minHeight: 52, paddingHorizontal: 18, marginTop: 18, backgroundColor: colors.pink, alignItems: 'center', justifyContent: 'center' }, primaryButtonText: { color: colors.background, fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  benefits: { marginTop: 18, borderWidth: 1, borderColor: colors.line }, benefit: { padding: 20, borderBottomWidth: 1, borderBottomColor: colors.line }, benefitTitle: { color: colors.text, fontWeight: '700', marginBottom: 7 }, muted: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  pageTitle: { color: colors.text, fontFamily: 'serif', fontSize: 40, lineHeight: 45, letterSpacing: -1.5, marginBottom: 24 },
  input: { minHeight: 52, color: colors.text, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 15, marginBottom: 12, fontSize: 16 }, empty: { color: colors.muted, textAlign: 'center', marginVertical: 50 },
  product: { marginTop: 22, paddingBottom: 25, borderBottomWidth: 1, borderBottomColor: colors.line }, productVisual: { height: 300, backgroundColor: colors.panelSoft, alignItems: 'center', justifyContent: 'center' }, productMonogram: { color: '#5b4a50', fontFamily: 'serif', fontSize: 42 }, featured: { position: 'absolute', left: 12, top: 12, color: colors.background, backgroundColor: colors.pink, paddingVertical: 6, paddingHorizontal: 9, fontSize: 9, fontWeight: '800' },
  productCategory: { color: colors.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 14 }, productName: { color: colors.text, fontFamily: 'serif', fontSize: 18, marginTop: 7 }, productBottom: { marginTop: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, price: { color: colors.text, fontWeight: '700' }, addButton: { minHeight: 42, backgroundColor: colors.text, paddingHorizontal: 15, justifyContent: 'center' }, addText: { color: colors.background, fontSize: 10, fontWeight: '800' }, disabled: { opacity: 0.45 },
  cartItem: { flexDirection: 'row', gap: 13, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: colors.line }, cartThumb: { width: 70, height: 84, backgroundColor: colors.panelSoft, alignItems: 'center', justifyContent: 'center' }, cartInfo: { flex: 1, gap: 5 }, remove: { color: colors.pink, fontSize: 11 }, total: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 25 }, totalPrice: { color: colors.pink, fontFamily: 'serif', fontSize: 25 },
  auth: { flexGrow: 1, justifyContent: 'center', padding: 24 }, switchButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center' }, switchText: { color: colors.pink, fontSize: 13 },
  stats: { gap: 12, marginVertical: 18 }, stat: { minHeight: 120, padding: 18, borderWidth: 1, borderColor: colors.line, justifyContent: 'space-between' }, statValue: { color: colors.text, fontFamily: 'serif', fontSize: 36 }, loader: { marginVertical: 45 },
  outlineButton: { minHeight: 50, borderWidth: 1, borderColor: colors.text, alignItems: 'center', justifyContent: 'center', marginTop: 12 }, outlineText: { color: colors.text, fontSize: 11, fontWeight: '700', letterSpacing: 1 }, logoutButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', marginTop: 12 }, logoutText: { color: colors.danger, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  moreRow: { minHeight: 82, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.line, flexDirection: 'row', alignItems: 'center', gap: 15 }, moreCopy: { flex: 1 }, moreTitle: { color: colors.text, fontFamily: 'serif', fontSize: 17, marginBottom: 5 }, moreArrow: { color: colors.pink, fontSize: 22 },
  webScreen: { flex: 1, backgroundColor: colors.background }, webBar: { minHeight: 52, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, webBack: { minHeight: 44, justifyContent: 'center' }, webBackText: { color: colors.pink, fontWeight: '700', fontSize: 12 }, webBarTitle: { color: colors.text, fontFamily: 'serif', fontSize: 13, letterSpacing: 1.5 }, webView: { flex: 1, backgroundColor: colors.background }, webLoader: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.background },
  tabs: { height: 70, flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: '#0a0a0a' }, tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 }, tabIcon: { color: colors.muted, fontSize: 22 }, tabLabel: { color: colors.muted, fontSize: 9, fontWeight: '600' }, tabActive: { color: colors.pink },
})
