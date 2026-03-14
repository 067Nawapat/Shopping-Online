import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../api/apiService';
import ConfirmModal from '../components/ConfirmModal';
import styles from '../styles/UserInfoScreen.styles';

const GENDERS = ['ชาย', 'หญิง', 'ไม่ระบุ'];

const UserInfoScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);

  useEffect(() => { loadUserData(); }, []);

  const showModal = (title, message, onConfirm = null, confirmText = 'ตกลง', hideCancel = true) => {
    setModalConfig({ title, message, onConfirm, confirmText, hideCancel });
  };

  const closeModal = () => setModalConfig(null);

  const loadUserData = async () => {
    const userData = await apiService.getUser();
    if (userData) {
      setUser(userData);
      setName(userData.name || '');
      setEmail(userData.email || '');
      setBirthDate(userData.birth_date || '');
      setGender(userData.gender || 'ไม่ระบุ');
    }
  };

  const handleUpdate = async () => {
    if (!name.trim()) {
      showModal('แจ้งเตือน', 'กรุณากรอกชื่อของคุณ');
      return;
    }
    
    setLoading(true);
    try {
      const result = await apiService.updateProfile(user.id, {
        name: name.trim(),
        gender: gender,
        birth_date: birthDate,
      });

      if (result.status === 'success') {
        showModal('สำเร็จ', 'แก้ไขข้อมูลส่วนตัวเรียบร้อยแล้ว', () => navigation.goBack());
      } else {
        showModal('ข้อผิดพลาด', result.message || 'ไม่สามารถบันทึกข้อมูลได้');
      }
    } catch (error) {
      showModal('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    showModal(
      'ลบบัญชี',
      'การลบบัญชีจะไม่สามารถกู้คืนได้ คุณแน่ใจหรือไม่?',
      () => showModal('แจ้งเตือน', 'ฟีเจอร์นี้กำลังพัฒนา'),
      'ลบบัญชี',
      false,
    );
  };

  if (!user) return null;

  const initials = name
    ? name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'SA';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#0D0D0D" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ข้อมูลส่วนตัว</Text>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 120 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.avatar}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%', borderRadius: 40 }} />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </View>
          <Text style={styles.emailHeader}>{email}</Text>
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#CCFF00" />
            <Text style={styles.verifiedText}>ยืนยันแล้ว</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>ชื่อ</Text>
              <TextInput
                style={[styles.input, nameFocused && { borderColor: '#0D0D0D' }]}
                value={name}
                onChangeText={setName}
                placeholder="กรอกชื่อของคุณ"
                placeholderTextColor="#AAA"
                returnKeyType="done"
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>อีเมล</Text>
              <View style={[styles.input, styles.disabledInput]}>
                <Text style={{ color: '#AAA', fontSize: 16 }}>{email}</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>วันเกิด (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={birthDate}
                onChangeText={setBirthDate}
                placeholder="2000-01-01"
                placeholderTextColor="#AAA"
                returnKeyType="done"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>เพศ</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {GENDERS.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.input,
                      { flex: 1, alignItems: 'center' },
                      gender === g && { borderColor: '#0D0D0D', backgroundColor: '#0D0D0D' },
                    ]}
                    onPress={() => setGender(g)}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: gender === g ? '#fff' : '#555',
                      }}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
            <Text style={styles.deleteBtnText}>ลบบัญชี</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.saveBtn, loading && { opacity: 0.7 }]} 
            onPress={handleUpdate}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#0D0D0D" /> : <Text style={styles.saveBtnText}>บันทึกการเปลี่ยนแปลง</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <ConfirmModal
        visible={!!modalConfig}
        title={modalConfig?.title}
        message={modalConfig?.message}
        confirmText={modalConfig?.confirmText}
        hideCancel={modalConfig?.hideCancel}
        onConfirm={() => {
          const handler = modalConfig?.onConfirm;
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

export default UserInfoScreen;
