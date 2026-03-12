import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  DeviceEventEmitter,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../api/apiService';
import ConfirmModal from '../components/ConfirmModal';
import ProductCard from '../components/ProductCard';
import styles from '../styles/SearchScreen.styles';

const TABS = ['ทั้งหมด', 'Streetwear', 'Luxury', 'ของสะสม', 'มือสอง'];

const SearchScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [activeFilter, setActiveFilter] = useState(1);
  const [user, setUser] = useState(null);
  const [infoModal, setInfoModal] = useState(null);

  useEffect(() => {
    initialLoad();
  }, []);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('searchQuery', (text) => {
      setQuery(text || '');
      if (text) {
        handleSearch(text);
      } else {
        fetchProducts();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const initialLoad = async () => {
    setLoading(true);
    const userData = await apiService.getUser();
    setUser(userData);
    await Promise.all([
      fetchProducts(), 
      fetchBrands(),
      userData ? fetchWishlist(userData.id) : Promise.resolve()
    ]);
    setLoading(false);
  };

  const fetchWishlist = async (userId) => {
    try {
      const data = await apiService.getWishlist(userId);
      if (Array.isArray(data)) {
        setWishlistIds(data.map(item => item.id));
      }
    } catch (error) {
      console.error('Fetch wishlist error:', error);
    }
  };

  const toggleWishlist = async (productId) => {
    if (!user) {
      setInfoModal({ title: 'แจ้งเตือน', message: 'กรุณาเข้าสู่ระบบเพื่อใช้งานสิ่งที่อยากได้' });
      return;
    }

    try {
      const result = await apiService.toggleWishlist(user.id, productId);
      if (result.status === 'added') {
        setWishlistIds(prev => [...prev, productId]);
      } else if (result.status === 'removed') {
        setWishlistIds(prev => prev.filter(id => id !== productId));
      }
    } catch (error) {
      console.error('Toggle wishlist error:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await apiService.getProducts();
      setProducts(data || []);
    } catch (error) {
      console.error('Fetch products error:', error);
      setProducts([]);
    }
  };

  const fetchBrands = async () => {
    try {
      const data = await apiService.getProducts();
      const uniqueBrands = [...new Set(data.map(item => item.brand))].filter(Boolean).map((name, index) => ({ id: String(index), name }));
      setBrands(uniqueBrands.slice(0, 10));
    } catch (error) {
      console.error('Fetch brands error:', error);
    }
  };

  const handleSearch = async (text) => {
    try {
      const data = await apiService.searchProducts(text);
      setProducts(data || []);
    } catch (error) {
      console.error('Search products error:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const userData = await apiService.getUser();
    if (query) {
      await handleSearch(query);
    } else {
      await fetchProducts();
    }
    if (userData) await fetchWishlist(userData.id);
    setRefreshing(false);
  }, [query]);

  const filteredProducts = useMemo(() => {
    return products;
  }, [products]);

  const FILTERS = [
    { id: 0, label: 'พร้อมส่ง', icon: 'flash', iconColor: '#22C55E' },
    { id: 1, label: 'สำหรับคุณ', icon: 'sparkles', iconColor: '#fff' },
    { id: 2, label: 'ราคาต่ำ-สูง', icon: 'arrow-up', iconColor: '#333' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContent}>
          {TABS.map((tab, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.tabItem, activeTab === idx && styles.activeTab]}
              onPress={() => setActiveTab(idx)}
            >
              <Text style={[styles.tabText, activeTab === idx && styles.activeTabText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.brandContainer}>
        <Text style={styles.sectionTitle}>แบรนด์ยอดนิยม</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {brands.map((brand) => (
            <TouchableOpacity key={brand.id} style={styles.brandItem}>
              <View style={styles.brandIconPlaceholder}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#0D0D0D' }}>
                  {brand.name ? brand.name.substring(0, 1) : '?'}
                </Text>
              </View>
              <Text style={styles.brandName} numberOfLines={1}>{brand.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterBadge, activeFilter === f.id && styles.activeFilter]}
              onPress={() => setActiveFilter(f.id)}
            >
              <Ionicons
                name={f.icon}
                size={13}
                color={activeFilter === f.id ? '#fff' : f.iconColor}
              />
              <Text
                style={[styles.filterText, activeFilter === f.id && styles.activeFilterText]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.filterIconBtn}>
          <Ionicons name="options-outline" size={20} color="#333" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#0D0D0D"
          style={{ marginTop: 40 }}
        />
      ) : filteredProducts.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="search-outline" size={48} color="#DDD" />
          <Text style={{ color: '#AAA', marginTop: 12, fontSize: 14 }}>
            ไม่พบสินค้า "{query}"
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
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
          contentContainerStyle={[styles.productList, { paddingBottom: 110 }]}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0D0D0D"
            />
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

export default SearchScreen;
