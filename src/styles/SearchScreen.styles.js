import { StyleSheet, Dimensions, Platform } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING, SHADOW } from './theme';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },

  // ── Category Tab Bar (Pill Badges) ────────────────────────
  tabBar: {
    backgroundColor: COLORS.white,
    paddingTop: SPACING.screenHeaderTop,
    paddingBottom: SPACING.md,
  },
  tabScrollContent: {
    paddingHorizontal: SPACING.base,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: RADIUS.full,
    backgroundColor: '#F5F5F5',
  },
  activeTab: { backgroundColor: COLORS.black },
  tabText: { fontSize: FONTS.sm, color: COLORS.textSecondary, fontWeight: '700' },
  activeTabText: { color: COLORS.white },

  // ── Brand Strip ──────────────────────────────────────────
  brandContainer: { backgroundColor: COLORS.white, paddingVertical: SPACING.md },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0D0D0D',
    marginLeft: SPACING.base,
    marginBottom: 12,
  },
  brandItem: { width: 72, alignItems: 'center', marginRight: 16 },
  brandIconPlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: 'transparent',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  brandName: { fontSize: 12, color: '#4A4A4A', textAlign: 'center', fontWeight: '500' },

  // ── Filter Bar ───────────────────────────────────────────
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
  },
  filterScrollContent: { paddingHorizontal: SPACING.base },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    marginRight: 8,
  },
  activeFilter: { backgroundColor: COLORS.black },
  filterText: { fontSize: FONTS.sm, marginLeft: 6, color: COLORS.textSecondary, fontWeight: '600' },
  activeFilterText: { color: COLORS.white },
  filterIconBtn: { paddingHorizontal: SPACING.base },

  // ── Product Grid ─────────────────────────────────────────
  productList: { paddingHorizontal: 15, paddingTop: 10 },
  productCard: {
    width: (width - 30 - 15) / 2,
    marginBottom: 22,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    ...SHADOW.card,
    overflow: Platform.OS === 'ios' ? 'visible' : 'hidden',
  },
  productImageContainer: { 
    width: '100%', 
    aspectRatio: 1.1, 
    backgroundColor: '#fff',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  productImage: { 
    width: '90%', 
    height: '90%', 
    resizeMode: 'contain'
  },
  soldBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  soldText: { 
    fontSize: 11, 
    color: '#999', 
    marginLeft: 3, 
    fontWeight: '500' 
  },

  productInfo: { 
    padding: 12,
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  productBrand: { fontSize: 15, fontWeight: '700', color: '#000' },
  productName: { 
    fontSize: 13, 
    color: '#666', 
    lineHeight: 18, 
    marginTop: 2,
    height: 36,
  },
  priceContainer: { marginTop: 15 },
  priceLabel: { fontSize: 12, color: '#999', marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center' },
  productCurrency: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
    marginRight: 4,
  },
  priceValue: { 
    fontSize: 18,
    fontWeight: '800', 
    color: '#000',
    marginRight: 6,
  },
});
