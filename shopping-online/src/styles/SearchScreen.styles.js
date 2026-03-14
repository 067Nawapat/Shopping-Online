import { StyleSheet, Dimensions, Platform } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING, SHADOW } from './theme';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },

  // ── Category Tab Bar ─────────────────────────────────────
  tabBar: {
    backgroundColor: COLORS.white,
    paddingTop: 50, // ระยะห่างจากขอบบนที่เพิ่มขึ้น
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
    borderWidth: 1,
    borderColor: '#EEE',
  },
  activeFilter: { backgroundColor: COLORS.black, borderColor: COLORS.black },
  filterText: { fontSize: FONTS.sm, marginLeft: 6, color: COLORS.textSecondary, fontWeight: '600' },
  activeFilterText: { color: COLORS.white },

  // ── Product Grid ─────────────────────────────────────────
  productListContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 120, // Space for CustomTabBar
  },
});
