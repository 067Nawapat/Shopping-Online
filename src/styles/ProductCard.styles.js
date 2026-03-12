import { Dimensions, StyleSheet, Platform } from 'react-native';
import { COLORS, SHADOW } from './theme';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
  productCard: {
    width: (width - 40 - 15) / 2,
    backgroundColor: COLORS.white,
    marginBottom: 22,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    ...SHADOW.card,
    overflow: Platform.OS === 'ios' ? 'visible' : 'hidden',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  soldBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(230, 230, 230, 0.7)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 100,
    zIndex: 1,
  },
  soldText: {
    fontSize: 9,
    color: '#333333', 
    fontWeight: '800',
    marginLeft: 3,
  },
  content: {
    padding: 12,
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    position: 'relative',
  },
  brand: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  name: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
    lineHeight: 18,
    height: 36,
  },
  priceContainer: {
    marginTop: 15,
  },
  priceLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currency: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
    marginRight: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    marginRight: 6,
  },
  heartBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    padding: 4,
    zIndex: 2,
  },
});
