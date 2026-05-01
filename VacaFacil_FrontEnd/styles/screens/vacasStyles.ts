import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const vacasStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
  card: {
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 10,
    marginVertical: 6,
    backgroundColor: colors.surface,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: colors.textTertiary,
    fontSize: 15,
  },
});
