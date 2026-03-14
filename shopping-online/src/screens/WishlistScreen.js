import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../api/apiService';
import ProductCard from '../components/ProductCard';
import ConfirmModal from '../components/ConfirmModal';
import { SPACING } from '../styles/theme'; // นำเข้า SPACING เพื่อใช้เว้นระยะเฮดเดอร์

const WishlistScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [infoModal, setInfoModal] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const userData = await apiService.getUser();
      if (!userData) {
        navigation.navigate('Auth');
        return;
      }
      setUser(userData);
      await fetchWishlist(userData.id);
    } catch (error) {
      console.error('Load wishlist data error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchWishlist = async (userId) => {
    try {
      const data = await apiService.getWishlist(userId);
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Fetch wishlist error:', error);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (user) fetchWishlist(user.id).finally(() => setRefreshing(false));
    else loadData();
  }, [user]);

  const toggleWishlist = async (productId) => {
    if (!user) return;
    try {
      const result = await apiService.toggleWishlist(user.id, productId);
      if (result.status === 'removed') {
        setProducts(prev => prev.filter(p => p.id !== productId));
      }
    } catch (error) {
      console.error('Toggle wishlist error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header พร้อมการเว้นระยะแบบเดียวกับหน้าอื่น ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#0D0D0D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>สินค้าที่คุณสนใจ</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color="#0D0D0D" />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0D0D0D" />}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              isWishlisted={true}
              onWishlistPress={() => toggleWishlist(item.id)}
              onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="heart-outline" size={64} color="#DDD" />
              <Text style={styles.emptyText}>คุณยังไม่มีสินค้าที่สนใจ</Text>
              <TouchableOpacity
                style={styles.shopBtn}
                onPress={() => navigation.navigate('หน้าหลัก')}
              >
                <Text style={styles.shopBtnText}>ไปช้อปเลย</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <ConfirmModal
        visible={!!infoModal}
        title={infoModal?.title}
        message={infoModal?.message}
        onConfirm={() => setInfoModal(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: SPACING.headerTop, // ใช้ระยะเว้นจากธีมเดียวกับหน้าอื่น
    paddingBottom: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0D0D0D' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  listContent: { padding: 15, paddingBottom: 110 },
  columnWrapper: { justifyContent: 'space-between' },
  centerWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 15, marginBottom: 20 },
  shopBtn: {
    backgroundColor: '#0D0D0D',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 100,
  },
  shopBtnText: { color: '#FFF', fontWeight: '700' },
});

export default WishlistScreen;
