import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../api/apiService';
import { BLACK, MUTED } from '../utils/constants';
import { SPACING } from '../styles/theme';
import { THAILAND_DATA } from '../utils/thailandData';
import ConfirmModal from '../components/ConfirmModal';

const AddAddressScreen = ({ navigation, route }) => {
  const editingAddress = route.params?.address || null;
  const isEditing = !!editingAddress;

  const [fullName, setFullName] = useState(editingAddress?.full_name || '');
  const [phone, setPhone] = useState(editingAddress?.phone || '');
  const [selectedProvince, setSelectedProvince] = useState(editingAddress?.province || null);
  const [selectedDistrict, setSelectedDistrict] = useState(editingAddress?.district || null);
  const [detail, setDetail] = useState(editingAddress?.address_detail || '');
  const [isDefault, setIsDefault] = useState(Number(editingAddress?.is_default) === 1);
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('province'); // 'province' or 'district'
  const [confirmModal, setConfirmModal] = useState(null);

  const showModal = (title, message, onConfirm = null, confirmText = 'ตกลง') => {
    setConfirmModal({ title, message, onConfirm, confirmText });
  };

  const closeModal = () => setConfirmModal(null);

  const districts = useMemo(() => {
    if (!selectedProvince) return [];
    const found = THAILAND_DATA.find(item => item.province === selectedProvince);
    return found ? found.districts : [];
  }, [selectedProvince]);

  const handleSave = async () => {
    if (!fullName.trim() || !phone.trim() || !selectedProvince || !selectedDistrict || !detail.trim()) {
      showModal('แจ้งเตือน', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setLoading(true);
    try {
      const user = await apiService.getUser();
      if (!user) return;

      const payload = {
        user_id: user.id,
        full_name: fullName.trim(),
        phone: phone.trim(),
        province: selectedProvince,
        district: selectedDistrict,
        address_detail: detail.trim(),
        is_default: isDefault ? 1 : 0,
      };

      const result = isEditing
        ? await apiService.updateAddress(editingAddress.id, payload)
        : await apiService.saveAddress(payload);

      if (result.status === 'success') {
        showModal(
          'สำเร็จ',
          isEditing ? 'อัปเดตที่อยู่เรียบร้อยแล้ว' : 'บันทึกที่อยู่เรียบร้อยแล้ว',
          () => navigation.goBack()
        );
      } else {
        showModal('ข้อผิดพลาด', isEditing ? 'ไม่สามารถอัปเดตที่อยู่ได้' : 'ไม่สามารถบันทึกที่อยู่ได้');
      }
    } catch (error) {
      showModal('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  const openPicker = (type) => {
    if (type === 'district' && !selectedProvince) {
      showModal('แจ้งเตือน', 'กรุณาเลือกจังหวัดก่อน');
      return;
    }
    setModalType(type);
    setModalVisible(true);
  };

  const handleSelect = (item) => {
    if (modalType === 'province') {
      setSelectedProvince(item);
      setSelectedDistrict(null);
    } else {
      setSelectedDistrict(item);
    }
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={BLACK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'แก้ไขที่อยู่' : 'เพิ่มที่อยู่ใหม่'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>ชื่อ-นามสกุล ผู้รับ</Text>
          <TextInput
            style={styles.input}
            placeholder="เช่น นายสมชาย เข็มกลัด"
            placeholderTextColor="#AAA"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>เบอร์โทรศัพท์</Text>
          <TextInput
            style={styles.input}
            placeholder="08XXXXXXXX"
            placeholderTextColor="#AAA"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>จังหวัด</Text>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => openPicker('province')}>
            <Text style={[styles.pickerText, !selectedProvince && { color: '#AAA' }]}>
              {selectedProvince || 'เลือกจังหวัด'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={MUTED} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>อำเภอ/เขต</Text>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => openPicker('district')}>
            <Text style={[styles.pickerText, !selectedDistrict && { color: '#AAA' }]}>
              {selectedDistrict || 'เลือกอำเภอ'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={MUTED} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>บ้านเลขที่, ซอย, ถนน, ตำบล และรหัสไปรษณีย์</Text>
          <TextInput
            style={styles.textArea}
            placeholder="ระบุข้อมูลที่อยู่โดยละเอียด"
            placeholderTextColor="#AAA"
            multiline
            numberOfLines={4}
            value={detail}
            onChangeText={setDetail}
          />
        </View>

        <TouchableOpacity 
          style={styles.checkboxRow} 
          onPress={() => setIsDefault(!isDefault)}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={isDefault ? "checkbox" : "square-outline"} 
            size={24} 
            color={isDefault ? BLACK : MUTED} 
          />
          <Text style={styles.checkboxLabel}>ตั้งเป็นที่อยู่หลัก</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveBtn, loading && { opacity: 0.7 }]} 
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>{isEditing ? 'บันทึกการแก้ไข' : 'บันทึกที่อยู่'}</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalType === 'province' ? 'เลือกจังหวัด' : 'เลือกอำเภอ'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={BLACK} />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>
              <FlatList
                data={modalType === 'province' ? THAILAND_DATA.map(d => d.province) : districts}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.modalItem} onPress={() => handleSelect(item)}>
                    <Text style={styles.modalItemText}>{item}</Text>
                  </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingBottom: 40 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmModal
        visible={!!confirmModal}
        title={confirmModal?.title}
        message={confirmModal?.message}
        confirmText={confirmModal?.confirmText}
        hideCancel
        onConfirm={() => {
          const handler = confirmModal?.onConfirm;
          closeModal();
          if (handler) {
            handler();
          }
        }}
        onCancel={closeModal}
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
  content: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: BLACK, marginBottom: 8 },
  input: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: BLACK,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  pickerBtn: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  pickerText: { fontSize: 16, color: BLACK },
  textArea: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: BLACK,
    borderWidth: 1,
    borderColor: '#EEE',
    textAlignVertical: 'top',
    height: 100,
  },
  checkboxRow: { flexDirection: 'row', alignItems: 'center' },
  checkboxLabel: { fontSize: 16, marginLeft: 10, color: BLACK },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  saveBtn: {
    backgroundColor: BLACK,
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '60%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: BLACK },
  modalItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F9F9F9',
  },
  modalItemText: { fontSize: 16, color: BLACK },
});

export default AddAddressScreen;
