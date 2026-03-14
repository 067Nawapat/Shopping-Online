import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../api/apiService';
import { BLACK, MUTED } from '../utils/constants';

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const userData = await apiService.getUser();
        setUser(userData);
        if (userData) {
          await fetchNotifications(userData.id);
        }
      } catch (error) {
        console.error('Init error:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const fetchNotifications = async (userId) => {
    if (!userId) return;
    try {
      const data = await apiService.getNotifications(userId);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log('Fetch notifications failed');
    }
  };

  const onRefresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    await fetchNotifications(user.id);
    setRefreshing(false);
  }, [user]);

  const renderItem = ({ item }) => (
    <View style={styles.notiCard}>
      <View style={[styles.iconContainer, { backgroundColor: getIconBgColor(item.type) }]}>
        <Ionicons name={getIconName(item.type)} size={24} color="#FFF" />
      </View>
      <View style={styles.notiContent}>
        <View style={styles.notiHeader}>
          <Text style={styles.notiTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.notiTime}>{formatDate(item.created_at)}</Text>
        </View>
        <Text style={styles.notiBody} numberOfLines={2}>{item.body}</Text>
      </View>
      {!item.is_read && <View style={styles.unreadDot} />}
    </View>
  );

  const getIconName = (type) => {
    switch (type) {
      case 'order': return 'cart';
      case 'promo': return 'pricetag';
      default: return 'notifications';
    }
  };

  const getIconBgColor = (type) => {
    switch (type) {
      case 'order': return '#4A90E2';
      case 'promo': return '#F5A623';
      default: return BLACK;
    }
  };

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('th-TH', { 
          day: 'numeric', 
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
      });
    } catch (e) { return dateStr; }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screenHeader}>
        <Text style={styles.headerTitle}>การแจ้งเตือน</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={BLACK} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="notifications-off-outline" size={64} color="#DDD" />
          <Text style={styles.emptyTitle}>ไม่มีการแจ้งเตือน</Text>
          <Text style={styles.emptySub}>คุณจะได้รับการแจ้งเตือนเกี่ยวกับคำสั่งซื้อและโปรโมชั่นที่นี่</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLACK} />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  screenHeader: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 15,
    paddingBottom: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: BLACK },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: BLACK, marginTop: 16 },
  emptySub: { fontSize: 14, color: MUTED, textAlign: 'center', marginTop: 8 },
  listContent: { padding: 16 },
  notiCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notiContent: { flex: 1, marginLeft: 16 },
  notiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  notiTitle: { fontSize: 16, fontWeight: '700', color: BLACK, flex: 1, marginRight: 8 },
  notiTime: { fontSize: 11, color: MUTED },
  notiBody: { fontSize: 14, color: '#666', lineHeight: 20 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CCFF00',
    marginLeft: 8,
  },
});

export default NotificationsScreen;
