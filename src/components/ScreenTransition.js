import React from 'react';
import { Animated, Easing } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

const ScreenTransitionView = ({ children }) => {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(18)).current;
  const scale = React.useRef(new Animated.Value(0.985)).current;

  useFocusEffect(
    React.useCallback(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      return () => {
        opacity.setValue(0);
        translateY.setValue(18);
        scale.setValue(0.985);
      };
    }, [opacity, scale, translateY]),
  );

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity,
        transform: [{ translateY }, { scale }],
      }}
    >
      {children}
    </Animated.View>
  );
};

export const withScreenTransition = (Component) => {
  const WrappedScreen = (props) => (
    <ScreenTransitionView>
      <Component {...props} />
    </ScreenTransitionView>
  );

  WrappedScreen.displayName = `WithScreenTransition(${Component.displayName || Component.name || 'Screen'})`;
  return WrappedScreen;
};
