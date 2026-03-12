import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/ProductCard.styles';

const ProductCard = ({ product, onPress, isWishlisted, onWishlistPress }) => {
  // ฟังก์ชันแปลงตัวเลขยอดขายให้ดูง่ายขึ้น
  const formatSold = (num) => {
    if (!num || num === 0) return '0';
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
  };

  return (
    <TouchableOpacity 
      style={styles.productCard} 
      activeOpacity={0.85} 
      onPress={onPress}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: product.image }} style={styles.productImage} />
        <View style={styles.soldBadge}>
          {/* นำไอคอนกลับมา */}
          <View style={styles.soldIconContainer}>
            <Ionicons name="trending-up" size={10} color="#22C55E" />
          </View>
          <Text style={styles.soldText}>{formatSold(product.sold)} sold</Text>
        </View>
      </View>
      <View style={styles.content}>
        <Text style={styles.brand}>{product.brand}</Text>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>ราคาเริ่มต้น</Text>
          <View style={styles.priceRow}>
            <Text style={styles.currency}>฿</Text>
            <Text style={styles.price}>{parseFloat(product.price || 0).toLocaleString()}</Text>
            <Ionicons name="flash" size={14} color="#22C55E" style={{ marginLeft: 4 }} />
          </View>
        </View>

        {/* Wishlist Button - เปลี่ยนสีเป็นสีเขียวเมื่อถูกเลือก */}
        <TouchableOpacity 
          style={styles.heartBtn} 
          onPress={(e) => {
            e.stopPropagation();
            onWishlistPress && onWishlistPress(product.id);
          }}
        >
          <Ionicons 
            name={isWishlisted ? "heart" : "heart-outline"} 
            size={20} 
            color={isWishlisted ? "#22C55E" : "#999"} 
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default ProductCard;
