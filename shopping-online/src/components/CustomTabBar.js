import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  LayoutAnimation,
  DeviceEventEmitter,
  TextInput,
  Keyboard,
  Animated,
  Easing,
  UIManager,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import {
  BLACK,
  MUTED,
  SEARCH_SURFACE,
  SEARCH_BORDER,
  SEARCH_TEXT,
  SEARCH_PLACEHOLDER,
  SEARCH_ICON,
  SEARCH_SECONDARY_ICON,
  TAB_BAR_BOTTOM,
  TAB_ICONS,
} from '../utils/constants';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const leftRoutes = state.routes.filter((r) => r.name !== 'ค้นหา');
  const searchRoute = state.routes.find((r) => r.name === 'ค้นหา');
  const isSearchFocused = state.routes[state.index].name === 'ค้นหา';

  const [isSearchInputActive, setIsSearchInputActive] = React.useState(false);
  const [searchText, setSearchText] = React.useState('');
  const searchInputRef = React.useRef(null);
  const keyboardOffsetAnim = React.useRef(new Animated.Value(0)).current;
  const searchInputModeAnim = React.useRef(new Animated.Value(0)).current;
  const activeTabTranslateX = React.useRef(new Animated.Value(0)).current;
  const activeTabWidth = React.useRef(new Animated.Value(64)).current;
  const [tabLayouts, setTabLayouts] = React.useState({});

  // Search Syncing
  React.useEffect(() => {
    const syncSub = DeviceEventEmitter.addListener('requestSearchSync', () => {
      if (searchText) {
        DeviceEventEmitter.emit('searchQuery', searchText);
      }
    });

    const clearSub = DeviceEventEmitter.addListener('clearSearchInput', () => {
      setSearchText('');
    });

    return () => {
      syncSub.remove();
      clearSub.remove();
    };
  }, [searchText]);

  React.useEffect(() => {
    if (!isSearchFocused && isSearchInputActive) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsSearchInputActive(false);
    }
  }, [isSearchFocused, isSearchInputActive]);

  React.useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      const keyboardHeight = event.endCoordinates?.height || 0;
      Animated.timing(keyboardOffsetAnim, {
        toValue: Math.max(0, keyboardHeight + 12),
        duration: Platform.OS === 'ios' ? 240 : 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      Animated.timing(keyboardOffsetAnim, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? 220 : 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardOffsetAnim]);

  React.useEffect(() => {
    Animated.timing(searchInputModeAnim, {
      toValue: isSearchInputActive ? 1 : 0,
      duration: isSearchInputActive ? 260 : 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isSearchInputActive, searchInputModeAnim]);

  React.useEffect(() => {
    if (isSearchFocused) {
      return;
    }

    const activeRoute = leftRoutes.find((route) => route.name === state.routes[state.index].name);
    if (!activeRoute) {
      return;
    }

    const activeLayout = tabLayouts[activeRoute.key];
    if (!activeLayout) {
      return;
    }

    Animated.timing(activeTabTranslateX, {
      toValue: activeLayout.x,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    Animated.timing(activeTabWidth, {
      toValue: activeLayout.width,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [activeTabTranslateX, activeTabWidth, isSearchFocused, leftRoutes, state.index, state.routes, tabLayouts]);

  const activateSearchInput = () => {
    if (!isSearchInputActive) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsSearchInputActive(true);
    }
    requestAnimationFrame(() => searchInputRef.current?.focus());
  };

  const collapseSearchInput = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSearchText('');
    setIsSearchInputActive(false);
    searchInputRef.current?.blur();
    DeviceEventEmitter.emit('searchQuery', '');
  };

  const onLeftCirclePress = () => {
    navigation.navigate('หน้าหลัก');
  };

  const idleSearchOpacity = searchInputModeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const idleSearchTranslate = searchInputModeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });
  const activeSearchOpacity = searchInputModeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const activeSearchTranslate = searchInputModeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 0],
  });
  const activeSearchScale = searchInputModeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1],
  });

  return (
    <Animated.View
      style={[
        styles.tabBarContainer,
        {
          transform: [{ translateY: Animated.multiply(keyboardOffsetAnim, -1) }],
        },
      ]}
    >
      {!isSearchFocused && (
        <View style={[styles.leftContainerBase, styles.leftContainerDefault]}>
          <BlurView intensity={80} tint="light" style={styles.blurView} />
          <View style={styles.leftPillContent}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.tabItemActiveIndicator,
                {
                  width: activeTabWidth,
                  transform: [{ translateX: activeTabTranslateX }],
                },
              ]}
            />
            {leftRoutes.map((route) => {
              const isFocused = state.routes[state.index].name === route.name;
              const onPress = () => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
              };

              const icons = TAB_ICONS[route.name];
              const iconName = isFocused ? icons?.active : icons?.inactive;
              const color = isFocused ? BLACK : MUTED;

              return (
                <TouchableOpacity
                  key={route.key}
                  activeOpacity={0.8}
                  onPress={onPress}
                  style={styles.tabItem}
                  onLayout={(event) => {
                    const { x, width } = event.nativeEvent.layout;
                    setTabLayouts((prev) => {
                      const current = prev[route.key];
                      if (current && current.x === x && current.width === width) {
                        return prev;
                      }
                      return { ...prev, [route.key]: { x, width } };
                    });
                  }}
                >
                  <Ionicons name={iconName} size={22} color={color} />
                  <Text style={[styles.tabText, { color: color, fontWeight: isFocused ? '800' : '600' }]}>
                    {route.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {!isSearchFocused && searchRoute && (
        <View style={[styles.rightContainerBase, styles.rightContainerDefault]}>
          <BlurView intensity={80} tint="light" style={styles.blurViewCircle} />
          <TouchableOpacity style={styles.centerContent} activeOpacity={0.8} onPress={() => navigation.navigate('ค้นหา')}>
            <Ionicons name={TAB_ICONS['ค้นหา'].inactive} size={24} color={BLACK} />
          </TouchableOpacity>
        </View>
      )}

      {isSearchFocused && (
        <View style={styles.searchStateContainer}>
          <Animated.View
            pointerEvents={isSearchInputActive ? 'none' : 'auto'}
            style={[
              styles.searchIdleRow,
              {
                opacity: idleSearchOpacity,
                transform: [{ translateY: idleSearchTranslate }],
              },
            ]}
          >
            <View style={[styles.leftContainerBase, styles.leftContainerSearchIdle, { width: 48 }]}>
              <BlurView intensity={80} tint="light" style={styles.blurView} />
              <TouchableOpacity style={styles.centerContent} onPress={onLeftCirclePress} activeOpacity={0.8}>
                <Ionicons name="layers" size={24} color="#0D0D0D" />
              </TouchableOpacity>
            </View>

            <View style={[styles.rightContainerBase, styles.rightContainerSearchIdle]}>
              <BlurView intensity={80} tint="light" style={styles.blurViewCircle} />
              <TouchableOpacity activeOpacity={1} style={styles.searchBarContent} onPress={activateSearchInput}>
                <Ionicons name="search" size={20} color={SEARCH_ICON} />
                <Text style={[styles.expandedSearchInput, !searchText && styles.searchPlaceholderText]} numberOfLines={1}>
                  {searchText || 'ค้นหาสินค้า...'}
                </Text>
                <Ionicons name="mic-outline" size={18} color={SEARCH_SECONDARY_ICON} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View
            pointerEvents={isSearchInputActive ? 'auto' : 'none'}
            style={[
              styles.searchActiveOverlay,
              {
                opacity: activeSearchOpacity,
                transform: [{ translateY: activeSearchTranslate }, { scale: activeSearchScale }],
              },
            ]}
          >
            <View style={styles.searchActiveRow}>
              <View style={styles.searchActivePill}>
                <Ionicons name="search" size={20} color={SEARCH_ICON} />
                <TextInput
                  ref={searchInputRef}
                  style={styles.searchActiveInput}
                  placeholder="ค้นหาสินค้า..."
                  placeholderTextColor={SEARCH_PLACEHOLDER}
                  value={searchText}
                  onChangeText={(text) => {
                    setSearchText(text);
                    DeviceEventEmitter.emit('searchQuery', text);
                  }}
                />
                <Ionicons name="mic-outline" size={18} color={SEARCH_SECONDARY_ICON} />
              </View>
              <TouchableOpacity style={styles.searchActiveCloseButton} onPress={collapseSearchInput} activeOpacity={0.8}>
                <Ionicons name="close" size={24} color={SEARCH_ICON} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: TAB_BAR_BOTTOM,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchStateContainer: {
    flex: 1,
    height: 60,
    justifyContent: 'center',
  },
  searchIdleRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchActiveOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
  },
  leftContainerBase: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  leftContainerDefault: {
    flex: 1,
    height: 60,
    borderRadius: 30,
    marginRight: 8,
  },
  leftContainerSearchIdle: {
    height: 48,
    borderRadius: 24,
    marginRight: 10,
    borderWidth: 1,
    borderColor: SEARCH_BORDER,
  },
  rightContainerBase: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: SEARCH_BORDER,
  },
  rightContainerDefault: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  rightContainerSearchIdle: {
    flex: 1,
    height: 60,
    borderRadius: 30,
  },
  searchActiveRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchActivePill: {
    flex: 1,
    height: 60,
    borderRadius: 30,
    backgroundColor: SEARCH_SURFACE,
    borderWidth: 1,
    borderColor: SEARCH_BORDER,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  searchActiveInput: {
    flex: 1,
    marginHorizontal: 10,
    fontSize: 16,
    color: SEARCH_TEXT,
    fontWeight: '500',
  },
  searchActiveCloseButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginLeft: 10,
    backgroundColor: SEARCH_SURFACE,
    borderWidth: 1,
    borderColor: SEARCH_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  blurViewCircle: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: SEARCH_SURFACE,
    borderWidth: 1.5,
    borderColor: SEARCH_BORDER,
  },
  leftPillContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 6,
    position: 'relative',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  expandedSearchInput: {
    flex: 1,
    marginHorizontal: 10,
    fontSize: 16,
    color: SEARCH_TEXT,
    fontWeight: '500',
  },
  searchPlaceholderText: {
    color: SEARCH_PLACEHOLDER,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    height: 48,
    minWidth: 64,
    borderRadius: 24,
  },
  tabItemActiveIndicator: {
    position: 'absolute',
    left: 0,
    top: 6,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#CCFF00',
    shadowColor: '#CCFF00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 10,
    marginTop: 2,
  },
});

export default CustomTabBar;
