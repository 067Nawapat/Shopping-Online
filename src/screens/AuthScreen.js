import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { apiService } from '../api/apiService';
import ConfirmModal from '../components/ConfirmModal';
import styles from '../styles/AuthScreen.styles';
import { getGoogleSignInErrorMessage, signInWithGoogle } from '../utils/googleSignIn';

const AuthScreen = ({ navigation }) => {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);

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

  const handleGoogleAuth = async () => {
    try {
      setGoogleLoading(true);
      const user = await signInWithGoogle();
      if (!user) {
        showModal('Google Login', 'ไม่ได้รับข้อมูลผู้ใช้จาก Google');
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
      <StatusBar barStyle="light-content" backgroundColor="#111111" />
      <View style={styles.hero}>
        <View style={styles.content}>
          <View style={styles.kickerRow}>
            <View style={styles.kickerLine} />
            <Text style={styles.kickerText}>WELCOME BACK</Text>
          </View>

          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Style</Text>
            <Text style={styles.logoText}>starts here</Text>
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>ค้นหาของที่ใช่</Text>
            <Text style={styles.titleText}>
              พร้อมดีลใหม่ในทุก<Text style={styles.titleAccent}>โมเมนต์การช้อป</Text>
            </Text>
            <Text style={styles.subtitleText}>
              สมัครหรือเข้าสู่ระบบเพื่อบันทึกสินค้าโปรด ติดตามคำสั่งซื้อ และเข้าถึงประสบการณ์ช้อปที่ต่อเนื่องมากขึ้น
            </Text>
          </View>

          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelEyebrow}>QUICK ACCESS</Text>
              <Text style={styles.panelTitle}>เริ่มต้นภายในไม่กี่วินาที</Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.socialBtn, googleLoading && styles.socialBtnDisabled]}
                activeOpacity={0.75}
                onPress={handleGoogleAuth}
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <AntDesign name="google" size={20} color="#EA4335" />
                    <Text style={styles.socialBtnText}>ดำเนินการต่อด้วย Google</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.emailBtn}
                onPress={() => navigation.navigate('Register')}
                activeOpacity={0.85}
              >
                <Text style={styles.emailBtnText}>สมัครสมาชิกด้วยอีเมล</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.loginBtn}
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.7}
              >
                <Text style={styles.loginText}>มีบัญชีอยู่แล้ว? เข้าสู่ระบบ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

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

export default AuthScreen;
