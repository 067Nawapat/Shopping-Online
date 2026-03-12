import { StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING, SHADOW } from './theme';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },

  backBtn: { paddingHorizontal: SPACING.base, paddingTop: SPACING.screenHeaderTop, paddingBottom: SPACING.sm },

  content: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl, flexGrow: 1 },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: SPACING.sm,
  },
  kickerLine: {
    width: 42,
    height: 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accent,
  },
  kickerText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FONTS.xs,
    fontWeight: '800',
    letterSpacing: 1.4,
  },

  title: {
    fontSize: FONTS.xxl,
    fontWeight: '900',
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
    color: COLORS.white,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: FONTS.base,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: SPACING.xl,
    lineHeight: 24,
  },
  panel: {
    width: '100%',
    marginTop: SPACING.sm,
    padding: SPACING.lg,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    ...SHADOW.strong,
  },

  // ── Inputs ───────────────────────────────────────────────
  inputContainer: { marginBottom: SPACING.base },
  label: {
    fontSize: FONTS.xs,
    color: COLORS.white,
    marginBottom: SPACING.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 18,
    paddingHorizontal: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  inputWrapperFocused: {
    borderColor: 'rgba(255,255,255,0.38)',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: FONTS.base,
    color: COLORS.white,
  },
  eyeBtn: { padding: SPACING.xs },

  // ── Password Strength ────────────────────────────────────
  strengthBar: { flexDirection: 'row', marginTop: 6, gap: 4 },
  strengthSegment: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.14)' },
  strengthWeak: { backgroundColor: COLORS.danger },
  strengthMedium: { backgroundColor: COLORS.warning },
  strengthStrong: { backgroundColor: COLORS.success },
  strengthLabel: { fontSize: FONTS.xs, color: 'rgba(255,255,255,0.6)', marginTop: 4 },

  // ── Register Button ──────────────────────────────────────
  registerBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  registerBtnDisabled: { opacity: 0.6 },
  registerBtnText: { color: COLORS.black, fontSize: FONTS.base, fontWeight: '800', letterSpacing: 0.3 },

  // ── Footer ───────────────────────────────────────────────
  footerText: { textAlign: 'center', marginTop: SPACING.lg, color: 'rgba(255,255,255,0.62)', fontSize: FONTS.sm },
  linkText: { color: COLORS.white, fontWeight: '700' },
});
