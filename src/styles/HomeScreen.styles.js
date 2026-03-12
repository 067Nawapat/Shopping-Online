import { Dimensions, StyleSheet, Platform } from 'react-native';
import { COLORS, FONTS, RADIUS, SHADOW, SPACING } from './theme';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  header: {
    backgroundColor: COLORS.white,
    paddingTop: SPACING.screenHeaderTop,
    paddingBottom: SPACING.sm,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: COLORS.black,
    letterSpacing: -1,
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#CCFF00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
  },

  shortcutScroll: {
    paddingLeft: 20,
  },
  shortcutList: {
    paddingRight: 20,
    paddingBottom: 10,
  },
  shortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 100,
    marginRight: 10,
  },
  shortcutCardActive: {
    backgroundColor: '#000',
  },
  shortcutIcon: {
    display: 'none',
  },
  shortcutTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#777',
  },
  shortcutTitleActive: {
    color: '#FFF',
  },

  bannerSection: {
    paddingTop: 10,
  },
  bannerDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  bannerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  bannerDotActive: {
    width: 20,
    backgroundColor: '#000',
  },

  feedSection: {
    backgroundColor: COLORS.white,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginRight: 2,
  },
  feedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 5,
  },
  feedCard: {
    width: (width - 40 - 15) / 2,
    backgroundColor: COLORS.white,
    marginBottom: 22,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    ...SHADOW.card,
    overflow: Platform.OS === 'ios' ? 'visible' : 'hidden',
  },
  feedImageContainer: {
    width: '100%',
    aspectRatio: 1, // ปรับเป็น 1 เพื่อให้รูปจัตุรัสเต็มสวยๆ
    backgroundColor: '#F9F9F9',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    overflow: 'hidden',
  },
  feedProductImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover', // ปรับเป็น cover เพื่อให้รูปเต็มกรอบ
  },
  feedSoldBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
    zIndex: 1,
  },
  feedSoldText: {
    fontSize: 11,
        color: '#999',
        fontWeight: '500',
    marginLeft: 3,
  },
  feedContent: {
    padding: 12,
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  feedBrand: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  feedName: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
    lineHeight: 18,
    height: 36,
  },
  feedPriceContainer: {
    marginTop: 15,
  },
  feedPriceLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  feedPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedCurrency: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
    marginRight: 4,
  },
  feedPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    marginRight: 6,
  },
});
