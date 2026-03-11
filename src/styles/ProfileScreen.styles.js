import { StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING, SHADOW } from './theme';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // ── Profile Header ───────────────────────────────────────
  header: {
    backgroundColor: COLORS.bgDark,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.screenHeaderTop,
    paddingBottom: SPACING.base,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    color: COLORS.black,
    fontWeight: '900',
    fontSize: FONTS.base,
    textAlign: 'center',
    lineHeight: 18,
  },
  userInfo: { flex: 1 },
  userName: { fontSize: FONTS.lg, fontWeight: '700', color: COLORS.white, marginBottom: 4 },
  userEmail: { fontSize: FONTS.sm, color: 'rgba(255,255,255,0.5)', marginBottom: 6 },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(204,255,0,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.3)',
  },
  verifiedText: { color: COLORS.accent, fontSize: FONTS.xs, fontWeight: '700', marginLeft: 3 },

  // ── Section ──────────────────────────────────────────────
  section: {
    backgroundColor: COLORS.white,
    marginTop: SPACING.xs,
    paddingVertical: SPACING.md,
    ...SHADOW.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.md,
  },
  sectionTitle: { fontSize: FONTS.base, fontWeight: '700', color: COLORS.textPrimary },
  // ── Purchase Grid ────────────────────────────────────────
  purchaseGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.sm,
  },
  purchaseItem: {
    width: '24%',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  purchaseIconWrap: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 10,
  },
  purchaseLabel: {
    fontSize: 12,
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 17,
    fontWeight: '500',
  },
  purchaseBadge: {
    position: 'absolute',
    top: -2,
    right: -8,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: '#F06C45',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  purchaseBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },

  // ── Menu Items ───────────────────────────────────────────
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuIcon: { marginRight: SPACING.md },
  menuLabel: { flex: 1, fontSize: FONTS.base, color: COLORS.textPrimary },
  menuValue: { fontSize: FONTS.sm, color: COLORS.textMuted, marginRight: SPACING.xs },

  // ── Logout Button ────────────────────────────────────────
  logoutBtn: {
    backgroundColor: COLORS.white,
    marginTop: SPACING.xs,
    padding: SPACING.base,
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoutText: { color: COLORS.danger, fontWeight: '700', fontSize: FONTS.md },
  versionText: { color: COLORS.textMuted, fontSize: FONTS.xs, marginTop: 6 },
});
