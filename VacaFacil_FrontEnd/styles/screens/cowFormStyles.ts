import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const cowFormStyles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 8,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.primary,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    fontSize: 15,
    color: colors.text,
  },
});
