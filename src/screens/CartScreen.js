import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, SafeAreaView, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, DeviceEventEmitter } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { apiService } from '../api/apiService';
import { BLACK, MUTED } from '../utils/constants';
import { SPACING } from '../styles/theme';
import ConfirmModal from '../components/ConfirmModal';

const CartScreen = () => {
  const navigation = useNavigation();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [infoModal, setInfoModal] = useState(null);

  const loadCart = useCallback(async () => {
    setLoading(true);
    try {
      const userData = await apiService.getUser();
      if (userData) {
        setUser(userData);
        const data = await apiService.getCart(userData.id);
        setCartItems(data || []);
      } else {
        setUser(null);
        setCartItems([]);
      }
    } catch (error) {
      console.error('Load cart error:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();
    const subscription = DeviceEventEmitter.addListener('cartUpdated', loadCart);

    return () => {
      subscription.remove();
    };
  }, [loadCart]);

  useFocusEffect(
    useCallback(() => {
      loadCart();
    }, [loadCart])
  );

  const handleRemoveItem = async (cartId) => {
    try {
      const res = await apiService.removeFromCart(user.id, cartId);
      if (res.status === 'success') {
        loadCart();
      }
    } catch (error) {
      setInfoModal({ title: 'Error', message: 'ไม่สามารถลบสินค้าได้' });
    }
  };

  const handleClearCart = async () => {
    setShowClearModal(false);
    try {
      const res = await apiService.clearCart(user.id);
      if (res.status === 'success') {
        loadCart();
      }
    } catch (error) {
      setInfoModal({ title: 'Error', message: 'ไม่สามารถล้างตะกร้าได้' });
    }
  };

  const totalItems = cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

  const handleCheckout = () => {
    if (!user) {
      navigation.navigate('Auth');
      return;
    }
    if (cartItems.length === 0) return;
    navigation.navigate('Checkout', { items: cartItems });
  };

  const renderItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.image }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemBrand}>{item.brand} • ไซส์ {item.size}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.itemPrice}>฿{parseFloat(item.price).toLocaleString()}</Text>
          <Text style={styles.itemQty}>x{item.quantity}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={() => handleRemoveItem(item.id)} style={styles.removeBtn}>
        <Ionicons name="trash-outline" size={20} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  if (loading && cartItems.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={BLACK} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ตะกร้าสินค้า</Text>
        {cartItems.length > 0 && (
          <TouchableOpacity onPress={() => setShowClearModal(true)}>
            <Text style={styles.clearText}>ล้างทั้งหมด</Text>
          </TouchableOpacity>
        )}
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.content}>
          <Ionicons name="cart-outline" size={64} color="#DDD" />
          <Text style={styles.title}>ตะกร้าสินค้า</Text>
          <Text style={styles.sub}>{user ? 'รถเข็นของคุณยังว่างเปล่า' : 'กรุณาเข้าสู่ระบบเพื่อดูตะกร้าสินค้า'}</Text>
        </View>
      ) : (
        <>
          <FlatList
            style={styles.listView}
            data={cartItems}
            renderItem={renderItem}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
          />
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>รวมทั้งสิ้น ({totalItems} ชิ้น)</Text>
              <Text style={styles.totalValue}>฿{totalPrice.toLocaleString()}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
              <Text style={styles.checkoutText}>ดำเนินการชำระเงิน</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <ConfirmModal
        visible={showClearModal}
        title="ล้างตะกร้าสินค้า"
        message="คุณต้องการลบสินค้าทั้งหมดออกจากตะกร้าใช่หรือไม่?"
        confirmText="ล้างตะกร้า"
        onConfirm={handleClearCart}
        onCancel={() => setShowClearModal(false)}
      />

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: SPACING.screenHeaderTop,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: BLACK },
  clearText: { fontSize: 14, color: '#EF4444', fontWeight: '600' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: '700', color: BLACK, marginTop: 16 },
  sub: { fontSize: 14, color: MUTED, marginTop: 6 },
  listView: { flex: 1 },
  list: { padding: 20, paddingBottom: 120 },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  itemImage: { width: 70, height: 70, borderRadius: 8, backgroundColor: '#FFF' },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemName: { fontSize: 15, fontWeight: '700', color: BLACK },
  itemBrand: { fontSize: 12, color: MUTED, marginTop: 2 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  itemPrice: { fontSize: 16, fontWeight: '800', color: BLACK },
  itemQty: { fontSize: 14, color: MUTED, fontWeight: '600' },
  removeBtn: { padding: 8 },
  footer: {
    padding: 20,
    paddingBottom: 112,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#fff',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: { fontSize: 14, color: MUTED },
  totalValue: { fontSize: 20, fontWeight: '800', color: BLACK },
  checkoutBtn: {
    backgroundColor: '#CCFF00',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutText: { fontSize: 16, fontWeight: '800', color: BLACK },
});

export default CartScreen;
