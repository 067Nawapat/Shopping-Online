import { StyleSheet, Dimensions, Platform } from 'react-native';
import { COLORS, FONTS, RADIUS, SHADOW, SPACING } from './theme';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: SPACING.screenHeaderTop,
    paddingBottom: 15,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
  },
  backButton: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  section: {
    backgroundColor: COLORS.white,
    padding: 20,
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
  },
  
  // Product Item
  productItem: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    lineHeight: 20,
  },
  productVariant: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.black,
    marginTop: 6,
  },
  productQty: {
    fontSize: 12,
    color: COLORS.textSecondary,
    position: 'absolute',
    right: 0,
    bottom: 0,
  },

  // Address Section
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressIcon: {
    marginTop: 2,
    marginRight: 10,
  },
  addressInfo: {
    flex: 1,
  },
  addressName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  noAddressContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  addAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    borderStyle: 'dashed',
  },
  addAddressText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    marginLeft: 8,
  },
  changeAddressBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  changeAddressText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
  },

  // Shipping
  shippingInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shippingType: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },
  shippingDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  shippingPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.success,
  },

  // Payment Method
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentText: {
    fontSize: 14,
    color: COLORS.black,
    marginLeft: 10,
  },

  // Coupon
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appliedCoupon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  couponText: {
    fontSize: 13,
    color: COLORS.success,
    fontWeight: '600',
    marginLeft: 6,
    marginRight: 6,
  },

  // Summary Row
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    color: COLORS.black,
    fontWeight: '500',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.success,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 35 : 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    ...SHADOW.strong,
  },
  checkoutBtn: {
    backgroundColor: COLORS.accent,
    height: 54,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutBtnDisabled: {
    backgroundColor: '#E0E0E0',
  },
  checkoutBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.black,
  },
  footerAgreement: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },
  linkText: {
    textDecorationLine: 'underline',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalList: {
    padding: 20,
  },
  addressOption: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    marginBottom: 12,
  },
  selectedAddressOption: {
    borderColor: COLORS.black,
    backgroundColor: '#F9F9F9',
  },
  couponOption: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCouponOption: {
    borderColor: COLORS.success,
    backgroundColor: '#F0FDF4',
  },
  couponInfo: {
    flex: 1,
  },
  couponCode: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.black,
  },
  couponDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
