import { Platform } from 'react-native';

export const BLACK = '#0D0D0D';
export const MUTED = '#AAAAAA';
export const SEARCH_SURFACE = 'rgba(255, 255, 255, 0.75)';
export const SEARCH_BORDER = 'rgba(255, 255, 255, 0.9)';
export const SEARCH_TEXT = '#0D0D0D';
export const SEARCH_PLACEHOLDER = '#8E8E93';
export const SEARCH_ICON = '#111827';
export const SEARCH_SECONDARY_ICON = '#6B7280';
export const TAB_BAR_BOTTOM = Platform.OS === 'ios' ? 24 : 16;

export const TAB_ICONS = {
  หน้าหลัก: { active: 'home', inactive: 'home-outline' },
  ตะกร้า: { active: 'cart', inactive: 'cart-outline' },
  แจ้งเตือน: { active: 'notifications', inactive: 'notifications-outline' },
  โปรไฟล์: { active: 'person', inactive: 'person-outline' },
  ค้นหา: { active: 'search', inactive: 'search-outline' },
};
