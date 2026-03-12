import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../api/apiService';
import styles from '../styles/CheckoutScreen.styles';

const CheckoutScreen = ({ route, navigation }) => {
  const { items, buyNowProduct, buyNowVariant } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [couponModalVisible, setCouponModalVisible] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Determine items to display
  const checkoutItems = useMemo(() => {
    if (buyNowProduct && buyNowVariant) {
      return [{
        id: buyNowProduct.id,
        variant_id: buyNowVariant.id,
        name: buyNowProduct.name,
        brand: buyNowProduct.brand,
        image: buyNowProduct.image,
        size: buyNowVariant.size,
        price: buyNowVariant.price,
        quantity: 1,
      }];
    }
    return items || [];
  }, [items, buyNowProduct, buyNowVariant]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const userData = await apiService.getUser();
      if (!userData) {
        navigation.navigate('Auth');
        return;
      }
      setUser(userData);

      // Fetch Addresses
      const addrData = await apiService.getAddresses(userData.id);
      setAddresses(addrData || []);
      const defaultAddr = addrData?.find(a => Number(a.is_default) === 1) || addrData?.[0];
      setSelectedAddress(defaultAddr);

      // Fetch Coupons
      const couponData = await apiService.getUserCoupons(userData.id);
      setCoupons(couponData || []);

    } catch (error) {
      console.error('Checkout load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const subtotal = useMemo(() => {
    return checkoutItems.reduce((sum, item) => sum + (parseFloat(item.price) * (item.quantity || 1)), 0);
  }, [checkoutItems]);

  const shippingFee = 0;
  const serviceFee = 0;

  const discountAmount = useMemo(() => {
    if (!selectedCoupon) return 0;
    const discountVal = parseFloat(selectedCoupon.discount) || 0;
    const maxDiscount = parseFloat(selectedCoupon.max_discount) || 0;
    
    let calculatedDiscount = 0;
    if (discountVal <= 100) {
      calculatedDiscount = (subtotal * discountVal) / 100;
      if (maxDiscount > 0 && calculatedDiscount > maxDiscount) {
        calculatedDiscount = maxDiscount;
      }
    } else {
      calculatedDiscount = discountVal;
    }
    
    return calculatedDiscount;
  }, [selectedCoupon, subtotal]);

  const total = Math.max(0, subtotal + shippingFee + serviceFee - discountAmount);

  const handleCheckout = async () => {
    if (!selectedAddress) {
      Alert.alert('แจ้งเตือน', 'กรุณาเลือกที่อยู่จัดส่ง');
      return;
    }

    setProcessing(true);
    try {
      const orderRes = await apiService.createOrder({
        user_id: user.id,
        total_price: total,
        address_id: selectedAddress.id,
        coupon_id: selectedCoupon?.id || null,
        items: checkoutItems
      });

      if (orderRes.status === 'success') {
        setProcessing(false);
        navigation.navigate('PaymentPromptPay', { 
          orderId: orderRes.order_id, 
          totalPrice: total 
        });
      } else {
        setProcessing(false);
        Alert.alert('ผิดพลาด', 'ไม่สามารถสร้างคำสั่งซื้อได้');
      }
    } catch (error) {
      setProcessing(false);
      console.error(error);
      Alert.alert('ผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const renderProductItem = (item) => (
    <View key={item.id + (item.variant_id || '')} style={styles.productItem}>
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productVariant}>{item.brand} • ไซส์ {item.size}</Text>
        <Text style={styles.productPrice}>฿{parseFloat(item.price).toLocaleString()}</Text>
        <Text style={styles.productQty}>x{item.quantity || 1}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {processing && (
        <View style={{ ...styles.modalOverlay, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={{ marginTop: 10, fontWeight: '700' }}>กำลังดำเนินการ...</Text>
        </View>
      )}
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>สรุปคำสั่งซื้อ</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Products Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="flash" size={18} color="#22C55E" />
                <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>พร้อมจัดส่ง</Text>
            </View>
            <Text style={{ fontSize: 12, color: '#666' }}>1-2 วัน</Text>
          </View>
          {checkoutItems.map(renderProductItem)}
        </View>

        {/* Address Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="location" size={20} color="#000" />
                <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>ที่อยู่จัดส่ง</Text>
            </View>
            {selectedAddress && (
              <TouchableOpacity onPress={() => setAddressModalVisible(true)} style={styles.changeAddressBtn}>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>

          {selectedAddress ? (
            <View style={styles.addressContainer}>
              <View style={styles.addressInfo}>
                <Text style={styles.addressName}>{selectedAddress.full_name} ({selectedAddress.phone})</Text>
                <Text style={styles.addressText}>
                  {selectedAddress.address_detail} {selectedAddress.district} {selectedAddress.province} {selectedAddress.zipcode}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.noAddressContainer}>
              <TouchableOpacity 
                style={styles.addAddressBtn}
                onPress={() => navigation.navigate('AddAddress')}
              >
                <Ionicons name="add" size={20} color="#000" />
                <Text style={styles.addAddressText}>เพิ่มที่อยู่ใหม่</Text>
              </TouchableOpacity>
              <View style={{ marginTop: 12, backgroundColor: '#FFFBEB', padding: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                  <Ionicons name="warning" size={18} color="#F59E0B" />
                  <Text style={{ color: '#F59E0B', fontSize: 13, marginLeft: 8 }}>กรุณาระบุ <Text style={{ textDecorationLine: 'underline' }}>ที่อยู่จัดส่ง</Text></Text>
              </View>
            </View>
          )}
        </View>

        {/* Shipping Method Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ช่องทางการจัดส่ง</Text>
          <View style={{ marginTop: 15 }}>
            <Text style={styles.shippingType}>จัดส่งแบบ EMS</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="time-outline" size={18} color="#666" />
                    <Text style={{ fontSize: 13, color: '#666', marginLeft: 6 }}>คาดว่าจะได้รับภายใน 2-3 วัน</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.shippingPrice}>฿ 0</Text>
                    <Ionicons name="chevron-forward" size={18} color="#CCC" />
                </View>
            </View>
          </View>
        </View>

        {/* Payment & Coupon Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginBottom: 15 }]}>ชำระเงิน</Text>
          
          <TouchableOpacity style={styles.paymentRow}>
            <View style={styles.paymentLeft}>
              <Ionicons name="card-outline" size={20} color="#000" />
              <Text style={styles.paymentText}>วิธีชำระเงิน</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="qr-code-outline" size={16} color="#003D87" />
                <Text style={{ fontSize: 14, color: '#003D87', fontWeight: '600', marginLeft: 6 }}>QR PromptPay</Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
            </View>
          </TouchableOpacity>

          <View style={{ height: 1, backgroundColor: '#F0F0F0', marginVertical: 15 }} />

          <TouchableOpacity style={styles.couponRow} onPress={() => setCouponModalVisible(true)}>
            <View style={styles.paymentLeft}>
              <Ionicons name="pricetag-outline" size={20} color="#000" />
              <Text style={styles.paymentText}>โค้ดส่วนลด</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: selectedCoupon ? '#22C55E' : '#666', fontWeight: '600' }}>
                {selectedCoupon ? 'ใช้โค้ดส่วนลดแล้ว' : 'เลือกโค้ดส่วนลด'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </View>
          </TouchableOpacity>

          {selectedCoupon && (
            <View style={[styles.appliedCoupon, { marginTop: 12 }]}>
              <Ionicons name="ticket" size={16} color="#22C55E" />
              <Text style={styles.couponText}>ส่วนลด ฿{discountAmount.toLocaleString()}</Text>
              <TouchableOpacity onPress={() => setSelectedCoupon(null)}>
                <Ionicons name="close-circle" size={18} color="#666" />
              </TouchableOpacity>
            </View>
          )}
          
          <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="information-circle-outline" size={14} color="#AAA" />
              <Text style={{ fontSize: 11, color: '#AAA', marginLeft: 4 }}>เพื่อให้ส่วนลดถูกต้อง ระบบจะรีเซ็ตคูปองเมื่อมีการเปลี่ยนแปลงรายละเอียดการสั่งซื้อ</Text>
          </View>
        </View>

        {/* Price Summary Section */}
        <View style={styles.section}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>ราคาสินค้า</Text>
            <Text style={styles.summaryValue}>฿{subtotal.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>ค่าจัดส่ง</Text>
            <Text style={styles.summaryValue}>฿0</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>ค่าบริการตรวจสอบสินค้า</Text>
            <Text style={styles.summaryValue}>ฟรี</Text>
          </View>
          {selectedCoupon && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: '#EF4444' }]}>ส่วนลด</Text>
              <Text style={[styles.summaryValue, { color: '#EF4444' }]}>- ฿{discountAmount.toLocaleString()}</Text>
            </View>
          )}
          <View style={[styles.summaryRow, { marginTop: 10 }]}>
            <Text style={styles.totalLabel}>ยอดรวมสุทธิ</Text>
            <Text style={styles.totalValue}>฿{total.toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.checkoutBtn, !selectedAddress && styles.checkoutBtnDisabled]} 
          onPress={handleCheckout}
          disabled={!selectedAddress}
        >
          <Text style={styles.checkoutBtnText}>
            ดำเนินการชำระเงิน <Text style={{ color: '#000' }}>฿{total.toLocaleString()}</Text>
          </Text>
        </TouchableOpacity>
        <Text style={styles.footerAgreement}>
          โดยการดำเนินการต่อ ฉันได้อ่านและยอมรับ <Text style={styles.linkText}>เงื่อนไขการให้บริการและข้อตกลงแล้ว</Text>
        </Text>
      </View>

      {/* Address Modal */}
      <Modal visible={addressModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>เลือกที่อยู่จัดส่ง</Text>
              <TouchableOpacity onPress={() => setAddressModalVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={addresses}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.modalList}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.addressOption, selectedAddress?.id === item.id && styles.selectedAddressOption]}
                  onPress={() => {
                    setSelectedAddress(item);
                    setAddressModalVisible(false);
                  }}
                >
                  <Text style={styles.addressName}>{item.full_name} ({item.phone})</Text>
                  <Text style={styles.addressText}>{item.address_detail} {item.district} {item.province} {item.zipcode}</Text>
                </TouchableOpacity>
              )}
              ListFooterComponent={
                <TouchableOpacity 
                  style={[styles.addAddressBtn, { borderStyle: 'solid', marginTop: 10 }]}
                  onPress={() => {
                    setAddressModalVisible(false);
                    navigation.navigate('AddAddress');
                  }}
                >
                  <Ionicons name="add" size={20} color="#000" />
                  <Text style={styles.addAddressText}>เพิ่มที่อยู่ใหม่</Text>
                </TouchableOpacity>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Coupon Modal */}
      <Modal visible={couponModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>เลือกโค้ดส่วนลด</Text>
              <TouchableOpacity onPress={() => setCouponModalVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={coupons}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.modalList}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.couponOption, selectedCoupon?.id === item.id && styles.selectedCouponOption]}
                  onPress={() => {
                    setSelectedCoupon(item);
                    setCouponModalVisible(false);
                  }}
                >
                  <Ionicons name="ticket" size={24} color={selectedCoupon?.id === item.id ? "#22C55E" : "#666"} />
                  <View style={[styles.couponInfo, { marginLeft: 15 }]}>
                    <Text style={styles.couponCode}>{item.code}</Text>
                    <Text style={styles.couponDesc}>{item.description}</Text>
                    <Text style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                        ลด {item.discount <= 100 ? `${item.discount}%` : `฿${item.discount}`}
                    </Text>
                  </View>
                  {selectedCoupon?.id === item.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', padding: 40 }}>
                  <Ionicons name="ticket-outline" size={64} color="#DDD" />
                  <Text style={{ color: '#999', marginTop: 10 }}>ไม่มีโค้ดส่วนลดที่ใช้งานได้</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default CheckoutScreen;
