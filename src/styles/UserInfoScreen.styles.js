import { StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from './theme';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },

  // ── Header ──────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.screenHeaderTop,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    fontSize: FONTS.md,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    color: COLORS.textPrimary,
    marginRight: 24,
  },

  // ── Avatar ───────────────────────────────────────────────
  content: { padding: SPACING.lg, alignItems: 'center' },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    borderWidth: 3,
    borderColor: COLORS.accent,
  },
  avatarText: {
    color: COLORS.accent,
    fontSize: FONTS.xl,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 28,
  },
  emailHeader: {
    fontSize: FONTS.md,
    fontWeight: '700',
    marginBottom: 4,
    color: COLORS.textPrimary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.black,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.xl,
  },
  verifiedText: { color: COLORS.accent, fontSize: FONTS.xs, fontWeight: '700', marginLeft: 4 },

  // ── Form ─────────────────────────────────────────────────
  form: { width: '100%' },
  inputGroup: { marginBottom: SPACING.base },
  label: {
    fontSize: FONTS.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    fontSize: FONTS.base,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    minHeight: 52,
  },
  disabledInput: {
    backgroundColor: COLORS.bg,
    color: COLORS.textMuted,
    borderColor: COLORS.border,
  },

  // ── Footer Buttons ───────────────────────────────────────
  footer: {
    flexDirection: 'row',
    padding: SPACING.base,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    gap: SPACING.sm,
  },
  deleteBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    borderRadius: RADIUS.sm,
    paddingVertical: 13,
    alignItems: 'center',
  },
  deleteBtnText: { color: COLORS.danger, fontSize: FONTS.base, fontWeight: '700' },
  saveBtn: {
    flex: 1.5,
    backgroundColor: COLORS.black,
    borderRadius: RADIUS.sm,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveBtnText: { color: COLORS.white, fontSize: FONTS.base, fontWeight: '700' },
});
