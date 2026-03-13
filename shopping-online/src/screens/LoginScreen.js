import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../api/apiService';
import ConfirmModal from '../components/ConfirmModal';
import styles from '../styles/LoginScreen.styles';
import { getGoogleSignInErrorMessage, signInWithGoogle } from '../utils/googleSignIn';

// ── Helper ────────────────────────────────────────────────
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);

  const passwordRef = useRef(null);

  const showModal = (title, message, onConfirm = null, confirmText = 'ตกลง') => {
    setModalConfig({ title, message, onConfirm, confirmText });
  };

  const closeModal = () => {
    setModalConfig(null);
  };

  const googleLogin = async (user) => {
    try {
      const res = await apiService.googleLogin({
        email: user.email,
        name: user.name,
        avatar: user.picture,
        idToken: user.idToken,
      });

      if (res.status === 'success') {
        navigation.replace('MainTabs');
      } else {
        showModal('Google Login', res.message || 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ');
      }
    } catch (error) {
      showModal('Google Login', error.message || 'ไม่สามารถเชื่อมต่อกับ Google login API ได้');
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      showModal('แจ้งเตือน', 'กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }
    if (!isValidEmail(email.trim())) {
      showModal('แจ้งเตือน', 'รูปแบบอีเมลไม่ถูกต้อง');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.login(email.trim().toLowerCase(), password);
      if (response.status === 'success') {
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'MainTabs',
              state: {
                index: 0,
                routes: [{ name: 'หน้าหลัก' }],
              },
            },
          ],
        });
      } else {
        showModal('เข้าสู่ระบบไม่สำเร็จ', response.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch {
      showModal('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับ Server ได้\nกรุณาตรวจสอบอินเทอร์เน็ต');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      const user = await signInWithGoogle();
      if (!user) {
        return;
      }
      await googleLogin(user);
    } catch (error) {
      showModal('Google Login', getGoogleSignInErrorMessage(error));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.content}>
            <View style={styles.kickerRow}>
              <View style={styles.kickerLine} />
              <Text style={styles.kickerText}>SIGN IN</Text>
            </View>

            <Text style={styles.title}>ยินดีต้อนรับกลับมา</Text>
            <Text style={styles.subtitle}>เข้าสู่ระบบเพื่อเข้าถึงรายการโปรด คำสั่งซื้อ และประสบการณ์ช้อปที่ต่อเนื่อง</Text>

            <View style={styles.panel}>

              {/* Email */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>อีเมล</Text>
                <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
                  <TextInput
                    style={styles.input}
                    placeholder="example@email.com"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    onSubmitEditing={() => passwordRef.current?.focus()}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>รหัสผ่าน</Text>
                <View style={[styles.inputWrapper, passFocused && styles.inputWrapperFocused]}>
                  <TextInput
                    ref={passwordRef}
                    style={styles.input}
                    placeholder="ระบุรหัสผ่าน"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    onFocus={() => setPassFocused(true)}
                    onBlur={() => setPassFocused(false)}
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword((v) => !v)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="rgba(255,255,255,0.55)"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password */}
              <TouchableOpacity
                style={styles.forgotBtn}
                onPress={() => showModal('ลืมรหัสผ่าน', 'ฟีเจอร์นี้กำลังพัฒนา')}
              >
                <Text style={styles.forgotText}>ลืมรหัสผ่าน?</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#111111" />
                ) : (
                  <Text style={styles.loginBtnText}>เข้าสู่ระบบ</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.googleBtn, googleLoading && styles.googleBtnDisabled]}
                onPress={handleGoogleLogin}
                disabled={googleLoading}
                activeOpacity={0.85}
              >
                {googleLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={18} color="#FFFFFF" />
                    <Text style={styles.googleBtnText}>Login with Google</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerText}>
                ยังไม่มีบัญชี?{' '}
                <Text style={styles.linkText}>สมัครสมาชิก</Text>
              </Text>
            </TouchableOpacity>
          </View>
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

export default LoginScreen;
