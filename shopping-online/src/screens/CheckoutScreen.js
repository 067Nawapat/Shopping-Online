import React, { useEffect, useMemo, useState } from 'react';
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

const PAYMENT_METHODS = [
  {
    id: 'promptpay',
    title: 'QR PromptPay',
    subtitle: 'สแกนจ่ายและอัปโหลดสลิปเพื่อตรวจสอบอัตโนมัติ',
    icon: 'qr-code-outline',
    accent: '#003D87',
  },
  {
    id: 'true_money',
    title: 'TrueMoney Wallet',
    subtitle: 'โอนเข้าวอลเล็ทแล้วอัปโหลดสลิปเพื่อตรวจสอบกับ EasySlip',
    icon: 'phone-portrait-outline',
    accent: '#F97316',
  },
];

const CheckoutScreen = ({ route, navigation }) => {
  const { items, buyNowProduct, buyNowVariant } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(PAYMENT_METHODS[0]);

  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [couponModalVisible, setCouponModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [processing, setProcessing] = useState(false);

  const checkoutItems = useMemo(() => {
    if (buyNowProduct && buyNowVariant) {
      return [
        {
          id: buyNowProduct.id,
          variant_id: buyNowVariant.id,
          name: buyNowProduct.name,
          brand: buyNowProduct.brand,
          image: buyNowProduct.image,
          size: buyNowVariant.size,
          price: buyNowVariant.price,
          quantity: 1,
        },
      ];
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

      const addrData = await apiService.getAddresses(userData.id);
      setAddresses(addrData || []);
      const defaultAddr = addrData?.find((item) => Number(item.is_default) === 1) || addrData?.[0] || null;
      setSelectedAddress(defaultAddr);

      const couponData = await apiService.getUserCoupons(userData.id);
      const availableCoupons = Array.isArray(couponData)
        ? couponData.filter((item) => Number(item.used) !== 1)
        : [];
      setCoupons(availableCoupons);
    } catch (error) {
      console.error('Checkout load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const subtotal = useMemo(() => (
    checkoutItems.reduce(
      (sum, item) => sum + parseFloat(item.price || 0) * (item.quantity || 1),
      0
    )
  ), [checkoutItems]);

  const shippingFee = 0;
  const serviceFee = 0;

  const discountAmount = useMemo(() => {
    if (!selectedCoupon) {
      return 0;
    }

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
        payment_method: selectedPaymentMethod.id,
        items: checkoutItems,
      });

      if (orderRes.status !== 'success') {
        throw new Error(orderRes.message || 'ไม่สามารถสร้างคำสั่งซื้อได้');
      }

      setProcessing(false);
      navigation.navigate('PaymentPromptPay', {
        orderId: orderRes.order_id,
        totalPrice: total,
        paymentMethod: selectedPaymentMethod.id,
      });
    } catch (error) {
      setProcessing(false);
      console.error('Checkout create order error:', error);
      Alert.alert('ผิดพลาด', error?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const renderProductItem = (item) => (
    <View key={`${item.id}_${item.variant_id || 'base'}`} style={styles.productItem}>
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productVariant}>
          {item.brand} • ไซส์ {item.size}
        </Text>
        <Text style={styles.productPrice}>฿{parseFloat(item.price || 0).toLocaleString()}</Text>
        <Text style={styles.productQty}>x{item.quantity || 1}</Text>
      </View>
    </View>
  );

  const renderAddressOption = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.addressOption,
        selectedAddress?.id === item.id && styles.selectedAddressOption,
      ]}
      onPress={() => {
        setSelectedAddress(item);
        setAddressModalVisible(false);
      }}
    >
      <Text style={styles.addressName}>{item.full_name} ({item.phone})</Text>
      <Text style={styles.addressText}>
        {item.address_detail} {item.district} {item.province} {item.zipcode}
      </Text>
    </TouchableOpacity>
  );

  const renderCouponOption = ({ item }) => {
    const isSelected = selectedCoupon?.id === item.id;
    const label = parseFloat(item.discount || 0) <= 100
      ? `ลด ${item.discount}%`
      : `ลด ฿${parseFloat(item.discount || 0).toLocaleString()}`;

    return (
      <TouchableOpacity
        style={[
          styles.couponOption,
          isSelected && styles.selectedCouponOption,
        ]}
        onPress={() => {
          setSelectedCoupon(item);
          setCouponModalVisible(false);
        }}
      >
        <Ionicons name="ticket-outline" size={20} color={isSelected ? '#22C55E' : '#666'} />
        <View style={styles.couponOptionBody}>
          <Text style={styles.couponOptionTitle}>{item.code}</Text>
          <Text style={styles.couponOptionSub}>{label}</Text>
        </View>
        {isSelected ? <Ionicons name="checkmark-circle" size={20} color="#22C55E" /> : null}
      </TouchableOpacity>
    );
  };

  const renderPaymentMethodOption = ({ item }) => {
    const isSelected = selectedPaymentMethod.id === item.id;
    return (
      <TouchableOpacity
        style={[
          styles.paymentMethodOption,
          isSelected && styles.selectedPaymentMethodOption,
        ]}
        onPress={() => {
          setSelectedPaymentMethod(item);
          setPaymentModalVisible(false);
        }}
      >
        <View style={[styles.paymentMethodIcon, { backgroundColor: `${item.accent}14` }]}>
          <Ionicons name={item.icon} size={20} color={item.accent} />
        </View>
        <View style={styles.paymentMethodBody}>
          <Text style={styles.paymentMethodTitle}>{item.title}</Text>
          <Text style={styles.paymentMethodSub}>{item.subtitle}</Text>
        </View>
        {isSelected ? <Ionicons name="checkmark-circle" size={22} color={item.accent} /> : null}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centeredScreen]}>
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {processing ? (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.processingText}>กำลังดำเนินการ...</Text>
        </View>
      ) : null}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>สรุปคำสั่งซื้อ</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.inlineHeader}>
              <Ionicons name="flash" size={18} color="#22C55E" />
              <Text style={styles.sectionTitleWithIcon}>พร้อมจัดส่ง</Text>
            </View>
            <Text style={styles.sectionMeta}>1-2 วัน</Text>
          </View>
          {checkoutItems.map(renderProductItem)}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.inlineHeader}>
              <Ionicons name="location" size={20} color="#000" />
              <Text style={styles.sectionTitleWithIcon}>ที่อยู่จัดส่ง</Text>
            </View>
            {selectedAddress ? (
              <TouchableOpacity onPress={() => setAddressModalVisible(true)} style={styles.changeAddressBtn}>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            ) : null}
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
              <TouchableOpacity style={styles.addAddressBtn} onPress={() => navigation.navigate('AddAddress')}>
                <Ionicons name="add" size={20} color="#000" />
                <Text style={styles.addAddressText}>เพิ่มที่อยู่ใหม่</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ช่องทางการจัดส่ง</Text>
          <View style={styles.shippingCard}>
            <Text style={styles.shippingType}>จัดส่งแบบ EMS</Text>
            <View style={styles.shippingRow}>
              <View style={styles.inlineHeader}>
                <Ionicons name="time-outline" size={18} color="#666" />
                <Text style={styles.shippingDesc}>คาดว่าจะได้รับภายใน 2-3 วัน</Text>
              </View>
              <Text style={styles.shippingPrice}>฿0</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ชำระเงิน</Text>

          <TouchableOpacity style={styles.paymentRow} onPress={() => setPaymentModalVisible(true)}>
            <View style={styles.paymentLeft}>
              <Ionicons name="card-outline" size={20} color="#000" />
              <Text style={styles.paymentText}>วิธีชำระเงิน</Text>
            </View>
            <View style={styles.paymentValueWrap}>
              <Ionicons
                name={selectedPaymentMethod.icon}
                size={16}
                color={selectedPaymentMethod.accent}
              />
              <Text style={[styles.paymentValueText, { color: selectedPaymentMethod.accent }]}>
                {selectedPaymentMethod.title}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </View>
          </TouchableOpacity>

          <View style={styles.paymentMethodHint}>
            <Text style={styles.paymentMethodHintText}>{selectedPaymentMethod.subtitle}</Text>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.couponRow} onPress={() => setCouponModalVisible(true)}>
            <View style={styles.paymentLeft}>
              <Ionicons name="pricetag-outline" size={20} color="#000" />
              <Text style={styles.paymentText}>โค้ดส่วนลด</Text>
            </View>
            <View style={styles.paymentValueWrap}>
              <Text style={[styles.couponSelectionText, selectedCoupon && styles.couponSelectionTextActive]}>
                {selectedCoupon ? 'ใช้โค้ดส่วนลดแล้ว' : 'เลือกโค้ดส่วนลด'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </View>
          </TouchableOpacity>

          {selectedCoupon ? (
            <View style={styles.appliedCoupon}>
              <Ionicons name="ticket" size={16} color="#22C55E" />
              <Text style={styles.couponText}>ส่วนลด ฿{discountAmount.toLocaleString()}</Text>
              <TouchableOpacity onPress={() => setSelectedCoupon(null)}>
                <Ionicons name="close-circle" size={18} color="#666" />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

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
          {selectedCoupon ? (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, styles.discountLabel]}>ส่วนลด</Text>
              <Text style={[styles.summaryValue, styles.discountLabel]}>- ฿{discountAmount.toLocaleString()}</Text>
            </View>
          ) : null}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>ยอดรวมสุทธิ</Text>
            <Text style={styles.totalValue}>฿{total.toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.checkoutBtn, (!selectedAddress || processing) && styles.checkoutBtnDisabled]}
          disabled={!selectedAddress || processing}
          onPress={handleCheckout}
        >
          <Text style={styles.checkoutBtnText}>ยืนยันคำสั่งซื้อ</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={addressModalVisible} transparent animationType="slide" onRequestClose={() => setAddressModalVisible(false)}>
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
              renderItem={renderAddressOption}
              contentContainerStyle={styles.modalList}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={paymentModalVisible} transparent animationType="slide" onRequestClose={() => setPaymentModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>เลือกวิธีชำระเงิน</Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={PAYMENT_METHODS}
              keyExtractor={(item) => item.id}
              renderItem={renderPaymentMethodOption}
              contentContainerStyle={styles.modalList}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={couponModalVisible} transparent animationType="slide" onRequestClose={() => setCouponModalVisible(false)}>
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
              keyExtractor={(item) => `${item.user_coupon_id || item.id}`}
              renderItem={renderCouponOption}
              ListHeaderComponent={(
                <TouchableOpacity
                  style={styles.clearCouponOption}
                  onPress={() => {
                    setSelectedCoupon(null);
                    setCouponModalVisible(false);
                  }}
                >
                  <Ionicons name="ban-outline" size={20} color="#666" />
                  <Text style={styles.clearCouponText}>ไม่ใช้โค้ดส่วนลด</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.modalList}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default CheckoutScreen;
