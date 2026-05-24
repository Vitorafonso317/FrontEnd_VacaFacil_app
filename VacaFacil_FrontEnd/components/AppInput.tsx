import { useState } from 'react';
import {
  TextInput, TextInputProps, View, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';

type Props = TextInputProps & {
  label?: string;
  rightIcon?: React.ReactNode;
  error?: string;
};

export default function AppInput({ label, rightIcon, error, style, ...props }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={s.wrapper}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <View style={[
        s.inputRow,
        focused && s.inputRowFocused,
        !!error && s.inputRowError,
      ]}>
        <TextInput
          style={[s.input, style]}
          placeholderTextColor={colors.textTertiary}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {rightIcon ?? null}
      </View>
      {error ? <Text style={s.errorText}>{error}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { gap: 6 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fonts.bold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    paddingHorizontal: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  inputRowFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  inputRowError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    paddingHorizontal: 2,
  },
});
