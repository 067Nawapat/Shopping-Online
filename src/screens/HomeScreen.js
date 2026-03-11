import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../api/apiService';
import ConfirmModal from '../components/ConfirmModal';
import styles from '../styles/HomeScreen.styles';

const { width: screenWidth } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [feedProducts, setFeedProducts] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [infoModal, setInfoModal] = useState(null);
  const [activeBanner, setActiveBanner] = useState(0);

  const bannerListRef = useRef(null);
  const bannerIndexRef = useRef(0);

  useEffect(() => {
    initialLoad();
  }, []);

  useEffect(() => {
    if (featuredProducts.length <= 1) {
      return undefined;
    }

    const interval = setInterval(() => {
      bannerIndexRef.current = (bannerIndexRef.current + 1) % featuredProducts.length;
      bannerListRef.current?.scrollToIndex({
        index: bannerIndexRef.current,
        animated: true,
      });
      setActiveBanner(bannerIndexRef.current);
    }, 3500);

    return () => clearInterval(interval);
  }, [featuredProducts]);

  const initialLoad = async () => {
    setLoading(true);
    const userData = await fetchUser();
    await Promise.all([
      fetchCategories(),
      fetchHomeProducts(),
      userData ? fetchWishlist(userData.id) : Promise.resolve(),
    ]);
    setLoading(false);
  };

  const fetchUser = async () => {
    try {
      const userData = await apiService.getUser();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Fetch user error:', error);
      return null;
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await apiService.getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Fetch categories error:', error);
      setCategories([]);
    }
  };

  const fetchHomeProducts = async () => {
    try {
      const data = await apiService.getProducts();
      const productList = Array.isArray(data) ? data : [];
      setFeaturedProducts(productList.slice(0, 5));
      setFeedProducts(productList);
    } catch (error) {
      console.error('Fetch home products error:', error);
      setFeaturedProducts([]);
      setFeedProducts([]);
    }
  };

  const fetchWishlist = async (userId) => {
    try {
      const data = await apiService.getWishlist(userId);
      if (Array.isArray(data)) {
        setWishlistIds(data.map((item) => item.id));
      }
    } catch (error) {
      console.error('Fetch wishlist error:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const userData = await fetchUser();
    await Promise.all([
      fetchCategories(),
      fetchHomeProducts(),
      userData ? fetchWishlist(userData.id) : Promise.resolve(),
    ]);
    setRefreshing(false);
  }, []);

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

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'SO';

  const shortcutCategories = useMemo(() => categories.slice(0, 8), [categories]);

  const handleBannerScrollEnd = (event) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / (screenWidth - 32));
    bannerIndexRef.current = nextIndex;
    setActiveBanner(nextIndex);
  };

  const renderBanner = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.92}
      style={styles.bannerCard}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
    >
      <Image source={{ uri: item.image }} style={styles.bannerImage} resizeMode="cover" />
      <View style={styles.bannerShade} />
      <View style={styles.bannerOverlayTop}>
        <Text style={styles.bannerEyebrow}>{item.brand || 'Featured Drop'}</Text>
        <Text style={styles.bannerTitle} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.bannerSub} numberOfLines={1}>
          เริ่มต้น ฿{parseFloat(item.price || 0).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
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
                data={featuredProducts}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderBanner}
                horizontal
                pagingEnabled
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                snapToInterval={screenWidth - 32}
                snapToAlignment="start"
                onMomentumScrollEnd={handleBannerScrollEnd}
                contentContainerStyle={styles.bannerListContent}
                getItemLayout={(_, index) => ({
                  length: screenWidth - 32,
                  offset: (screenWidth - 32) * index,
                  index,
                })}
              />

              {featuredProducts.length > 1 ? (
                <View style={styles.bannerDots}>
                  {featuredProducts.map((item, index) => (
                    <View
                      key={item.id}
                      style={[styles.bannerDot, index === activeBanner && styles.bannerDotActive]}
                    />
                  ))}
                </View>
              ) : null}
            </View>

            <View style={styles.shortcutSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>เลือกช้อปตามหมวด</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.shortcutList}
              >
                {shortcutCategories.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.shortcutCard}
                    activeOpacity={0.88}
                    onPress={() =>
                      navigation.navigate('CategoryProducts', {
                        categoryId: item.id,
                        title: item.name,
                      })
                    }
                  >
                    <Text style={styles.shortcutTitle}>{item.name}</Text>
                    <View style={styles.shortcutArrow}>
                      <Ionicons name="arrow-forward" size={14} color="#0D0D0D" />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.feedSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>สินค้าแนะนำ</Text>
                <TouchableOpacity
                  style={styles.viewAllBtn}
                  onPress={() =>
                    navigation.navigate('CategoryProducts', {
                      categoryId: 0,
                      title: 'สินค้าทั้งหมด',
                    })
                  }
                >
                  <Text style={styles.viewAllText}>ดูทั้งหมด</Text>
                  <Ionicons name="chevron-forward" size={14} color="#9A9A9A" />
                </TouchableOpacity>
              </View>

              <View style={styles.feedGrid}>
                {feedProducts.map((item) => {
                  const isWishlisted = wishlistIds.includes(item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.feedCard}
                      activeOpacity={0.9}
                      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                    >
                      <View style={styles.feedImageContainer}>
                        <Image source={{ uri: item.image }} style={styles.feedProductImage} />
                        <View style={styles.feedSoldBadge}>
                          <Ionicons name="trending-up" size={10} color="#22C55E" />
                          <Text style={styles.feedSoldText}>{item.sold || '0'} sold</Text>
                        </View>
                      </View>
                      <View style={styles.feedContent}>
                        <Text style={styles.feedBrand}>{item.brand}</Text>
                        <Text style={styles.feedName} numberOfLines={2}>
                          {item.name}
                        </Text>
                        <View style={styles.feedPriceContainer}>
                          <Text style={styles.feedPriceLabel}>ราคาเริ่มต้น</Text>
                          <View style={styles.feedPriceRow}>
                            <Text style={styles.feedPrice}>฿{parseFloat(item.price || 0).toLocaleString()}</Text>
                            <Ionicons name="flash" size={12} color="#22C55E" style={{ marginLeft: 4 }} />
                          </View>
                        </View>
                      </View>
                      <TouchableOpacity style={styles.feedHeartBtn} onPress={() => toggleWishlist(item.id)}>
                        <Ionicons
                          name={isWishlisted ? 'heart' : 'heart-outline'}
                          size={18}
                          color={isWishlisted ? '#EF4444' : '#AAA'}
                        />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={{ height: 110 }} />
          </>
        )}
      </ScrollView>

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

export default HomeScreen;
