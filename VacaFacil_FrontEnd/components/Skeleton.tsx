import { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

function Block({ width, height, borderRadius = 6, style }: {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: object;
}) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 750, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: colors.surfaceContainerHighest },
        style,
        { opacity },
      ]}
    />
  );
}

export function SkeletonCowCard() {
  return (
    <View style={s.cowCard}>
      <Block width={72} height={72} borderRadius={8} />
      <View style={s.info}>
        <Block width="55%" height={14} />
        <Block width="38%" height={12} style={{ marginTop: 8 }} />
      </View>
      <Block width={40} height={40} borderRadius={8} />
    </View>
  );
}

export function SkeletonProductionCard() {
  return (
    <View style={s.prodCard}>
      <Block width={48} height={48} borderRadius={8} />
      <View style={s.info}>
        <Block width="50%" height={14} />
        <Block width="30%" height={12} style={{ marginTop: 6 }} />
      </View>
      <Block width={52} height={18} borderRadius={4} />
    </View>
  );
}

export function SkeletonTransactionCard() {
  return (
    <View style={s.transCard}>
      <Block width={48} height={48} borderRadius={24} />
      <View style={s.info}>
        <Block width="55%" height={14} />
        <Block width="28%" height={12} style={{ marginTop: 6 }} />
      </View>
      <Block width={64} height={18} borderRadius={4} />
    </View>
  );
}

const cardBase = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  backgroundColor: colors.surfaceContainerLowest,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: colors.borderLight,
  padding: 12,
  gap: 12,
};

const s = StyleSheet.create({
  cowCard: { ...cardBase, minHeight: 96 },
  prodCard: { ...cardBase, minHeight: 72 },
  transCard: { ...cardBase, minHeight: 72 },
  info: { flex: 1 },
});
