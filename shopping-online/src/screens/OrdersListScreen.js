import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { apiService } from '../api/apiService';
import { BLACK, MUTED } from '../utils/constants';
import { SPACING, SHADOW } from '../styles/theme';
import { extractOrders, normalizeOrderStatus } from '../utils/orderUtils';
import ConfirmModal from '../components/ConfirmModal';

const OrdersListScreen = ({ navigation, route }) => {
  const { type } = route.params || { type: 'to_ship' };
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tracking Modal State
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [isFetchingTracking, setIsFetchingTracking] = useState(false);
  const [currentTrackingNo, setCurrentTrackingNo] = useState('');

  // Review Modal State
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState([]);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Alert Modal State
  const [modalConfig, setModalConfig] = useState(null);

  const getConfig = () => {
    switch (type) {
      case 'to_ship':
        return {
          title: 'รอการจัดส่ง',
          emptyTitle: 'ไม่มีรายการรอการจัดส่ง',
          emptySub: 'เมื่อคุณชำระเงินแล้ว รายการจะมาแสดงที่นี่',
          icon: 'cube-outline',
          statusLabel: 'รอการจัดส่ง',
          badgeColor: '#F59E0B',
          badgeBg: '#FFFBEB',
          filter: (o) => {
            const s = normalizeOrderStatus(o);
            return s === 'waiting' || s === 'verifying';
          }
        };
      case 'to_receive':
        return {
          title: 'ที่ต้องได้รับ',
          emptyTitle: 'ไม่มีรายการที่ต้องได้รับ',
          emptySub: 'คุณสามารถติดตามสถานะการจัดส่งได้ที่นี่',
          icon: 'car-outline',
          statusLabel: 'กำลังจัดส่ง',
          badgeColor: '#3B82F6',
          badgeBg: '#EFF6FF',
          filter: (o) => normalizeOrderStatus(o) === 'shipping'
        };
      case 'completed':
        return {
          title: 'จัดส่งสำเร็จ',
          emptyTitle: 'ไม่มีรายการที่สำเร็จ',
          emptySub: 'รายการที่จัดส่งสำเร็จแล้วจะมาแสดงที่นี่',
          icon: 'checkmark-circle-outline',
          statusLabel: 'สำเร็จแล้ว',
          badgeColor: '#10B981',
          badgeBg: '#ECFDF5',
          filter: (o) => normalizeOrderStatus(o) === 'completed'
        };
      default:
        return {
          title: 'คำสั่งซื้อ',
          emptyTitle: 'ไม่มีรายการ',
          emptySub: '',
          icon: 'receipt-outline',
          statusLabel: 'ปกติ',
          badgeColor: BLACK,
          badgeBg: '#F0F0F0',
          filter: () => true
        };
    }
  };

  const config = getConfig();

  useEffect(() => {
    fetchData();
    const unsubscribe = navigation.addListener('focus', fetchData);
    return unsubscribe;
  }, [navigation, type]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const userData = await apiService.getUser();
      if (!userData) {
        setOrders([]);
        return;
      }

      const response = await apiService.getOrders(userData.id);
      const ordersArray = extractOrders(response);
      const filteredOrders = ordersArray.filter(config.filter);
      setOrders(filteredOrders);
    } catch (error) {
      console.error('Fetch orders error:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (productInfo) => {
    if (productInfo.is_reviewed) {
      setModalConfig({ title: 'แจ้งเตือน', message: 'คุณได้รีวิวสินค้านี้ไปเรียบร้อยแล้ว' });
      return;
    }

    setSelectedProduct({
      id: productInfo.product_id,
      name: productInfo.name,
      image: productInfo.image,
    });
    setRating(5);
    setComment('');
    setImages([]);
    setReviewModalVisible(true);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setModalConfig({ title: 'ขออภัย', message: 'เราต้องการสิทธิ์ในการเข้าถึงรูปภาพของคุณ' });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled) {
      const selectedImages = result.assets.map(asset => ({
        uri: asset.uri,
        base64: asset.base64,
        name: asset.fileName || `review_${Date.now()}.jpg`,
      }));
      setImages([...images, ...selectedImages].slice(0, 5)); // Limit to 5 images
    }
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      setModalConfig({ title: 'แจ้งเตือน', message: 'กรุณาให้คะแนนสินค้า' });
      return;
    }

    setSubmittingReview(true);
    try {
      const user = await apiService.getUser();
      if (!user) {
        setModalConfig({ title: 'แจ้งเตือน', message: 'กรุณาเข้าสู่ระบบก่อนเขียนรีวิว' });
        return;
      }

      const payload = {
        product_id: selectedProduct.id,
        user_id: user.id,
        rating: rating,
        comment: comment,
        photos: images.map(img => img.base64),
      };

      const res = await apiService.addReview(payload);
      if (res && res.status === 'success') {
        setReviewModalVisible(false);
        setModalConfig({ title: 'สำเร็จ', message: 'ขอบคุณสำหรับการรีวิวของคุณ' });
        fetchData(); // Refresh list to update review status
      } else {
        setModalConfig({ title: 'ไม่สำเร็จ', message: res?.message || 'ไม่สามารถบันทึกรีวิวได้' });
      }
    } catch (error) {
      console.error('Submit review error:', error);
      setModalConfig({ title: 'ไม่สำเร็จ', message: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleTrackShipment = async (trackingNumber) => {
    if (!trackingNumber) {
      setModalConfig({ title: 'แจ้งเตือน', message: 'ไม่พบเลขพัสดุสำหรับรายการนี้' });
      return;
    }

    setCurrentTrackingNo(trackingNumber);
    setTrackingModalVisible(true);
    setIsFetchingTracking(true);
    setTrackingData(null);

    try {
      const res = await apiService.trackShipment(trackingNumber);
      if (res && res.status && res.response && res.response.items) {
        const items = res.response.items[trackingNumber];
        setTrackingData(items || []);
      } else {
        setTrackingData([]);
      }
    } catch (error) {
      console.error('Tracking error:', error);
      setTrackingData([]);
    } finally {
      setIsFetchingTracking(false);
    }
  };

  const renderTrackingItem = (item, index) => (
    <View key={index} style={styles.trackStep}>
      <View style={styles.trackLineContainer}>
        <View style={[styles.trackDot, index === 0 && styles.trackDotActive]} />
        {index !== (trackingData.length - 1) && <View style={styles.trackLine} />}
      </View>
      <View style={styles.trackContent}>
        <Text style={[styles.trackStatus, index === 0 && styles.trackStatusActive]}>
          {item.status_description}
        </Text>
        <Text style={styles.trackLocation}>{item.location} {item.postcode}</Text>
        <Text style={styles.trackDate}>{item.status_date}</Text>
      </View>
    </View>
  );

  const renderItem = ({ item }) => {
    const totalPrice = Number(item.total_price || 0);
    const orderDate = item.created_at
      ? new Date(item.created_at).toLocaleDateString('th-TH')
      : '-';
    const firstItem = item.items?.[0];
    const extraItemCount = Math.max((item.items?.length || 0) - 1, 0);
    const productName = firstItem?.name || 'ยังไม่มีข้อมูลสินค้า';
    const productMeta = firstItem?.brand
      ? firstItem.size && firstItem.size !== '-'
        ? `${firstItem.brand} • ไซซ์ ${firstItem.size}`
        : firstItem.brand
      : firstItem?.size && firstItem.size !== '-'
        ? `ไซซ์ ${firstItem.size}`
        : extraItemCount > 0
          ? `และสินค้าอื่นอีก ${extraItemCount} รายการ`
          : 'ไม่มีข้อมูลรายการ';

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderIdText}>หมายเลขคำสั่งซื้อ #{item.id}</Text>
          <Text style={[styles.statusBadge, { color: config.badgeColor, backgroundColor: config.badgeBg }]}>
            {config.statusLabel}
          </Text>
        </View>

        <View style={styles.orderBody}>
          {firstItem?.image ? (
            <Image source={{ uri: firstItem.image }} style={styles.productImage} />
          ) : (
            <View style={styles.placeholderImg}>
              <Ionicons name="cube-outline" size={30} color="#DDD" />
            </View>
          )}
          <View style={styles.orderMainInfo}>
            <Text style={styles.productName} numberOfLines={2}>{productName}</Text>
            <Text style={styles.productMeta} numberOfLines={1}>
              {extraItemCount > 0 && firstItem
                ? `${productMeta} • อีก ${extraItemCount} รายการ`
                : productMeta}
            </Text>
            <Text style={styles.dateText}>วันที่สั่งซื้อ: {orderDate}</Text>
            {item.tracking_number && (
              <Text style={styles.trackingNoText}>เลขพัสดุ: {item.tracking_number}</Text>
            )}
          </View>
        </View>

        <View style={styles.orderFooter}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>ยอดรวมสุทธิ</Text>
            <Text style={styles.totalValue}>฿{totalPrice.toLocaleString()}</Text>
          </View>
          
          {type === 'completed' && (
             <TouchableOpacity 
                style={[styles.actionButton, firstItem?.is_reviewed && styles.disabledBtn]} 
                onPress={() => openReviewModal(firstItem)}
             >
                <Text style={styles.actionButtonText}>
                  {firstItem?.is_reviewed ? 'รีวิวแล้ว' : 'เขียนรีวิวสินค้า'}
                </Text>
             </TouchableOpacity>
          )}

          {type === 'to_receive' && (
             <TouchableOpacity 
                style={styles.actionButton} 
                onPress={() => handleTrackShipment(item.tracking_number)}
             >
                <Text style={styles.actionButtonText}>เช็คสถานะพัสดุ</Text>
             </TouchableOpacity>
          )}

          {type === 'to_ship' && (
             <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#F0F0F0' }]}>
                <Text style={[styles.actionButtonText, { color: BLACK }]}>ดูรายละเอียด</Text>
             </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={BLACK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{config.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={BLACK} />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name={config.icon} size={64} color="#DDD" />
          <Text style={emptyTitleStyle}>{config.emptyTitle}</Text>
          <Text style={styles.emptySub}>{config.emptySub}</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Tracking Modal */}
      <Modal
        visible={trackingModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setTrackingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>สถานะการจัดส่ง</Text>
              <TouchableOpacity onPress={() => setTrackingModalVisible(false)}>
                <Ionicons name="close" size={24} color={BLACK} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.trackingInfoCard}>
              <Text style={styles.infoLabel}>เลขพัสดุ</Text>
              <Text style={styles.infoValue}>{currentTrackingNo}</Text>
              <Text style={[styles.infoLabel, {marginTop: 8}]}>ผู้ขนส่ง</Text>
              <Text style={styles.infoValue}>ไปรษณีย์ไทย (Thailand Post)</Text>
            </View>

            <ScrollView style={styles.trackingTimeline} showsVerticalScrollIndicator={false}>
              {isFetchingTracking ? (
                <ActivityIndicator size="large" color={BLACK} style={{ marginTop: 40 }} />
              ) : trackingData && trackingData.length > 0 ? (
                trackingData.map((step, index) => renderTrackingItem(step, index))
              ) : (
                <View style={styles.emptyTracking}>
                  <Text style={styles.emptyTrackingText}>ไม่พบข้อมูลการจัดส่ง หรือพัสดุยังไม่เข้าสู่ระบบ</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Review Modal */}
      <Modal
        visible={reviewModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>เขียนรีวิวสินค้า</Text>
              <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
                <Ionicons name="close" size={24} color={BLACK} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedProduct && (
                <View style={styles.reviewProductInfo}>
                  <Image source={{ uri: selectedProduct.image }} style={styles.reviewProductImg} />
                  <Text style={styles.reviewProductName}>{selectedProduct.name}</Text>
                </View>
              )}

              <View style={styles.ratingSection}>
                <Text style={styles.sectionLabel}>ให้คะแนนความพึงพอใจ</Text>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <TouchableOpacity key={s} onPress={() => setRating(s)}>
                      <Ionicons
                        name={s <= rating ? "star" : "star-outline"}
                        size={36}
                        color={s <= rating ? "#F59E0B" : "#DDD"}
                        style={{ marginHorizontal: 5 }}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.commentSection}>
                <Text style={styles.sectionLabel}>บอกความรู้สึกของคุณ</Text>
                <TextInput
                  style={styles.commentInput}
                  placeholder="สินค้าเป็นอย่างไรบ้าง? เขียนรีวิวที่นี่..."
                  multiline
                  numberOfLines={4}
                  value={comment}
                  onChangeText={setComment}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.imageSection}>
                <Text style={styles.sectionLabel}>เพิ่มรูปภาพ (สูงสุด 5 รูป)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
                  {images.map((img, index) => (
                    <View key={index} style={styles.imagePreviewContainer}>
                      <Image source={{ uri: img.uri }} style={styles.imagePreview} />
                      <TouchableOpacity 
                        style={styles.removeImageBtn} 
                        onPress={() => removeImage(index)}
                      >
                        <Ionicons name="close-circle" size={20} color="red" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {images.length < 5 && (
                    <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
                      <Ionicons name="camera-outline" size={30} color={MUTED} />
                      <Text style={styles.addImageText}>เพิ่มรูป</Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </View>

              <TouchableOpacity 
                style={[styles.submitBtn, submittingReview && { opacity: 0.7 }]} 
                onPress={handleSubmitReview}
                disabled={submittingReview}
              >
                {submittingReview ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitBtnText}>ส่งรีวิว</Text>
                )}
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
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

const emptyTitleStyle = {
    fontSize: 18,
    fontWeight: '700',
    color: BLACK,
    marginTop: 15,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: SPACING.screenHeaderTop,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: BLACK },
  backButton: { padding: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 15 },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#EEE',
    ...SHADOW.card,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  orderIdText: { fontSize: 14, fontWeight: '700', color: BLACK },
  statusBadge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  orderBody: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  placeholderImg: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
  },
  orderMainInfo: { flex: 1, marginLeft: 15 },
  productName: { fontSize: 14, fontWeight: '700', color: BLACK, marginBottom: 4 },
  productMeta: { fontSize: 12, color: '#666', marginBottom: 4 },
  dateText: { fontSize: 12, color: MUTED },
  trackingNoText: { fontSize: 12, color: '#3B82F6', fontWeight: '600', marginTop: 4 },
  orderFooter: { borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: 15 },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  totalLabel: { fontSize: 14, color: '#666' },
  totalValue: { fontSize: 20, fontWeight: '800', color: BLACK },
  actionButton: {
    backgroundColor: BLACK,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledBtn: {
    backgroundColor: '#DDD',
  },
  actionButtonText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: BLACK, marginTop: 15 },
  emptySub: { fontSize: 14, color: MUTED, marginTop: 5, textAlign: 'center', paddingHorizontal: 40 },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: BLACK },
  trackingInfoCard: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoLabel: { fontSize: 12, color: MUTED, marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: '700', color: BLACK },
  trackingTimeline: { flex: 1 },
  trackStep: { flexDirection: 'row', marginBottom: 0 },
  trackLineContainer: { alignItems: 'center', width: 30 },
  trackDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#DDD', zIndex: 1 },
  trackDotActive: { backgroundColor: '#3B82F6', width: 12, height: 12, borderRadius: 6 },
  trackLine: { width: 2, flex: 1, backgroundColor: '#EEE', marginVertical: -2 },
  trackContent: { flex: 1, paddingLeft: 10, paddingBottom: 25 },
  trackStatus: { fontSize: 14, fontWeight: '600', color: MUTED, marginBottom: 4 },
  trackStatusActive: { color: BLACK, fontSize: 15, fontWeight: '700' },
  trackLocation: { fontSize: 13, color: '#666', marginBottom: 2 },
  trackDate: { fontSize: 12, color: MUTED },
  emptyTracking: { alignItems: 'center', marginTop: 50 },
  emptyTrackingText: { color: MUTED, textAlign: 'center' },

  // Review Modal Styles
  reviewProductInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    padding: 10,
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
  },
  reviewProductImg: { width: 50, height: 50, borderRadius: 8, marginRight: 15 },
  reviewProductName: { fontSize: 14, fontWeight: '700', color: BLACK, flex: 1 },
  sectionLabel: { fontSize: 15, fontWeight: '700', color: BLACK, marginBottom: 12 },
  ratingSection: { alignItems: 'center', marginBottom: 25 },
  starsContainer: { flexDirection: 'row' },
  commentSection: { marginBottom: 25 },
  commentInput: {
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    padding: 15,
    fontSize: 14,
    color: BLACK,
    borderWidth: 1,
    borderColor: '#EEE',
    minHeight: 100,
  },
  imageSection: { marginBottom: 30 },
  imagesScroll: { flexDirection: 'row' },
  imagePreviewContainer: { marginRight: 10, position: 'relative' },
  imagePreview: { width: 80, height: 80, borderRadius: 10 },
  removeImageBtn: { position: 'absolute', top: -5, right: -5, backgroundColor: '#FFF', borderRadius: 10 },
  addImageBtn: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDD',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  addImageText: { fontSize: 12, color: MUTED, marginTop: 4 },
  submitBtn: {
    backgroundColor: BLACK,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});

export default OrdersListScreen;
