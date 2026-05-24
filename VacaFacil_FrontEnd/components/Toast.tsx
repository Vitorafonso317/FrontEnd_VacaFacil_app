import { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';

export type ToastType = 'success' | 'error' | 'info';

type Props = {
  message: string;
  type: ToastType;
  visible: boolean;
};

const CONFIG: Record<ToastType, { icon: keyof typeof MaterialIcons.glyphMap; bg: string; color: string }> = {
  success: { icon: 'check-circle', bg: colors.primary, color: colors.onPrimary },
  error: { icon: 'error', bg: colors.error, color: colors.onError },
  info: { icon: 'info', bg: colors.surfaceContainerHighest, color: colors.text },
};

export default function Toast({ message, type, visible }: Props) {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 100, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const cfg = CONFIG[type];

  return (
    <Animated.View style={[s.container, { backgroundColor: cfg.bg, opacity, transform: [{ translateY }] }]}>
      <MaterialIcons name={cfg.icon} size={20} color={cfg.color} />
      <Text style={[s.message, { color: cfg.color }]} numberOfLines={2}>{message}</Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  message: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fonts.semiBold,
  },
});
