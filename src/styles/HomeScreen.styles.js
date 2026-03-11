import { Dimensions, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS, SHADOW, SPACING } from './theme';

const { width } = Dimensions.get('window');
const bannerWidth = width - 32;

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.screenHeaderTop,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.black,
    letterSpacing: -0.5,
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    fontSize: 14,
    fontWeight: '900',
    color: '#0D0D0D',
  },

  bannerSection: {
    paddingTop: SPACING.md,
  },
  bannerListContent: {
    paddingHorizontal: 16,
  },
  bannerCard: {
    width: bannerWidth,
    height: 280,
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: 14,
    backgroundColor: '#151515',
    ...SHADOW.strong,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  bannerShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  bannerOverlayTop: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  bannerEyebrow: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: FONTS.xs,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  bannerTitle: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  bannerSub: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: FONTS.sm,
    marginTop: 8,
    fontWeight: '500',
  },
  bannerDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  bannerDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: '#D6D6D6',
    marginHorizontal: 4,
  },
  bannerDotActive: {
    width: 20,
    backgroundColor: '#111111',
  },

  shortcutSection: {
    marginTop: 22,
    backgroundColor: COLORS.white,
    paddingTop: SPACING.base,
    paddingBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.lg,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  shortcutList: {
    paddingHorizontal: SPACING.base,
  },
  shortcutCard: {
    width: 136,
    minHeight: 88,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    padding: 14,
    marginRight: 12,
    justifyContent: 'space-between',
  },
  shortcutTitle: {
    fontSize: FONTS.base,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  shortcutArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },

  feedSection: {
    backgroundColor: COLORS.white,
    marginTop: SPACING.xs,
    padding: SPACING.base,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    marginRight: 2,
  },
  feedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  feedCard: {
    width: (width - SPACING.base * 2 - 12) / 2,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    ...SHADOW.card,
  },
  feedImageContainer: {
    width: '100%',
    height: 160,
    backgroundColor: '#F9F9F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedProductImage: {
    width: '80%',
    height: '80%',
    resizeMode: 'contain',
  },
  feedSoldBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  feedSoldText: {
    fontSize: 10,
    color: '#22C55E',
    fontWeight: '600',
    marginLeft: 2,
  },
  feedContent: {
    padding: 10,
  },
  feedBrand: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.black,
  },
  feedName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    height: 32,
  },
  feedPriceContainer: {
    marginTop: 8,
  },
  feedPriceLabel: {
    fontSize: 10,
    color: '#AAAAAA',
  },
  feedPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  feedPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.black,
  },
  feedHeartBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    ...SHADOW.card,
  },
});
