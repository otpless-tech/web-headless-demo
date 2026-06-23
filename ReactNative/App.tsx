import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Animated,
} from 'react-native';
import { useAuth } from './src/useAuth';
import LoginScreen from './src/screens/LoginScreen';
import OtpScreen from './src/screens/OtpScreen';
import SuccessScreen from './src/screens/SuccessScreen';
import { COLORS } from './src/constants';

export default function App() {
  const auth = useAuth();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const prevScreen = useRef(auth.screen);

  // Initialize SDK once on mount
  useEffect(() => {
    const cleanup = auth.initialize();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fade transition between screens
  useEffect(() => {
    if (prevScreen.current !== auth.screen) {
      prevScreen.current = auth.screen;
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [auth.screen, fadeAnim]);

  const renderScreen = () => {
    switch (auth.screen) {
      case 'login':
        return <LoginScreen auth={auth} />;
      case 'otp':
        return <OtpScreen auth={auth} />;
      case 'success':
        return <SuccessScreen auth={auth} />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>
        {renderScreen()}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  flex: { flex: 1 },
});
