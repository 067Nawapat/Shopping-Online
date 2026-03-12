import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import AuthScreen from '../screens/AuthScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProfileScreen from '../screens/ProfileScreen';
import UserInfoScreen from '../screens/UserInfoScreen';
import CartScreen from '../screens/CartScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import CouponsScreen from '../screens/CouponsScreen';
import AddressListScreen from '../screens/AddressListScreen';
import AddAddressScreen from '../screens/AddAddressScreen';
import PaymentMethodsScreen from '../screens/PaymentMethodsScreen';
import HelpCenterScreen from '../screens/HelpCenterScreen';
import ContactUsScreen from '../screens/ContactUsScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CategoryProductsScreen from '../screens/CategoryProductsScreen';
import WishlistScreen from '../screens/WishlistScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import PaymentPromptPayScreen from '../screens/PaymentPromptPayScreen';
import PendingPaymentsScreen from '../screens/PendingPaymentsScreen';

import CustomTabBar from '../components/CustomTabBar';
import { withScreenTransition } from '../components/ScreenTransition';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const HomeScreenAnimated = withScreenTransition(HomeScreen);
const SearchScreenAnimated = withScreenTransition(SearchScreen);
const AuthScreenAnimated = withScreenTransition(AuthScreen);
const LoginScreenAnimated = withScreenTransition(LoginScreen);
const RegisterScreenAnimated = withScreenTransition(RegisterScreen);
const ProfileScreenAnimated = withScreenTransition(ProfileScreen);
const UserInfoScreenAnimated = withScreenTransition(UserInfoScreen);
const CartScreenAnimated = withScreenTransition(CartScreen);
const NotificationsScreenAnimated = withScreenTransition(NotificationsScreen);
const CouponsScreenAnimated = withScreenTransition(CouponsScreen);
const AddressListScreenAnimated = withScreenTransition(AddressListScreen);
const AddAddressScreenAnimated = withScreenTransition(AddAddressScreen);
const PaymentMethodsScreenAnimated = withScreenTransition(PaymentMethodsScreen);
const HelpCenterScreenAnimated = withScreenTransition(HelpCenterScreen);
const ContactUsScreenAnimated = withScreenTransition(ContactUsScreen);
const ProductDetailScreenAnimated = withScreenTransition(ProductDetailScreen);
const CategoryProductsScreenAnimated = withScreenTransition(CategoryProductsScreen);
const WishlistScreenAnimated = withScreenTransition(WishlistScreen);
const CheckoutScreenAnimated = withScreenTransition(CheckoutScreen);
const PaymentPromptPayScreenAnimated = withScreenTransition(PaymentPromptPayScreen);
const PendingPaymentsScreenAnimated = withScreenTransition(PendingPaymentsScreen);

// Main Tab Bar Navigator
const TabNavigator = () => (
  <Tab.Navigator
    tabBar={(props) => <CustomTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="หน้าหลัก" component={HomeScreenAnimated} />
    <Tab.Screen name="ตะกร้า" component={CartScreenAnimated} />
    <Tab.Screen name="แจ้งเตือน" component={NotificationsScreenAnimated} />
    <Tab.Screen name="โปรไฟล์" component={ProfileScreenAnimated} />
    <Tab.Screen name="ค้นหา" component={SearchScreenAnimated} />
  </Tab.Navigator>
);

// Root Stack Navigator (Sub-screens here will hide the Tab Bar)
const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      
      {/* Auth Screens */}
      <Stack.Screen name="Auth" component={AuthScreenAnimated} />
      <Stack.Screen name="Login" component={LoginScreenAnimated} />
      <Stack.Screen name="Register" component={RegisterScreenAnimated} />

      {/* Sub-screens (Hide Bottom Tab Bar) */}
      <Stack.Screen name="UserInfo" component={UserInfoScreenAnimated} />
      <Stack.Screen name="Coupons" component={CouponsScreenAnimated} />
      <Stack.Screen name="Wishlist" component={WishlistScreenAnimated} />
      <Stack.Screen name="AddressList" component={AddressListScreenAnimated} />
      <Stack.Screen name="AddAddress" component={AddAddressScreenAnimated} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreenAnimated} />
      <Stack.Screen name="HelpCenter" component={HelpCenterScreenAnimated} />
      <Stack.Screen name="ContactUs" component={ContactUsScreenAnimated} />
      <Stack.Screen name="SubNotifications" component={NotificationsScreenAnimated} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreenAnimated} />
      <Stack.Screen name="CategoryProducts" component={CategoryProductsScreenAnimated} />
      <Stack.Screen name="Checkout" component={CheckoutScreenAnimated} />
      <Stack.Screen name="PaymentPromptPay" component={PaymentPromptPayScreenAnimated} />
      <Stack.Screen name="PendingPayments" component={PendingPaymentsScreenAnimated} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
