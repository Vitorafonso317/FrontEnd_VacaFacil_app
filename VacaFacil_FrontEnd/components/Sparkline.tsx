import { View, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

type Props = {
  data: number[];
  height?: number;
  color?: string;
};

export default function Sparkline({ data, height = 36, color = colors.primary }: Props) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  return (
    <View style={[s.container, { height }]}>
      {data.map((v, i) => (
        <View
          key={i}
          style={[
            s.bar,
            {
              height: Math.max(3, (v / max) * height),
              backgroundColor: i === data.length - 1 ? color : color + '55',
            },
          ]}
        />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  bar: {
    flex: 1,
    borderRadius: 3,
  },
});
