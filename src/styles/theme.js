// ─── App Design System ───────────────────────────────────────
// ใช้ไฟล์นี้เป็น Single Source of Truth สำหรับ color, spacing, typography
import { Platform, StatusBar } from 'react-native';

export const COLORS = {
    // Primary Palette
    black: '#0D0D0D',
    white: '#FFFFFF',
    accent: '#CCFF00',

    // Backgrounds
    bg: '#F7F7F7',
    bgCard: '#FFFFFF',
    bgDark: '#111111',

    // Text
    textPrimary: '#0D0D0D',
    textSecondary: '#666666',
    textMuted: '#AAAAAA',
    textInverse: '#FFFFFF',

    // UI States
    border: '#EBEBEB',
    borderFocus: '#0D0D0D',
    success: '#22C55E',
    danger: '#EF4444',
    warning: '#F59E0B',

    // Tab / Badges
    badgeRed: '#FF3B30',
};

export const FONTS = {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 19,
    xl: 22,
    xxl: 28,
    xxxl: 36,
};

export const RADIUS = {
    sm: 6,
    md: 10,
    lg: 16,
    full: 999,
};

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 28,
    xxl: 40,
    headerTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 34,   // ดันลงมาหลบแถบแจ้งเตือน
};

SPACING.screenHeaderTop = SPACING.headerTop + 20;

export const SHADOW = {
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    strong: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
    },
};
