import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../styles/ProfileScreen.styles';

export const StatusItem = ({ icon, label }) => (
  <View style={styles.statusItem}>
    <MaterialCommunityIcons name={icon} size={26} color="#CCFF00" />
    <Text style={styles.statusText}>{label}</Text>
  </View>
);

export const MenuItem = ({ icon, label, onPress, value }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <Ionicons name={icon} size={20} color="#555" style={styles.menuIcon} />
    <Text style={styles.menuLabel}>{label}</Text>
    {value && <Text style={styles.menuValue}>{value}</Text>}
    <Ionicons name="chevron-forward" size={16} color="#CCC" />
  </TouchableOpacity>
);
