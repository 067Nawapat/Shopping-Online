import React from 'react';
import { View, Text, SafeAreaView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { BLACK, MUTED } from '../utils/constants';
import { SPACING } from '../styles/theme';
import ConfirmModal from '../components/ConfirmModal';

const ContactUsScreen = ({ navigation }) => {
  const [infoModal, setInfoModal] = React.useState(false);
  const openLink = (url) => {
    Linking.openURL(url).catch(() => setInfoModal(true));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={BLACK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ติดต่อเรา</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>ช่องทางการติดต่อ</Text>
        <Text style={styles.sub}>เราพร้อมให้บริการคุณทุกวัน เวลา 09:00 - 22:00 น.</Text>

        <TouchableOpacity style={styles.contactItem} onPress={() => openLink('https://line.me')}>
          <FontAwesome name="comment" size={24} color="#00B900" />
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>Line Official</Text>
            <Text style={styles.contactValue}>@shopping_online</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#CCC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactItem} onPress={() => openLink('mailto:support@shoppingonline.com')}>
          <Ionicons name="mail" size={24} color="#EA4335" />
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>อีเมล</Text>
            <Text style={styles.contactValue}>support@shoppingonline.com</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#CCC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactItem} onPress={() => openLink('tel:021234567')}>
          <Ionicons name="call" size={24} color={BLACK} />
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>เบอร์โทรศัพท์</Text>
            <Text style={styles.contactValue}>02-123-4567</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#CCC" />
        </TouchableOpacity>
      </View>

      <ConfirmModal
        visible={infoModal}
        title="ข้อผิดพลาด"
        message="ไม่สามารถเปิดลิงก์ได้"
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
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '800', color: BLACK, marginBottom: 8 },
  sub: { fontSize: 14, color: MUTED, marginBottom: 30 },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9F9F9',
  },
  contactInfo: { flex: 1, marginLeft: 16 },
  contactLabel: { fontSize: 14, color: MUTED },
  contactValue: { fontSize: 16, fontWeight: '600', color: BLACK, marginTop: 2 },
});

export default ContactUsScreen;
