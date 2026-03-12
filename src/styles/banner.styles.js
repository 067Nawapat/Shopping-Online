import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width - 40;

export default StyleSheet.create({
  bannerContainer: {
    width: BANNER_WIDTH,
    height: 420,
    borderRadius: 30,
    overflow: 'hidden',
    marginHorizontal: 20,
    backgroundColor: '#000',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  imageBackground: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  textSection: {
    marginTop: 10,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: 'white',
    lineHeight: 40,
    width: '80%',
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 12,
    fontWeight: '500',
  },
  cartIcon: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.2)', 
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end', // ให้ปุ่มอยู่ชิดขวา
  }
});
