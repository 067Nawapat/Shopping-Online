import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../api/apiService';
import ConfirmModal from '../components/ConfirmModal';
import ProductCard from '../components/ProductCard';
import styles from '../styles/CategoryProductsScreen.styles';

const CategoryProductsScreen = ({ navigation, route }) => {
  const categoryId = route?.params?.categoryId ?? 0;
  const title = route?.params?.title || 'สินค้าทั้งหมด';

  const [products, setProducts] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [infoModal, setInfoModal] = useState(null);

  useEffect(() => {
    loadScreen();
  }, [categoryId]);

  const loadScreen = async () => {
    setLoading(true);
    try {
      const userData = await apiService.getUser();
      setUser(userData);

      const productData = categoryId
        ? await apiService.getProducts(categoryId)
        : await apiService.getProducts();
      setProducts(Array.isArray(productData) ? productData : []);

      if (userData?.id) {
        const wishlistData = await apiService.getWishlist(userData.id);
        if (Array.isArray(wishlistData)) {
          setWishlistIds(wishlistData.map((item) => item.id));
        }
      }
    } catch (error) {
      console.error('Load category products error:', error);
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadScreen();
  }, [categoryId]);

  const toggleWishlist = async (productId) => {
    if (!user) {
      setInfoModal({ title: 'แจ้งเตือน', message: 'กรุณาเข้าสู่ระบบเพื่อใช้งานสิ่งที่อยากได้' });
      return;
    }

    try {
      const result = await apiService.toggleWishlist(user.id, productId);
      if (result.status === 'added' || result.status === 'success') {
        setWishlistIds((prev) => [...prev, productId]);
      } else if (result.status === 'removed') {
        setWishlistIds((prev) => prev.filter((id) => id !== productId));
      }
    } catch (error) {
      console.error('Toggle wishlist error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={24} color="#0D0D0D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerBtn} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#0D0D0D" />
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              isWishlisted={wishlistIds.includes(item.id)}
              onWishlistPress={toggleWishlist}
              onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
            />
          )}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 15 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0D0D0D" />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>ไม่พบสินค้าในหมวดนี้</Text>
              <Text style={styles.emptySubtitle}>ลองกลับไปเลือกหมวดอื่น หรือเพิ่มข้อมูลสินค้าภายหลัง</Text>
            </View>
          }
        />
      )}

      <ConfirmModal
        visible={!!infoModal}
        title={infoModal?.title}
        message={infoModal?.message}
        confirmText="ตกลง"
        hideCancel
        onConfirm={() => setInfoModal(null)}
        onCancel={() => setInfoModal(null)}
      />
    </SafeAreaView>
  );
};

export default CategoryProductsScreen;
