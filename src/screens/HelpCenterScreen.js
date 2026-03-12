import React from 'react';
import { View, Text, SafeAreaView, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BLACK, MUTED } from '../utils/constants';
import { SPACING } from '../styles/theme';

const HelpCenterScreen = ({ navigation }) => {
  const FAQ = [
    { id: 1, question: 'วิธีการสั่งซื้อสินค้า', answer: 'คุณสามารถเลือกสินค้าที่ต้องการลงในตะกร้าและกดชำระเงินได้ทันที' },
    { id: 2, question: 'การเปลี่ยนหรือคืนสินค้า', answer: 'สินค้าสามารถเปลี่ยนได้ภายใน 7 วันหลังจากได้รับสินค้า' },
    { id: 3, question: 'ช่องทางการชำระเงิน', answer: 'เราขอรับชำระผ่านบัตรเครดิต เดบิต และการโอนเงินผ่านธนาคาร' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={BLACK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ศูนย์ช่วยเหลือ</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>คำถามที่พบบ่อย</Text>
        {FAQ.map((item) => (
          <View key={item.id} style={styles.faqItem}>
            <Text style={styles.question}>{item.question}</Text>
            <Text style={styles.answer}>{item.answer}</Text>
          </View>
        ))}
      </ScrollView>
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
  sectionTitle: { fontSize: 20, fontWeight: '800', color: BLACK, marginBottom: 20 },
  faqItem: { marginBottom: 24 },
  question: { fontSize: 16, fontWeight: '700', color: BLACK, marginBottom: 8 },
  answer: { fontSize: 14, color: '#555', lineHeight: 22 },
});

export default HelpCenterScreen;
