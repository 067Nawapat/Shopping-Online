import { StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS, SHADOW, SPACING } from './theme';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.screenHeaderTop,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.white,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONTS.lg,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: SPACING.sm,
    paddingBottom: 120,
  },
  productCard: {
    flex: 1,
    margin: SPACING.xs,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },
  productImageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.bg,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  soldBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  soldText: {
    fontSize: FONTS.xs,
    color: COLORS.textSecondary,
    marginLeft: 2,
    fontWeight: '600',
  },
  productInfo: {
    padding: SPACING.sm,
  },
  productBrand: {
    fontSize: FONTS.sm,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  productName: {
    fontSize: FONTS.xs,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginVertical: 3,
    minHeight: 32,
  },
  priceContainer: {
    marginTop: 4,
  },
  priceLabel: {
    fontSize: FONTS.xs,
    color: COLORS.textMuted,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  priceValue: {
    fontSize: FONTS.base,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginRight: 3,
  },
  heartBtn: {
    position: 'absolute',
    bottom: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    padding: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: FONTS.lg,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: FONTS.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
