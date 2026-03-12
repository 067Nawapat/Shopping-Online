import React from 'react';
import { View, Text, SafeAreaView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BLACK, MUTED } from '../utils/constants';

const NotificationsScreen = () => (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <Ionicons name="notifications-outline" size={64} color="#DDD" />
      <Text style={styles.title}>การแจ้งเตือน</Text>
      <Text style={styles.sub}>ยังไม่มีการแจ้งเตือนใหม่</Text>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: '700', color: BLACK, marginTop: 16 },
  sub: { fontSize: 14, color: MUTED, marginTop: 6 },
});

export default NotificationsScreen;
