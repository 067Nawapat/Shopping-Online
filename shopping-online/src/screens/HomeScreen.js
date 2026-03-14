import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  ImageBackground,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../api/apiService';
import ConfirmModal from '../components/ConfirmModal';
import ProductCard from '../components/ProductCard';
import styles from '../styles/HomeScreen.styles';
import bannerStyles from '../styles/banner.styles';

const { width: screenWidth } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [feedProducts, setFeedProducts] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [infoModal, setInfoModal] = useState(null);
  const [activeBanner, setActiveBanner] = useState(0);
  const [activeCategory, setActiveCategory] = useState('all');

  const bannerListRef = useRef(null);
  const bannerIndexRef = useRef(0);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    initialLoad();
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchHomeProducts(activeCategory);
    }
  }, [activeCategory]);

  useEffect(() => {
    if (banners.length <= 1) return undefined;

    const interval = setInterval(() => {
      if (!isMounted.current) return;
      bannerIndexRef.current = (bannerIndexRef.current + 1) % banners.length;
      bannerListRef.current?.scrollToIndex({
        index: bannerIndexRef.current,
        animated: true,
      });
      setActiveBanner(bannerIndexRef.current);
    }, 4000);

    return () => clearInterval(interval);
  }, [banners]);

  const initialLoad = async () => {
    setLoading(true);
    const userData = await fetchUser();
    await Promise.all([
      fetchCategories(),
      fetchBanners(),
      userData ? fetchWishlist(userData.id) : Promise.resolve(),
    ]);
    await fetchHomeProducts('all');
    if (isMounted.current) setLoading(false);
  };

  const fetchUser = async () => {
    try {
      const userData = await apiService.getUser();
      if (isMounted.current) setUser(userData);
      return userData;
    } catch (error) {
      console.error('Fetch user error:', error);
      return null;
    }
  };

  const fetchWishlist = async (userId) => {
    try {
      const data = await apiService.getWishlist(userId);
      if (isMounted.current && Array.isArray(data)) {
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

  const fetchCategories = async () => {
    try {
      const data = await apiService.getCategories();
      let catList = Array.isArray(data) ? data : [];
      catList = [{ id: 'all', name: 'ทั้งหมด' }, ...catList];
      if (isMounted.current) {
        setCategories(catList);
      }
    } catch (error) {
      console.error('Fetch categories error:', error);
    }
  };

  const fetchBanners = async () => {
    try {
      const data = await apiService.getBanners();
      const bannerList = Array.isArray(data) ? data : [];
      if (isMounted.current) setBanners(bannerList.slice(0, 3));
    } catch (error) {
      console.error('Fetch banners error:', error);
    }
  };

  const fetchHomeProducts = async (catId) => {
    try {
      const actualId = catId === 'all' ? null : catId;
      const data = await apiService.getProducts(actualId);
      if (isMounted.current) {
        let products = Array.isArray(data) ? data : [];
        if (catId === 'all') {
          products.sort((a, b) => (parseInt(b.sold) || 0) - (parseInt(a.sold) || 0));
        }
        setFeedProducts(products);
      }
    } catch (error) {
      console.error('Fetch home products error:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const userData = await fetchUser();
    await Promise.all([
      fetchCategories(),
      fetchBanners(),
      fetchHomeProducts(activeCategory),
      userData ? fetchWishlist(userData.id) : Promise.resolve(),
    ]);
    if (isMounted.current) setRefreshing(false);
  }, [activeCategory]);

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'SO';

  const handleBannerScrollEnd = (event) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    bannerIndexRef.current = nextIndex;
    setActiveBanner(nextIndex);
  };

  const renderBanner = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={bannerStyles.bannerContainer}
      onPress={() => item.product_id && navigation.navigate('ProductDetail', { productId: item.product_id })}
    >
      <ImageBackground source={{ uri: item.image }} style={bannerStyles.imageBackground} resizeMode="cover">
        <View style={bannerStyles.overlay}>
          <View style={bannerStyles.textSection}>
            <Text style={bannerStyles.eyebrow}>ดีลพิเศษวันนี้</Text>
            <Text style={bannerStyles.title} numberOfLines={2}>{item.title}</Text>
            <Text style={bannerStyles.description} numberOfLines={1}>{item.subtitle}</Text>
          </View>
          <TouchableOpacity 
            style={bannerStyles.cartIcon}
            onPress={() => item.product_id && navigation.navigate('ProductDetail', { productId: item.product_id })}
          >
            <Ionicons name="cart-outline" size={26} color="white" />
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>หน้าหลัก</Text>
          <TouchableOpacity
            style={styles.avatarBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('โปรไฟล์')}
          >
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shortcutList}
          style={styles.shortcutScroll}
        >
          {categories.slice(0, 8).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.shortcutCard, activeCategory === item.id && styles.shortcutCardActive]}
              onPress={() => setActiveCategory(item.id)}
            >
              <Text style={[styles.shortcutTitle, activeCategory === item.id && styles.shortcutTitleActive]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0D0D0D" />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#0D0D0D" style={{ marginTop: 48 }} />
        ) : (
          <>
            <View style={styles.bannerSection}>
              <FlatList
                ref={bannerListRef}
                data={banners}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderBanner}
                horizontal
                pagingEnabled={false}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                snapToInterval={screenWidth}
                snapToAlignment="center"
                onMomentumScrollEnd={handleBannerScrollEnd}
                getItemLayout={(_, index) => ({ length: screenWidth, offset: screenWidth * index, index })}
              />
              {banners.length > 1 && (
                <View style={styles.bannerDots}>
                  {banners.map((_, index) => (
                    <View key={index} style={[styles.bannerDot, index === activeBanner && styles.bannerDotActive]} />
                  ))}
                </View>
              )}
            </View>

            <View style={styles.feedSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {activeCategory === 'all' 
                    ? 'สินค้าแนะนำ' 
                    : `สินค้าหมวด${categories.find(c => c.id === activeCategory)?.name || ''}`
                  }
                </Text>
                <TouchableOpacity 
                  style={styles.viewAllBtn}
                  onPress={() => navigation.navigate('CategoryProducts', { 
                    categoryId: activeCategory === 'all' ? null : activeCategory,
                    title: activeCategory === 'all' 
                      ? 'สินค้าทั้งหมด' 
                      : categories.find(c => c.id === activeCategory)?.name 
                  })}
                >
                  <Text style={styles.viewAllText}>ดูทั้งหมด</Text>
                  <Ionicons name="chevron-forward" size={14} color="#9A9A9A" />
                </TouchableOpacity>
              </View>
              <View style={styles.feedGrid}>
                {feedProducts.length > 0 ? (
                  feedProducts.slice(0, 6).map((item) => (
                    <ProductCard 
                      key={item.id} 
                      product={item} 
                      isWishlisted={wishlistIds.includes(item.id)}
                      onWishlistPress={toggleWishlist}
                      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                    />
                  ))
                ) : (
                  <View style={{ width: screenWidth - 40, padding: 40, alignItems: 'center' }}>
                    <Text style={{ color: '#9A9A9A' }}>ไม่พบสินค้าในหมวดหมู่นี้</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={{ height: 110 }} />
          </>
        )}
      </ScrollView>
      <ConfirmModal visible={!!infoModal} title={infoModal?.title} message={infoModal?.message} onConfirm={() => setInfoModal(null)} />
    </SafeAreaView>
  );
};

export default HomeScreen;
