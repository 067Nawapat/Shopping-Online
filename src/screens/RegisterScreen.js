import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../api/apiService';
import ConfirmModal from '../components/ConfirmModal';
import styles from '../styles/RegisterScreen.styles';

// ── Helpers ───────────────────────────────────────────────
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const getPasswordStrength = (pw) => {
  if (pw.length < 6) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 3);
};

const STRENGTH_LABELS = ['', 'อ่อน', 'ปานกลาง', 'แข็งแรง'];
const STRENGTH_COLORS = ['', '#EF4444', '#F59E0B', '#22C55E'];

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [modalConfig, setModalConfig] = useState(null);

  const emailRef = useRef(null);
  const passRef = useRef(null);
  const confirmRef = useRef(null);
  const showModal = (title, message, onConfirm = null, confirmText = 'ตกลง') => {
    setModalConfig({ title, message, onConfirm, confirmText });
  };
  const closeModal = () => setModalConfig(null);

  const strength = getPasswordStrength(password);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      showModal('ข้อผิดพลาด', 'กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }
    if (!isValidEmail(email.trim())) {
      showModal('ข้อผิดพลาด', 'รูปแบบอีเมลไม่ถูกต้อง');
      return;
    }
    if (password.length < 6) {
      showModal('ข้อผิดพลาด', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (password !== confirmPassword) {
      showModal('ข้อผิดพลาด', 'รหัสผ่านไม่ตรงกัน');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      if (response.status === 'success') {
        showModal('สำเร็จ', 'สมัครสมาชิกเรียบร้อยแล้ว', () => navigation.navigate('Login'), 'เข้าสู่ระบบ');
      } else {
        showModal('สมัครไม่สำเร็จ', response.message || 'เกิดข้อผิดพลาดในการสมัคร');
      }
    } catch {
      showModal('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับ Server ได้\nกรุณาตรวจสอบอินเทอร์เน็ต');
    } finally {
      setLoading(false);
    }
  };

  const inputWrapper = (field) => [
    styles.inputWrapper,
    focusedField === field && styles.inputWrapperFocused,
  ];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.kickerRow}>
            <View style={styles.kickerLine} />
            <Text style={styles.kickerText}>CREATE ACCOUNT</Text>
          </View>

          <Text style={styles.title}>สร้างบัญชีใหม่</Text>
          <Text style={styles.subtitle}>สมัครด้วยอีเมลเพื่อบันทึกรายการโปรด ติดตามคำสั่งซื้อ และเริ่มต้นใช้งานได้ทันที</Text>

          <View style={styles.panel}>

            {/* Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>ชื่อ-นามสกุล</Text>
              <View style={inputWrapper('name')}>
                <TextInput
                  style={styles.input}
                  placeholder="ชื่อของคุณ"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={name}
                  onChangeText={setName}
                  returnKeyType="next"
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  onSubmitEditing={() => emailRef.current?.focus()}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>อีเมล</Text>
              <View style={inputWrapper('email')}>
                <TextInput
                  ref={emailRef}
                  style={styles.input}
                  placeholder="example@email.com"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  onSubmitEditing={() => passRef.current?.focus()}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>รหัสผ่าน</Text>
              <View style={inputWrapper('pass')}>
                <TextInput
                  ref={passRef}
                  style={styles.input}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                  returnKeyType="next"
                  onFocus={() => setFocusedField('pass')}
                  onBlur={() => setFocusedField(null)}
                  onSubmitEditing={() => confirmRef.current?.focus()}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass((v) => !v)}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color="rgba(255,255,255,0.55)" />
                </TouchableOpacity>
              </View>
              {/* Password Strength */}
              {password.length > 0 && (
                <>
                  <View style={styles.strengthBar}>
                    {[1, 2, 3].map((level) => (
                      <View
                        key={level}
                        style={[
                          styles.strengthSegment,
                          strength >= level && { backgroundColor: STRENGTH_COLORS[strength] },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={[styles.strengthLabel, { color: STRENGTH_COLORS[strength] }]}>
                    {STRENGTH_LABELS[strength]}
                  </Text>
                </>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>ยืนยันรหัสผ่าน</Text>
              <View style={inputWrapper('confirm')}>
                <TextInput
                  ref={confirmRef}
                  style={styles.input}
                  placeholder="ระบุรหัสผ่านอีกครั้ง"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  returnKeyType="done"
                  onFocus={() => setFocusedField('confirm')}
                  onBlur={() => setFocusedField(null)}
                  onSubmitEditing={handleRegister}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm((v) => !v)}>
                  <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="rgba(255,255,255,0.55)" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.registerBtn, loading && styles.registerBtnDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#111111" />
              ) : (
                <Text style={styles.registerBtnText}>สมัครสมาชิก</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerText}>
              มีบัญชีอยู่แล้ว? <Text style={styles.linkText}>เข้าสู่ระบบ</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmModal
        visible={!!modalConfig}
        title={modalConfig?.title}
        message={modalConfig?.message}
        confirmText={modalConfig?.confirmText}
        hideCancel
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

export default RegisterScreen;
