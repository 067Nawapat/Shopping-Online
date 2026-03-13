import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../api/apiService';
import styles from '../styles/ProfileScreen.styles';
import { MenuItem } from '../components/ProfileComponents';
import ConfirmModal from '../components/ConfirmModal';
import { extractOrders, normalizeOrderStatus } from '../utils/orderUtils';

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', checkUser);
    return unsubscribe;
  }, [navigation]);

  const checkUser = useCallback(async () => {
    setLoading(true);
    try {
      const userData = await apiService.getUser();
      if (!userData) {
        navigation.navigate('Auth');
      } else {
        setUser(userData);
        fetchOrders(userData.id);
      }
    } catch (error) {
      console.error('Check user error:', error);
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  const fetchOrders = async (userId) => {
    try {
      const data = await apiService.getOrders(userId);
      setOrders(extractOrders(data));
    } catch (error) {
      console.error('Fetch orders error:', error);
      setOrders([]);
    }
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await apiService.logout();
    setUser(null);
    navigation.navigate('Auth');
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#0D0D0D" />
      </SafeAreaView>
    );
  }

  if (!user) return null;

  const initials = user.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'SA';

  const orderCounts = {
    pending: orders.filter((o) => normalizeOrderStatus(o) === 'pending').length,
    to_ship: orders.filter((o) => {
        const s = normalizeOrderStatus(o);
        return s === 'waiting' || s === 'verifying';
    }).length,
    shipping: orders.filter((o) => normalizeOrderStatus(o) === 'shipping').length,
    completed: orders.filter((o) => normalizeOrderStatus(o) === 'completed').length,
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Profile Header (Dark) ── */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.name || 'SASOM User'}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#CCFF00" />
              <Text style={styles.verifiedText}>ยืนยันแล้ว</Text>
            </View>
          </View>
        </View>

        {/* ── Order Status ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>การซื้อ</Text>
          </View>
          <View style={styles.purchaseGrid}>
            <TouchableOpacity 
              style={styles.purchaseItem} 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('PendingPayments')}
            >
              <View style={styles.purchaseIconWrap}>
                <Ionicons name="wallet-outline" size={30} color="#181818" />
                {orderCounts.pending > 0 ? (
                  <View style={styles.purchaseBadge}>
                    <Text style={styles.purchaseBadgeText}>{orderCounts.pending}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.purchaseLabel}>ที่ต้องชำระ</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.purchaseItem} 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('OrdersList', { type: 'to_ship' })}
            >
              <View style={styles.purchaseIconWrap}>
                <Ionicons name="cube-outline" size={30} color="#181818" />
                {orderCounts.to_ship > 0 ? (
                  <View style={styles.purchaseBadge}>
                    <Text style={styles.purchaseBadgeText}>{orderCounts.to_ship}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.purchaseLabel}>รอการจัดส่ง</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.purchaseItem} 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('OrdersList', { type: 'to_receive' })}
            >
              <View style={styles.purchaseIconWrap}>
                <Ionicons name="car-outline" size={30} color="#181818" />
                {orderCounts.shipping > 0 ? (
                  <View style={styles.purchaseBadge}>
                    <Text style={styles.purchaseBadgeText}>{orderCounts.shipping}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.purchaseLabel}>ที่ต้องได้รับ</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.purchaseItem} 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('OrdersList', { type: 'completed' })}
            >
              <View style={styles.purchaseIconWrap}>
                <Ionicons name="checkmark-circle-outline" size={30} color="#181818" />
                {orderCounts.completed > 0 ? (
                  <View style={styles.purchaseBadge}>
                    <Text style={styles.purchaseBadgeText}>{orderCounts.completed}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.purchaseLabel}>จัดส่งสำเร็จ</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Account ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>บัญชี</Text>
          </View>
          <MenuItem
            icon="person-outline"
            label="ข้อมูลส่วนตัว"
            onPress={() => navigation.navigate('UserInfo')}
          />
          <MenuItem
            icon="ticket-outline"
            label="โค้ดส่วนลดและดีล"
            onPress={() => navigation.navigate('Coupons')}
          />
          <MenuItem
            icon="heart-outline"
            label="สินค้าที่คุณสนใจ"
            onPress={() => navigation.navigate('Wishlist')}
          />
        </View>

        {/* ── Settings ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>การตั้งค่า</Text>
          </View>
          <MenuItem
            icon="location-outline"
            label="ที่อยู่จัดส่ง"
            onPress={() => navigation.navigate('AddressList')}
          />
          <MenuItem
            icon="card-outline"
            label="วิธีการชำระเงิน"
            onPress={() => navigation.navigate('PaymentMethods')}
          />
        </View>

        {/* ── Support ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ช่วยเหลือ</Text>
          </View>
          <MenuItem
            icon="help-circle-outline"
            label="ศูนย์ช่วยเหลือ"
            onPress={() => navigation.navigate('HelpCenter')}
          />
          <MenuItem
            icon="chatbubble-outline"
            label="ติดต่อเรา"
            onPress={() => navigation.navigate('ContactUs')}
          />
        </View>

        {/* ── Logout ── */}
        <TouchableOpacity 
          style={styles.logoutBtn} 
          onPress={() => setShowLogoutModal(true)} 
          activeOpacity={0.7}
        >
          <Text style={styles.logoutText}>ออกจากระบบ</Text>
          <Text style={styles.versionText}>เวอร์ชัน 1.0.0</Text>
        </TouchableOpacity>

        <View style={{ height: 110 }} />
      </ScrollView>

      <ConfirmModal
        visible={showLogoutModal}
        title="ออกจากระบบ"
        message="คุณต้องการออกจากระบบใช่หรือไม่?"
        confirmText="ออกจากระบบ"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </SafeAreaView>
  );
};

export default ProfileScreen;
