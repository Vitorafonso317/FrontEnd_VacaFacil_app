import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const perfilStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.primary,
  },
  info: {
    fontSize: 15,
    color: colors.text,
    marginBottom: 6,
  },
  logout: {
    marginTop: 32,
    gap: 12,
  },
});
