import React from 'react'
import { StyleSheet, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'

const STOREFRONT_URL = 'https://shop.tinashenyenyesa.co.zw/'

export default function App() {
  return (
    <View style={styles.app}>
      <StatusBar style="light" backgroundColor="#070707" />
      {React.createElement('iframe', {
        src: STOREFRONT_URL,
        title: 'Maps Kayz customer storefront',
        allow: 'clipboard-read; clipboard-write; payment; camera',
        style: {
          width: '100%',
          height: '100%',
          border: 0,
          display: 'block',
          background: '#070707',
        },
      })}
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
})
