import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../api/apiService';
import { SPACING } from '../styles/theme';

const TAB_COLLECT = 'เก็บโค้ดส่วนลด';
const TAB_MY = 'โค้ดส่วนลดของฉัน';
const TAB_ITEMS = [TAB_COLLECT, TAB_MY];

const formatDiscountText = (discount) => {
  const amount = Number(discount || 0);
  if (amount <= 100) {
    return `ส่วนลด ${amount}%`;
  }
  return `ส่วนลด ฿${amount.toLocaleString()}`;
};

const formatCouponDetailText = (item) => {
  const discount = Number(item.discount || 0);
  const maxDiscount = Number(item.max_discount || 0);

  if (discount <= 100) {
    if (maxDiscount > 0) {
      return `ไม่มีขั้นต่ำ ลดสูงสุด ฿${maxDiscount.toLocaleString()}`;
    }
    return `ไม่มีขั้นต่ำ ใช้ได้ตามเงื่อนไขคูปอง`;
  }

  return `ขั้นต่ำ ฿10,000 ลดสูงสุด ฿${discount.toLocaleString()}`;
};

const formatExpiryText = (expiryDate) => {
  if (!expiryDate) {
    return 'ใช้ได้วันนี้';
  }
  return `ใช้ได้ถึง ${expiryDate}`;
};

const CouponCard = ({ item, mode, claimedCouponIds, onClaim }) => {
  const isClaimed = claimedCouponIds.has(Number(item.id));
  const isMine = mode === TAB_MY;
  const remainingQuantity = Number(item.quantity || 0);
  const isOutOfStock = !isMine && remainingQuantity <= 0;
  const actionDisabled = isClaimed || isOutOfStock;

  return (
    <View style={styles.couponCard}>
      <View style={styles.couponThumb}>
        <View style={styles.thumbInner}>
          <Text style={styles.thumbDiscount}>DISCOUNT</Text>
          <Text style={styles.thumbPercent}>
            {Number(item.discount || 0) <= 100 ? `${Number(item.discount || 0)}%` : 'THB'}
          </Text>
        </View>
      </View>

      <View style={styles.couponContent}>
        <Text style={styles.couponTitle}>
          {item.code} · {formatDiscountText(item.discount)}
        </Text>
        <Text style={styles.couponSubtitle}>{formatCouponDetailText(item)}</Text>
        <View style={styles.categoryPill}>
          <Text style={styles.categoryPillText}>
            {isMine && Number(item.used) === 1 ? 'ใช้แล้ว' : 'สินค้าทั่วรายการ'}
          </Text>
        </View>
        {!isMine ? (
          <Text style={styles.stockText}>คงเหลือ {remainingQuantity.toLocaleString()} สิทธิ์</Text>
        ) : null}
        <View style={styles.couponFooter}>
          <Text style={styles.couponExpiry}>{formatExpiryText(item.expiry_date)}</Text>
          {isMine ? (
            <Text style={styles.useNowText}>ของฉัน</Text>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={actionDisabled}
              onPress={() => onClaim(item)}
            >
              <Text style={[styles.useNowText, actionDisabled && styles.disabledActionText]}>
                {isClaimed ? 'เก็บแล้ว' : isOutOfStock ? 'หมดแล้ว' : 'เก็บโค้ด'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const EmptyState = ({ title, subtitle }) => (
  <View style={styles.emptyWrap}>
    <Ionicons name="ticket-outline" size={56} color="#D2D2D2" />
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptySubtitle}>{subtitle}</Text>
  </View>
);

const CouponsScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [myCoupons, setMyCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claimingCouponId, setClaimingCouponId] = useState(null);
  const [activeTab, setActiveTab] = useState(TAB_COLLECT);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const currentUser = await apiService.getUser();
      setUser(currentUser);

      const couponData = await apiService.getCoupons();
      setCoupons(Array.isArray(couponData) ? couponData : []);

      if (currentUser?.id) {
        try {
          const myCouponData = await apiService.getUserCoupons(currentUser.id);
          setMyCoupons(Array.isArray(myCouponData) ? myCouponData : []);
        } catch (error) {
          console.error('Fetch user coupons error:', error);
          setMyCoupons([]);
        }
      } else {
        setMyCoupons([]);
      }
    } catch (error) {
      console.error('Fetch coupons error:', error);
      setCoupons([]);
      setMyCoupons([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  const claimedCouponIds = useMemo(
    () => new Set(myCoupons.map((item) => Number(item.coupon_id || item.id))),
    [myCoupons]
  );

  const availableMyCoupons = useMemo(
    () => myCoupons.filter((item) => Number(item.used) !== 1),
    [myCoupons]
  );

  const filteredCoupons = useMemo(() => {
    const source = activeTab === TAB_COLLECT
      ? coupons.filter((item) => Number(item.quantity ?? 0) > 0 || claimedCouponIds.has(Number(item.id)))
      : availableMyCoupons;
    const keyword = searchText.trim().toLowerCase();

    if (!keyword) {
      return source;
    }

    return source.filter((item) => {
      const code = String(item.code || '').toLowerCase();
      const discount = String(item.discount || '').toLowerCase();
      return code.includes(keyword) || discount.includes(keyword);
    });
  }, [activeTab, availableMyCoupons, claimedCouponIds, coupons, searchText]);

  const handleClaimCoupon = async (coupon) => {
    if (!user?.id || !coupon?.id || claimingCouponId || Number(coupon.quantity || 0) <= 0) {
      return;
    }

    try {
      setClaimingCouponId(coupon.id);
      const result = await apiService.claimCoupon(user.id, coupon.id);
      if (result?.status === 'success' || result?.status === 'exists') {
        await fetchAllData();
      }
    } catch (error) {
      console.error('Claim coupon error:', error);
    } finally {
      setClaimingCouponId(null);
    }
  };

  const emptyTitle = activeTab === TAB_COLLECT ? 'ยังไม่มีโค้ดส่วนลด' : 'ยังไม่มีโค้ดส่วนลดของคุณ';
  const emptySubtitle = activeTab === TAB_COLLECT
    ? 'เมื่อมีดีลหรือคูปองใหม่ รายการจะแสดงที่หน้านี้'
    : 'กดเก็บโค้ดจากแท็บแรก แล้วคูปองจะมาแสดงที่หน้านี้';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => navigation?.goBack?.()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color="#181818" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>โค้ดส่วนลดและดีล</Text>

        <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.8} onPress={onRefresh}>
          <Ionicons name="time-outline" size={23} color="#181818" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        {TAB_ITEMS.map((tab) => {
          const active = tab === activeTab;
          return (
            <TouchableOpacity
              key={tab}
              style={styles.tabButton}
              activeOpacity={0.85}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab}</Text>
              {active ? <View style={styles.tabIndicator} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={20} color="#A8A8A8" />
        <TextInput
          style={styles.searchInput}
          placeholder="ใส่โค้ดโปรโมชั่น หรือ ส่วนลดที่นี่"
          placeholderTextColor="#B5B5B5"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <View style={styles.countRow}>
        <Text style={styles.countTitle}>{activeTab}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{filteredCoupons.length}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#181818" />
        </View>
      ) : (
        <FlatList
          data={filteredCoupons}
          keyExtractor={(item, index) => String(item.id ?? `${item.coupon_id}-${index}`)}
          renderItem={({ item }) => (
            <CouponCard
              item={item}
              mode={activeTab}
              claimedCouponIds={claimedCouponIds}
              onClaim={handleClaimCoupon}
            />
          )}
          ListEmptyComponent={<EmptyState title={emptyTitle} subtitle={emptySubtitle} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#181818" />
          }
          ListFooterComponent={
            claimingCouponId ? (
              <View style={styles.claimingWrap}>
                <ActivityIndicator size="small" color="#181818" />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: SPACING.screenHeaderTop,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
  },
  headerIconBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#181818',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 14,
    paddingBottom: 12,
    position: 'relative',
  },
  tabText: {
    fontSize: 16,
    color: '#9A9A9A',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#181818',
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -1,
    height: 3,
    backgroundColor: '#181818',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#181818',
    fontSize: 15,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginTop: 18,
    marginBottom: 14,
  },
  countTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#181818',
  },
  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ECECEC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    paddingHorizontal: 6,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5F5F5F',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  couponCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  couponThumb: {
    width: 66,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  thumbInner: {
    width: 58,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#111111',
    paddingHorizontal: 5,
    paddingVertical: 6,
    justifyContent: 'space-between',
  },
  thumbDiscount: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  thumbPercent: {
    color: '#D9FF3F',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'right',
    lineHeight: 17,
  },
  couponContent: {
    flex: 1,
    justifyContent: 'center',
  },
  couponTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#181818',
    lineHeight: 23,
  },
  couponSubtitle: {
    fontSize: 14,
    color: '#555555',
    marginTop: 4,
  },
  stockText: {
    marginTop: 8,
    fontSize: 11,
    color: '#929292',
    fontWeight: '600',
  },
  categoryPill: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#F3F3F3',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryPillText: {
    fontSize: 11,
    color: '#7A7A7A',
    fontWeight: '600',
  },
  couponFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  couponExpiry: {
    flex: 1,
    fontSize: 11,
    color: '#9A9A9A',
    marginRight: 8,
  },
  useNowText: {
    fontSize: 12,
    color: '#5A87C9',
    fontWeight: '700',
  },
  disabledActionText: {
    color: '#A7A7A7',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimingWrap: {
    paddingVertical: 10,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 28,
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 19,
    fontWeight: '700',
    color: '#181818',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#8C8C8C',
    textAlign: 'center',
    lineHeight: 21,
  },
});

export default CouponsScreen;
