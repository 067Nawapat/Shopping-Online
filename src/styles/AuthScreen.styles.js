import { StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING, SHADOW } from './theme';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  hero: {
    flex: 1,
    backgroundColor: '#050505',
  },

  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl + 8,
    paddingBottom: SPACING.xl,
    justifyContent: 'space-between',
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  kickerLine: {
    width: 42,
    height: 2,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.full,
  },
  kickerText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FONTS.xs,
    fontWeight: '800',
    letterSpacing: 1.6,
  },

  logoContainer: {
    marginTop: SPACING.xl,
  },
  logoText: {
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -1.6,
    lineHeight: 46,
    color: COLORS.white,
  },

  titleContainer: {
    marginTop: SPACING.md,
  },
  titleText: {
    fontSize: FONTS.xxl,
    fontWeight: '800',
    textAlign: 'left',
    lineHeight: 40,
    color: COLORS.white,
    letterSpacing: -0.6,
  },
  titleAccent: {
    color: COLORS.accent,
    fontWeight: '900',
  },
  subtitleText: {
    marginTop: SPACING.md,
    color: 'rgba(255,255,255,0.72)',
    fontSize: FONTS.base,
    lineHeight: 24,
    maxWidth: '92%',
  },

  panel: {
    width: '100%',
    padding: SPACING.lg,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    ...SHADOW.strong,
  },
  panelHeader: {
    marginBottom: SPACING.md,
  },
  panelEyebrow: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FONTS.xs,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  panelTitle: {
    color: COLORS.white,
    fontSize: FONTS.lg,
    fontWeight: '800',
  },
  buttonContainer: { width: '100%', gap: 12 },

  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 18,
    paddingVertical: 16,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  socialBtnDisabled: {
    opacity: 0.6,
  },
  socialBtnText: {
    fontSize: FONTS.base,
    fontWeight: '600',
    marginLeft: SPACING.sm,
    color: COLORS.white,
  },

  emailBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  emailBtnText: {
    fontSize: FONTS.base,
    fontWeight: '700',
    color: COLORS.black,
    letterSpacing: 0.2,
  },

  loginBtn: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  loginText: {
    fontSize: FONTS.md,
    fontWeight: '700',
    color: COLORS.white,
    opacity: 0.86,
  },
});
