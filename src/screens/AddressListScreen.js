import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { apiService } from '../api/apiService';
import { BLACK, MUTED } from '../utils/constants';
import { SPACING } from '../styles/theme';
import ConfirmModal from '../components/ConfirmModal';

const AddressListScreen = ({ navigation }) => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const userData = await apiService.getUser();
      if (userData) {
        setUser(userData);
        const data = await apiService.getAddresses(userData.id);
        setAddresses(data || []);
      }
    } catch (error) {
      console.error('Fetch addresses error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      const result = await apiService.setDefaultAddress(user.id, addressId);
      if (result.status === 'success') {
        fetchData();
      }
    } catch (error) {
      console.error('Set default error:', error);
    }
  };

  const confirmDelete = async () => {
    if (!addressToDelete) return;
    setShowDeleteModal(false);
    try {
      const result = await apiService.deleteAddress(user.id, addressToDelete);
      if (result.status === 'success') {
        fetchData();
      }
    } catch (error) {
      console.error('Delete address error:', error);
    } finally {
      setAddressToDelete(null);
    }
  };

  const handleDeletePress = (addressId) => {
    setAddressToDelete(addressId);
    setShowDeleteModal(true);
  };

  const formatAddress = (item) => {
    return [item.address_detail, item.district, item.province].filter(Boolean).join(' ');
  };

  const renderItem = ({ item }) => (
    <View style={styles.addressCard}>
      <View style={styles.addressInfo}>
        {Number(item.is_default) === 1 && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>ค่าเริ่มต้น</Text>
          </View>
        )}
        <Text style={styles.recipientName}>{item.full_name || 'ไม่ระบุชื่อผู้รับ'}</Text>
        {!!item.phone && <Text style={styles.phoneLine}>{item.phone}</Text>}
        <Text style={styles.addressLine}>{formatAddress(item) || 'ไม่พบรายละเอียดที่อยู่'}</Text>
      </View>
      <View style={styles.actions}>
        {Number(item.is_default) !== 1 && (
          <TouchableOpacity onPress={() => handleSetDefault(item.id)} style={styles.actionBtn}>
            <Text style={styles.setDefaultText}>ตั้งเป็นค่าเริ่มต้น</Text>
          </TouchableOpacity>
        )}
        <View style={styles.actionRight}>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddAddress', { address: item })}
            style={styles.editBtn}
          >
            <Text style={styles.editText}>แก้ไข</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeletePress(item.id)}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={BLACK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ที่อยู่จัดส่ง</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddAddress')}>
          <Ionicons name="add" size={28} color={BLACK} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={BLACK} style={{ marginTop: 40 }} />
      ) : addresses.length === 0 ? (
        <View style={styles.emptyContent}>
          <Ionicons name="location-outline" size={64} color="#000000" />
          <Text style={styles.title}>ยังไม่มีที่อยู่</Text>
          <Text style={styles.sub}>กรุณาเพิ่มที่อยู่จัดส่งของคุณ</Text>
        </View>
      ) : (
        <FlatList
          data={addresses}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
        />
      )}

      <ConfirmModal
        visible={showDeleteModal}
        title="ลบที่อยู่"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบที่อยู่นี้?"
        confirmText="ลบที่อยู่"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
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
  emptyContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: '700', color: BLACK, marginTop: 16 },
  sub: { fontSize: 14, color: MUTED, marginTop: 6 },
  list: { padding: 20 },
  addressCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  addressInfo: { marginBottom: 12 },
  defaultBadge: {
    backgroundColor: '#CCFF00',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 8,
  },
  defaultText: { fontSize: 10, fontWeight: '700', color: BLACK },
  recipientName: { fontSize: 16, color: BLACK, fontWeight: '700', marginBottom: 4 },
  phoneLine: { fontSize: 14, color: '#444', marginBottom: 6 },
  addressLine: { fontSize: 15, color: BLACK, lineHeight: 22 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 12,
  },
  actionBtn: { paddingVertical: 4 },
  actionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  editBtn: { paddingVertical: 4 },
  editText: { fontSize: 13, color: BLACK, fontWeight: '600' },
  setDefaultText: { fontSize: 13, color: '#007AFF', fontWeight: '600' },
});

export default AddressListScreen;
