import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import generatePayload from 'promptpay-qr';
import QRCode from 'react-native-qrcode-svg';
import * as ImagePicker from 'expo-image-picker';
import { apiService } from '../api/apiService';
import styles from '../styles/PaymentPromptPayScreen.styles';

const PROMPTPAY_NUMBER = '0926631047';

const PaymentPromptPayScreen = ({ route, navigation }) => {
  const { orderId, totalPrice } = route.params;
  const [checking, setChecking] = useState(false);
  const [slipImage, setSlipImage] = useState(null);

  const formattedAmount = parseFloat(totalPrice || 0).toLocaleString();
  const payload = generatePayload(PROMPTPAY_NUMBER, {
    amount: parseFloat(totalPrice || 0),
  });

  const saveQrCode = () => {
    Alert.alert('สำเร็จ', 'บันทึก QR Code ลงในเครื่องเรียบร้อยแล้ว');
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('ขออภัย', 'เราต้องการสิทธิ์เข้าถึงคลังภาพเพื่ออัปโหลดสลิป');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setSlipImage(result.assets[0].uri);
    }
  };

  const handleConfirmPayment = async () => {
    if (!slipImage) {
      Alert.alert('แจ้งเตือน', 'กรุณาอัปโหลดสลิปการโอนเงินก่อนยืนยัน');
      return;
    }

    setChecking(true);
    try {
      const res = await apiService.uploadSlip(orderId, slipImage);
      console.log('Upload slip response:', res);

      if (res.status !== 'success') {
        setChecking(false);
        Alert.alert('ผิดพลาด', res.message || 'ไม่สามารถอัปโหลดสลิปได้');
        return;
      }

      setTimeout(() => {
        setChecking(false);

        const title = res.matched ? 'ชำระเงินสำเร็จ' : 'อัปโหลดสลิปแล้ว';
        const message = res.matched
          ? 'ระบบตรวจพบยอดและข้อมูลการชำระตรงกับออเดอร์แล้ว คำสั่งซื้อถูกยืนยันเรียบร้อย'
          : res.reason === 'mismatch'
            ? 'ระบบรับสลิปแล้ว แต่ข้อมูลที่ตรวจได้ยังไม่ตรงกับออเดอร์ จึงส่งต่อไปให้ตรวจสอบเพิ่มเติม'
            : 'ระบบรับสลิปแล้ว แต่ยังไม่มีข้อมูลเพียงพอสำหรับยืนยันอัตโนมัติ จึงส่งต่อไปให้ตรวจสอบเพิ่มเติม';

        Alert.alert(title, message, [
          { text: 'ตกลง', onPress: () => navigation.navigate('MainTabs') },
        ]);
      }, 1200);
    } catch (error) {
      setChecking(false);
      console.error('Upload slip error:', error?.response?.data || error);
      Alert.alert(
        'ผิดพลาด',
        error?.response?.data?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ'
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {checking && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#0D0D0D" />
            <Text style={styles.loadingText}>ระบบกำลังตรวจสอบการชำระเงิน...</Text>
          </View>
        </View>
      )}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#0D0D0D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ชำระเงิน</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.metaBlock}>
          <Text style={styles.orderText}>คำสั่งซื้อ #{orderId}</Text>
          <Text style={styles.amountText}>฿{formattedAmount}</Text>
          <Text style={styles.captionText}>สแกน QR ด้วยแอปธนาคาร แล้วอัปโหลดสลิปเพื่อยืนยัน</Text>
        </View>

        <View style={styles.qrContainer}>
          <Image source={require('../../assets/thai_qr_payment.png')} style={styles.thaiQrImage} />
          <Image source={require('../../assets/promptpay_logo.png')} style={styles.promptPayImage} />

          <View style={styles.qrWrapper}>
            <QRCode value={payload} size={250} />
          </View>

          <Text style={styles.qrHint}>PromptPay {PROMPTPAY_NUMBER}</Text>
        </View>

        <View style={styles.slipSection}>
          <View style={styles.slipHeader}>
            <Text style={styles.sectionTitle}>สลิปการโอนเงิน</Text>
            {slipImage ? (
              <View style={styles.uploadedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#166534" />
                <Text style={styles.uploadedBadgeText}>อัปโหลดแล้ว</Text>
              </View>
            ) : null}
          </View>

          {slipImage ? (
            <View style={styles.slipCard}>
              <Image source={{ uri: slipImage }} style={styles.slipPreview} />
            </View>
          ) : (
            <TouchableOpacity style={styles.emptySlipCard} activeOpacity={0.85} onPress={pickImage}>
              <Ionicons name="cloud-upload-outline" size={28} color="#9CA3AF" />
              <Text style={styles.emptySlipTitle}>ยังไม่ได้อัปโหลดสลิป</Text>
              <Text style={styles.emptySlipText}>แตะเพื่อเลือกรูปสลิป</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={saveQrCode}>
          <Ionicons name="download-outline" size={18} color="#FFFFFF" />
          <Text style={[styles.buttonText, styles.whiteText]}>บันทึก QR Code</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.uploadButton]} onPress={pickImage}>
          <Ionicons name={slipImage ? 'image-outline' : 'cloud-upload-outline'} size={18} color="#0D0D0D" />
          <Text style={[styles.buttonText, styles.blackText]}>
            {slipImage ? 'เปลี่ยนรูปสลิป' : 'อัปโหลดสลิป'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.confirmButton, !slipImage && styles.disabledButton]}
          onPress={handleConfirmPayment}
          disabled={!slipImage}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={18}
            color={slipImage ? '#0D0D0D' : '#8B8B8B'}
          />
          <Text style={[styles.buttonText, slipImage ? styles.blackText : styles.grayText]}>
            ยืนยันการชำระเงิน
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default PaymentPromptPayScreen;
