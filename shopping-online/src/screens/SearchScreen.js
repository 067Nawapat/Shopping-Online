import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  DeviceEventEmitter,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../api/apiService';
import ConfirmModal from '../components/ConfirmModal';
import ProductCard from '../components/ProductCard';
import styles from '../styles/SearchScreen.styles';
import { BLACK, MUTED } from '../utils/constants';

const SearchScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([{ id: null, name: 'ทั้งหมด' }]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [activeFilter, setActiveFilter] = useState(1); 
  const [sortOrder, setSortOrder] = useState('asc');
  const [user, setUser] = useState(null);
  const [infoModal, setInfoModal] = useState(null);

  const latestQuery = useRef('');
  const latestActiveTab = useRef(0);
  const latestCategories = useRef([{ id: null, name: 'ทั้งหมด' }]);

  useEffect(() => {
    initialLoad();

    const subscription = DeviceEventEmitter.addListener('searchQuery', (text) => {
      const trimmedText = text || '';
      latestQuery.current = trimmedText;
      setQuery(trimmedText);
      performSearch();
    });

    // Request current search query from TabBar if it already exists
    DeviceEventEmitter.emit('requestSearchSync');

    return () => subscription.remove();
  }, []);

  const initialLoad = async () => {
    setLoading(true);
    try {
      const userData = await apiService.getUser();
      setUser(userData);
      
      const [catsData, prodsData] = await Promise.all([
        apiService.getCategories(),
        apiService.getProducts()
      ]);

      if (Array.isArray(catsData)) {
        const fullCats = [{ id: null, name: 'ทั้งหมด' }, ...catsData];
        setCategories(fullCats);
        latestCategories.current = fullCats;
      }
      
      // Only set initial products if we aren't already searching
      if (!latestQuery.current) {
        setProducts(Array.isArray(prodsData) ? prodsData : []);
      } else {
        performSearch();
      }

      if (userData) {
        const wishData = await apiService.getWishlist(userData.id);
        if (Array.isArray(wishData)) setWishlistIds(wishData.map(item => item.id));
      }
    } catch (error) {
      console.error('Initial load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    const searchText = latestQuery.current;
    const catIndex = latestActiveTab.current;
    const cats = latestCategories.current;

    setLoading(true);
    try {
      if (searchText.trim()) {
        const data = await apiService.searchProducts(searchText);
        setProducts(Array.isArray(data) ? data : []);
      } else {
        const catId = cats[catIndex]?.id;
        const data = await apiService.getProducts(catId);
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Search error:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabPress = (index, categoryId) => {
    setActiveTab(index);
    latestActiveTab.current = index;
    // Reset search query when changing tabs manually via screen tabs
    latestQuery.current = '';
    setQuery('');
    performSearch();
    // Also notify TabBar to clear its input
    DeviceEventEmitter.emit('clearSearchInput');
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

  const handleFilterPress = (filterId) => {
    if (filterId === 2) { 
      if (activeFilter === 2) {
        setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setActiveFilter(2);
        setSortOrder('asc');
      }
    } else {
      setActiveFilter(filterId);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    let result = [...products];
    if (activeFilter === 2) {
      result.sort((a, b) => {
        const priceA = parseFloat(a.price) || 0;
        const priceB = parseFloat(b.price) || 0;
        return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
      });
    } else {
      result.sort((a, b) => b.id - a.id);
    }
    return result;
  }, [products, activeFilter, sortOrder]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await performSearch();
    if (user) {
      const wishData = await apiService.getWishlist(user.id);
      if (Array.isArray(wishData)) setWishlistIds(wishData.map(i => i.id));
    }
    setRefreshing(false);
  }, [user]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLACK} />}
      >
        <View style={styles.tabBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContent}>
            {categories.map((cat, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.tabItem, activeTab === idx && styles.activeTab]}
                onPress={() => handleTabPress(idx, cat.id)}
              >
                <Text style={[styles.tabText, activeTab === idx && styles.activeTabText]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.filterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
            {[
              { id: 1, label: 'สำหรับคุณ', icon: 'sparkles', iconColor: '#333' },
              { 
                id: 2, 
                label: activeFilter === 2 ? (sortOrder === 'asc' ? 'ราคาต่ำ-สูง' : 'ราคาสูง-ต่ำ') : 'ราคา', 
                icon: activeFilter === 2 ? (sortOrder === 'asc' ? 'arrow-up' : 'arrow-down') : 'swap-vertical', 
                iconColor: '#333' 
              }
            ].map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[styles.filterBadge, activeFilter === f.id && styles.activeFilter]}
                onPress={() => handleFilterPress(f.id)}
              >
                <Ionicons name={f.icon} size={13} color={activeFilter === f.id ? '#fff' : f.iconColor} />
                <Text style={[styles.filterText, activeFilter === f.id && styles.activeFilterText]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={BLACK} style={{ marginTop: 50 }} />
        ) : filteredProducts.length === 0 ? (
          <View style={{ height: 300, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="search-outline" size={48} color="#DDD" />
            <Text style={{ color: '#AAA', marginTop: 12 }}>
              {query.trim() ? `ไม่พบสินค้า "${query}"` : 'ไม่พบสินค้าที่คุณต้องการ'}
            </Text>
          </View>
        ) : (
          <View style={styles.productListContainer}>
             {filteredProducts.map((item) => (
                <View key={item.id} style={{ width: '48%', marginBottom: 15 }}>
                  <ProductCard 
                    product={item} 
                    isWishlisted={wishlistIds.includes(item.id)}
                    onWishlistPress={toggleWishlist}
                    onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                  />
                </View>
             ))}
          </View>
        )}
      </ScrollView>

      <ConfirmModal
        visible={!!infoModal}
        title={infoModal?.title}
        message={infoModal?.message}
        confirmText="ตกลง"
        hideCancel
        onConfirm={() => setInfoModal(null)}
      />
    </SafeAreaView>
  );
};

export default SearchScreen;
