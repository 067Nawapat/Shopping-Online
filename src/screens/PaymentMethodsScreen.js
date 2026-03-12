import React from 'react';
import { View, Text, SafeAreaView, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BLACK, MUTED } from '../utils/constants';
import { SPACING } from '../styles/theme';
import ConfirmModal from '../components/ConfirmModal';

const PaymentMethodsScreen = ({ navigation }) => {
  const [infoModal, setInfoModal] = React.useState(false);
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={BLACK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>วิธีการชำระเงิน</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.emptyContent}>
          <Ionicons name="card-outline" size={64} color="#DDD" />
          <Text style={styles.title}>ยังไม่มีวิธีการชำระเงิน</Text>
          <Text style={styles.sub}>เพิ่มบัตรเครดิตหรือเดบิตเพื่อการชำระเงินที่รวดเร็วขึ้น</Text>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={() => setInfoModal(true)}>
          <Ionicons name="add-circle-outline" size={20} color={BLACK} />
          <Text style={styles.addBtnText}>เพิ่มบัตรใหม่</Text>
        </TouchableOpacity>
      </ScrollView>

      <ConfirmModal
        visible={infoModal}
        title="แจ้งเตือน"
        message="Feature coming soon"
        confirmText="ตกลง"
        hideCancel
        onConfirm={() => setInfoModal(false)}
        onCancel={() => setInfoModal(false)}
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
  content: { padding: 20, flexGrow: 1 },
  emptyContent: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  title: { fontSize: 20, fontWeight: '700', color: BLACK, marginTop: 16 },
  sub: { fontSize: 14, color: MUTED, marginTop: 6, textAlign: 'center' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    padding: 15,
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 12,
    backgroundColor: '#F9F9F9',
  },
  addBtnText: { fontSize: 16, fontWeight: '600', marginLeft: 8 },
});

export default PaymentMethodsScreen;
