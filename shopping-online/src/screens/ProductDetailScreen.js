import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Modal,
  Animated,
  PanResponder,
  DeviceEventEmitter,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../api/apiService';
import ConfirmModal from '../components/ConfirmModal';
import ProductCard from '../components/ProductCard';
import styles from '../styles/ProductDetailScreen.styles';
import { BLACK, MUTED } from '../utils/constants';

const formatPrice = (value) => `฿ ${Math.round(Number(value) || 0).toLocaleString()}`;
const formatCompactPrice = (value) => `฿${Math.round(Number(value) || 0).toLocaleString()}`;

const formatReviewDate = (dateString) => {
  if (!dateString) return 'ล่าสุด';
  const created = new Date(dateString);
  if (Number.isNaN(created.getTime())) return 'ล่าสุด';
  const diff = Date.now() - created.getTime();
  const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  if (days === 0) return 'วันนี้';
  if (days === 1) return '1 วันที่ผ่านมา';
  if (days < 30) return `${days} วันที่ผ่านมา`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} เดือนที่ผ่านมา`;
  const years = Math.floor(months / 12);
  return `${years} ปีที่ผ่านมา`;
};

const ProductDetailScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [sizeModalVisible, setSizeModalVisible] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [confirmAction, setConfirmAction] = useState('buy');
  const [reviewExpanded, setReviewExpanded] = useState(true);
  const [detailExpanded, setDetailExpanded] = useState(true);
  const [modalConfig, setModalConfig] = useState(null);

  // Review Modal State
  const [allReviewsVisible, setAllReviewsVisible] = useState(false);
  const [ratingFilter, setRatingFilter] = useState(0); // 0 = All

  const panY = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) panY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 150 || gestureState.vy > 0.5) closeModal();
        else Animated.spring(panY, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  const closeModal = () => {
    Animated.timing(panY, { toValue: 1000, duration: 300, useNativeDriver: true }).start(() => {
      setSizeModalVisible(false);
      panY.setValue(0);
    });
  };

  useEffect(() => {
    loadFullDetail();
  }, [productId]);

  const loadFullDetail = async () => {
    setLoading(true);
    try {
      const userData = await apiService.getUser();
      setUser(userData);
      
      const response = await apiService.getProductDetail(productId);
      setProduct(response);
      setSelectedImage(0);
      setSelectedVariant(null);
      const defaultColor = response?.variants?.find((item) => item.color)?.color || null;
      setSelectedColor(defaultColor);

      if (userData) {
        const wishData = await apiService.getWishlist(userData.id);
        if (Array.isArray(wishData)) setWishlistIds(wishData.map(i => i.id));
      }

      // Fetch related products only from the same category
      if (response?.category_id) {
        const productsData = await apiService.getProducts(response.category_id, 1);
        setRelatedProducts((productsData || []).filter(item => item.id !== response.id).slice(0, 6));
      } else {
        setRelatedProducts([]);
      }
    } catch (error) {
      console.error('Load detail error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWishlist = async (id) => {
    if (!user) {
      setModalConfig({ title: 'แจ้งเตือน', message: 'กรุณาเข้าสู่ระบบเพื่อใช้งานสิ่งที่อยากได้' });
      return;
    }
    try {
      const res = await apiService.toggleWishlist(user.id, id);
      if (res.status === 'added') setWishlistIds(prev => [...prev, id]);
      else if (res.status === 'removed') setWishlistIds(prev => prev.filter(i => i !== id));
    } catch (error) {
      console.error('Toggle wishlist error:', error);
    }
  };

  const handleAction = (action) => {
    setConfirmAction(action === "cart" ? "cart" : "buy");
    panY.setValue(0);
    setSizeModalVisible(true);
  };

  const handleConfirm = async () => {
    if (!selectedVariant) {
      setModalConfig({ title: 'แจ้งเตือน', message: 'กรุณาเลือกไซส์' });
      return;
    }
    if (!user) {
      setSizeModalVisible(false);
      navigation.navigate('Auth');
      return;
    }
    if (confirmAction === "cart") {
      try {
        const res = await apiService.addToCart({ user_id: user.id, variant_id: selectedVariant.id, quantity: 1 });
        if (res.status === "success") {
          DeviceEventEmitter.emit('cartUpdated');
          setSizeModalVisible(false);
          setModalConfig({ title: 'สำเร็จ', message: 'เพิ่มสินค้าไปยังตะกร้าแล้ว' });
        }
      } catch (error) { console.error(error); }
    } else {
      setSizeModalVisible(false);
      navigation.navigate("Checkout", { buyNowProduct: product, buyNowVariant: selectedVariant });
    }
  };

  const images = useMemo(() => {
    if (!product) return [];
    return product.images?.length ? product.images : (product.image ? [product.image] : []);
  }, [product]);

  const variants = useMemo(() => {
    return [...(product?.variants || [])].sort((a, b) => {
      const aVal = parseFloat(String(a.size).replace(/[^\d.]/g, '')) || 0;
      const bVal = parseFloat(String(b.size).replace(/[^\d.]/g, '')) || 0;
      return aVal - bVal;
    });
  }, [product]);

  const maxPrice = useMemo(() => {
    if (!product?.variants?.length) return product?.price || 0;
    return Math.max(...product.variants.map(v => parseFloat(v.price) || 0));
  }, [product]);

  const colorOptions = useMemo(() => [...new Set(variants.map(i => i.color).filter(Boolean))], [variants]);
  const filteredVariants = useMemo(() => selectedColor ? variants.filter(i => i.color === selectedColor) : variants, [selectedColor, variants]);
  
  const reviews = product?.reviews || [];
  
  const totalReviews = useMemo(() => reviews.length, [reviews]);
  
  const ratingValue = useMemo(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0);
    return sum / reviews.length;
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    if (ratingFilter === 0) return reviews;
    return reviews.filter(r => Math.round(Number(r.rating)) === ratingFilter);
  }, [reviews, ratingFilter]);

  const ratingDistribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0];
    reviews.forEach(r => {
      const star = Math.round(Number(r.rating));
      if (star >= 1 && star <= 5) counts[star]++;
    });
    const total = reviews.length || 1;
    return [5, 4, 3, 2, 1].map(star => ({
      star,
      percent: Math.round((counts[star] / total) * 100)
    }));
  }, [reviews]);

  if (loading) return <View style={styles.loadingCenter}><ActivityIndicator size="large" color="#111" /></View>;
  if (!product) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={30} color="#111" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('MainTabs', { screen: 'ค้นหา' })}>
          <Ionicons name="search" size={28} color="#111" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroSection}>
          <Image source={{ uri: images[selectedImage] || product.image }} style={styles.mainImage} />
          <View style={styles.paginationDots}>
            {images.map((_, i) => <View key={i} style={[styles.dot, selectedImage === i && styles.activeDot]} />)}
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbContainer} contentContainerStyle={styles.thumbContent}>
          {images.map((img, i) => (
            <TouchableOpacity key={i} onPress={() => setSelectedImage(i)} style={[styles.thumbBox, selectedImage === i && styles.activeThumb]}>
              <Image source={{ uri: img }} style={styles.thumbImg} />
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.infoContent}>
          <Text style={styles.productName}>{product.name}</Text>
          <View style={styles.ratingRow}>
            <View style={styles.starsRow}>{[1, 2, 3, 4, 5].map(s => <Ionicons key={s} name={s <= Math.round(ratingValue) ? 'star' : 'star-outline'} size={18} color="#F4C534" />)}</View>
            <Text style={styles.ratingValue}>{ratingValue.toFixed(1)}</Text>
            <TouchableOpacity onPress={() => setAllReviewsVisible(true)}>
              <Text style={styles.reviewLink}>({totalReviews} รีวิว)</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.priceStatsRow}>
            <View style={styles.priceStatBox}><Text style={styles.statLabel}>เริ่มต้นที่</Text><Text style={styles.statValue}>{formatPrice(product.price)}</Text></View>
            <View style={[styles.priceStatBox, styles.verticalDivider]}><Text style={styles.statLabel}>ราคาสูงสุด</Text><Text style={styles.statValue}>{formatPrice(maxPrice)}</Text></View>
          </View>
          <View style={styles.guaranteeBanner}>
            <View style={styles.guaranteeLogo}><Text style={styles.guaranteeLogoText}>AUTH</Text></View>
            <Text style={styles.guaranteeText}>รับประกันของแท้ 100%</Text>
            <Ionicons name="information-circle-outline" size={22} color="#7B7B7B" />
          </View>
        </View>

        {/* ── รีวิว Section ── */}
        <View style={styles.sectionBlock}>
          <TouchableOpacity style={styles.sectionAccordionHeader} onPress={() => setReviewExpanded(!reviewExpanded)}>
            <Text style={styles.sectionTitle}>รีวิว</Text>
            <Ionicons name={reviewExpanded ? 'chevron-up' : 'chevron-down'} size={24} color="#111" />
          </TouchableOpacity>
          {reviewExpanded && (
            <View style={sectionInnerStyle}>
              <View style={styles.reviewScoreCard}>
                <View><Text style={styles.reviewScoreValue}>{ratingValue.toFixed(1)}</Text><Text style={styles.reviewScoreLabel}>จาก 5</Text></View>
                <View style={styles.reviewScoreRight}>
                  <View style={styles.reviewStarsLarge}>{[1, 2, 3, 4, 5].map(s => <Ionicons key={s} name="star" size={28} color="#F4C534" />)}</View>
                  <Text style={styles.reviewCountText}>{totalReviews} รีวิว</Text>
                </View>
              </View>

              <View style={styles.fitSection}>
                {ratingDistribution.map(item => (
                  <View key={item.star} style={styles.fitRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', width: 85 }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Ionicons 
                          key={s} 
                          name="star" 
                          size={10} 
                          color={s <= item.star ? "#F4C534" : "transparent"} 
                          style={{ marginRight: 1 }} 
                        />
                      ))}
                    </View>
                    <View style={styles.fitBarTrack}>
                      <View style={[styles.fitBarFill, { width: `${item.percent}%` }]} />
                    </View>
                    <Text style={styles.fitPercent}>{item.percent}%</Text>
                  </View>
                ))}
              </View>

              {reviews.slice(0, 3).map((item, index) => (
                <View key={index} style={styles.reviewCard}>
                  <View style={styles.reviewContentRow}>
                    <View style={styles.reviewTextContent}>
                      <View style={styles.reviewTop}>
                        <View style={styles.starsRow}>{[1, 2, 3, 4, 5].map(s => <Ionicons key={s} name={s <= item.rating ? "star" : "star-outline"} size={16} color="#F4C534" />)}</View>
                        <Text style={styles.reviewDate}>{formatReviewDate(item.created_at)}</Text>
                      </View>
                      <Text style={styles.reviewUser}>{item.user_name || "ผู้ใช้"}</Text>
                      <Text style={styles.reviewComment}>{item.comment}</Text>
                    </View>
                    {item.photos && item.photos.length > 0 && (
                      <Image source={{ uri: item.photos[0] }} style={styles.reviewSidePhoto} />
                    )}
                  </View>
                </View>
              ))}
              {reviews.length > 0 && (
                <TouchableOpacity style={styles.moreReviewButton} onPress={() => setAllReviewsVisible(true)}>
                  <Text style={styles.moreReviewButtonText}>ดูรีวิวทั้งหมด</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View style={styles.sectionBlock}>
          <TouchableOpacity style={styles.sectionAccordionHeader} onPress={() => setDetailExpanded(!detailExpanded)}>
            <Text style={styles.sectionTitle}>รายละเอียดสินค้า</Text>
            <Ionicons name={detailExpanded ? 'chevron-up' : 'chevron-down'} size={24} color="#111" />
          </TouchableOpacity>
          {detailExpanded && (
            <View style={styles.detailGrid}>
              <View style={styles.detailItem}><Text style={styles.detailLabel}>แบรนด์</Text><Text style={styles.detailValue}>{product.brand || '-'}</Text></View>
              <View style={styles.detailItem}><Text style={styles.detailLabel}>SKU</Text><Text style={styles.detailValue}>{product.sku || '-'}</Text></View>
              <View style={styles.detailItem}><Text style={styles.detailLabel}>สี</Text><Text style={styles.detailValue}>{selectedColor || colorOptions[0] || '-'}</Text></View>
            </View>
          )}
        </View>

        {relatedProducts.length > 0 && (
          <View style={styles.relatedSection}>
            <Text style={styles.relatedTitle}>สินค้าที่คุณอาจสนใจ</Text>
            <View style={relatedGridStyle}>
              {relatedProducts.map((item) => (
                <ProductCard key={item.id} product={item} isWishlisted={wishlistIds.includes(item.id)} onWishlistPress={toggleWishlist} onPress={() => navigation.push('ProductDetail', { productId: item.id })} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomActionBar}>
        <TouchableOpacity style={styles.favoriteColumn} onPress={() => toggleWishlist(product.id)}>
          <Ionicons name={wishlistIds.includes(product.id) ? "heart" : "heart-outline"} size={32} color={wishlistIds.includes(product.id) ? "#22C55E" : "#333"} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.sellButton} onPress={() => handleAction('cart')}><Text style={styles.darkButtonText}>เพิ่มลงตะกร้า</Text></TouchableOpacity>
        <TouchableOpacity style={styles.buyButton} onPress={() => handleAction('buy')}><Text style={styles.buyButtonText}>ซื้อ</Text></TouchableOpacity>
      </View>

      {/* ── Size/Buy Modal ── */}
      <Modal visible={sizeModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.sizeModalContent, { transform: [{ translateY: panY }] }]} {...panResponder.panHandlers}>
            <View style={styles.modalHandle} />
            <View style={styles.modalTabs}>
              <TouchableOpacity style={[styles.modalTab, confirmAction === 'buy' && styles.modalTabActive]} onPress={() => setConfirmAction('buy')}><Text style={[styles.modalTabText, confirmAction === 'buy' && styles.modalTabTextActive]}>ซื้อเลย</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalTab, confirmAction === 'cart' && styles.modalTabActive]} onPress={() => setConfirmAction('cart')}><Text style={[styles.modalTabText, confirmAction === 'cart' && styles.modalTabTextActive]}>เพิ่มลงตะกร้า</Text></TouchableOpacity>
            </View>
            <View style={styles.modalProductBrief}>
              <Image source={{ uri: product.image }} style={styles.briefImg} />
              <View style={styles.briefInfo}><Text style={styles.briefName} numberOfLines={1}>{product.name}</Text><Text style={styles.briefMeta}>{(product.brand || '').toUpperCase()} • {product.sku || '-'}</Text></View>
            </View>
            {colorOptions.length > 0 && (
              <View style={styles.sizeTabs}>
                {colorOptions.map((color) => (
                  <TouchableOpacity key={color} style={[styles.sizeTab, selectedColor === color && styles.sizeTabActive]} onPress={() => { setSelectedColor(color); if (selectedVariant?.color !== color) setSelectedVariant(null); }}>
                    <Text style={[styles.sizeTabText, selectedColor === color && styles.sizeTabTextActive]}>{color}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <FlatList
              data={filteredVariants}
              keyExtractor={(item) => item.id.toString()}
              numColumns={3}
              renderItem={({ item }) => (
                <TouchableOpacity style={[styles.sizeItem, selectedVariant?.id === item.id && styles.activeSizeItem]} onPress={() => setSelectedVariant(item)}>
                  <Text style={styles.sizeText}>{item.size}</Text>
                  <Text style={styles.sizePrice}>{formatCompactPrice(item.price)}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.sizeGridContent}
            />
            <TouchableOpacity style={styles.confirmBuyBtn} onPress={handleConfirm}><Text style={styles.confirmBtnPrice}>ยืนยัน</Text></TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* ── All Reviews Modal ── */}
      <Modal
        visible={allReviewsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAllReviewsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.sizeModalContent, { height: '90%' }]}>
            <View style={reviewModalHeaderStyle}>
              <Text style={reviewModalTitleStyle}>รีวิวทั้งหมด ({totalReviews})</Text>
              <TouchableOpacity onPress={() => setAllReviewsVisible(false)}>
                <Ionicons name="close" size={28} color="#111" />
              </TouchableOpacity>
            </View>

            {/* Rating Filter Tabs */}
            <View style={{ height: 50, marginBottom: 10 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                {[0, 5, 4, 3, 2, 1].map((star) => (
                  <TouchableOpacity
                    key={star}
                    style={[
                      filterTabStyle,
                      ratingFilter === star && filterTabActiveStyle
                    ]}
                    onPress={() => setRatingFilter(star)}
                  >
                    <Text style={[
                      filterTabTextStyle,
                      ratingFilter === star && filterTabActiveStyle
                    ]}>
                      {star === 0 ? 'ทั้งหมด' : `${star} ดาว`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <FlatList
              data={filteredReviews}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', marginTop: 50 }}>
                  <Text style={{ color: MUTED }}>ยังไม่มีรีวิวสำหรับคะแนนนี้</Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={reviewItemStyle}>
                  <View style={styles.reviewTop}>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <Ionicons 
                          key={s} 
                          name={s <= item.rating ? "star" : "star-outline"} 
                          size={14} 
                          color="#F4C534" 
                        />
                      ))}
                    </View>
                    <Text style={styles.reviewDate}>{formatReviewDate(item.created_at)}</Text>
                  </View>
                  <Text style={styles.reviewUser}>{item.user_name || "ผู้ใช้"}</Text>
                  <Text style={styles.reviewComment}>{item.comment}</Text>
                  {item.photos && item.photos.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                      {item.photos.map((p, i) => (
                        <Image key={i} source={{ uri: p }} style={reviewImageStyle} />
                      ))}
                    </ScrollView>
                  )}
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

      <ConfirmModal 
        visible={!!modalConfig} 
        title={modalConfig?.title} 
        message={modalConfig?.message} 
        confirmText="ตกลง" 
        hideCancel 
        onConfirm={() => setModalConfig(null)} 
      />
    </SafeAreaView>
  );
};

const sectionInnerStyle = {
    padding: 20,
    backgroundColor: '#fff',
};

const relatedGridStyle = {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
};

const reviewModalHeaderStyle = {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
};

const reviewModalTitleStyle = {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
};

const filterTabStyle = {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
};

const filterTabActiveStyle = {
    backgroundColor: BLACK,
    borderColor: BLACK,
};

const filterTabTextStyle = {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
};

const filterTabTextActiveStyle = {
    color: '#FFF',
};

const reviewItemStyle = {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
};

const reviewImageStyle = {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#F9F9F9',
};

export default ProductDetailScreen;
