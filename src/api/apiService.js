import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// แยก baseURL ให้เหลือแค่โฟลเดอร์ เพื่อให้การต่อ URL ในแต่ละฟังก์ชันถูกต้อง
const BASE_URL = 'http://172.20.10.4/shopping-api/';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export const apiService = {
  // ── Products & Categories ────────────────────────────────
  getProducts: async (categoryId = null, page = 1) => {
    const url = categoryId 
      ? `api.php?action=get_products&category_id=${categoryId}&page=${page}` 
      : `api.php?action=get_products&page=${page}`;
    const response = await api.get(url);
    return response.data;
  },

  getProduct: async (id) => {
    const response = await api.get(`api.php?action=get_product&id=${id}`);
    return response.data;
  },

  getProductDetail: async (id) => {
    const response = await api.get(`api.php?action=get_product_detail&id=${id}`);
    return response.data;
  },

  getProductImages: async (id) => {
    const response = await api.get(`api.php?action=get_product_images&id=${id}`);
    return response.data;
  },

  getProductVariants: async (id) => {
    const response = await api.get(`api.php?action=get_product_variants&id=${id}`);
    return response.data;
  },

  getReviews: async (id) => {
    const response = await api.get(`api.php?action=get_reviews&id=${id}`);
    return response.data;
  },

  searchProducts: async (query) => {
    const response = await api.get(`api.php?action=search_products&q=${encodeURIComponent(query)}`);
    return response.data;
  },

  getPromoProducts: async () => {
    const response = await api.get('api.php?action=get_products');
    return response.data.slice(0, 10).map((p, i) => ({ ...p, rank: i + 1 }));
  },

  getCategories: async () => {
    const response = await api.get('api.php?action=get_categories');
    return response.data;
  },

  // ── Auth & User ──────────────────────────────────────────
  register: async (userData) => {
    const response = await api.post('api.php?action=register', userData);
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post('api.php?action=login', { email, password });
    if (response.data.status === 'success') {
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  googleLogin: (data) => {
    return fetch(`${BASE_URL}api.php?action=google_login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then(async (res) => {
        const raw = await res.text();
        let result = null;

        try {
          result = raw ? JSON.parse(raw) : null;
        } catch {
          throw new Error(raw || 'Google login API ส่งข้อมูลกลับมาไม่ถูกต้อง');
        }

        if (!res.ok) {
          throw new Error(result?.message || `Google login API error (${res.status})`);
        }

        return result;
      })
      .then(async (result) => {
        if (result.status === 'success') {
          await AsyncStorage.setItem('user', JSON.stringify(result.user || data));
        }
        return result;
      });
  },

  logout: async () => {
    await AsyncStorage.removeItem('user');
  },

  getUser: async () => {
    try {
      const user = await AsyncStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  updateProfile: async (userId, profileData) => {
    const response = await api.post('api.php?action=update_profile', { user_id: userId, ...profileData });
    if (response.data.status === 'success') {
      const currentUser = await apiService.getUser();
      const updatedUser = { ...currentUser, ...profileData };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    }
    return response.data;
  },

  // ── Wishlist ─────────────────────────────────────────────
  toggleWishlist: async (userId, productId) => {
    const response = await api.post('api.php?action=toggle_wishlist', { user_id: userId, product_id: productId });
    return response.data;
  },

  getWishlist: async (userId) => {
    const response = await api.get(`api.php?action=get_wishlist&user_id=${userId}`);
    return response.data;
  },

  // ── Cart ─────────────────────────────────────────────────
  addToCart: async (cartData) => {
    const response = await api.post('api.php?action=add_to_cart', cartData);
    return response.data;
  },

  getCart: async (userId) => {
    const response = await api.get(`api.php?action=get_cart&user_id=${userId}`);
    return response.data;
  },

  removeFromCart: async (userId, cartId) => {
    const response = await api.post('api.php?action=remove_from_cart', { user_id: userId, id: cartId });
    return response.data;
  },

  clearCart: async (userId) => {
    const response = await api.post('api.php?action=clear_cart', { user_id: userId });
    return response.data;
  },

  // ── Coupons & Addresses ──────────────────────────────────
  getCoupons: async () => {
    const response = await api.get('api.php?action=get_coupons');
    return response.data;
  },

  getUserCoupons: async (userId) => {
    const response = await api.get(`api.php?action=get_user_coupons&user_id=${userId}`);
    return response.data;
  },

  claimCoupon: async (userId, couponId) => {
    const response = await api.post('api.php?action=claim_coupon', { user_id: userId, coupon_id: couponId });
    return response.data;
  },

  getAddresses: async (userId) => {
    const response = await api.get(`api.php?action=get_addresses&user_id=${userId}`);
    return response.data;
  },

  saveAddress: async (addressData) => {
    const response = await api.post('api.php?action=save_address', addressData);
    return response.data;
  },

  updateAddress: async (addressId, addressData) => {
    const response = await api.post('api.php?action=update_address', { id: addressId, ...addressData });
    return response.data;
  },

  deleteAddress: async (userId, addressId) => {
    const response = await api.post('api.php?action=delete_address', { user_id: userId, id: addressId });
    return response.data;
  },

  setDefaultAddress: async (userId, addressId) => {
    const response = await api.post('api.php?action=set_default_address', { user_id: userId, id: addressId });
    return response.data;
  },

  // ── Orders ───────────────────────────────────────────────
  getOrders: async (userId) => {
    const response = await api.get(`api.php?action=get_orders&user_id=${userId}`);
    return response.data;
  },
};
