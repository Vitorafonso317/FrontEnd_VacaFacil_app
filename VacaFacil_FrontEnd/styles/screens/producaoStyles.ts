import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const producaoStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: colors.primary,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
    color: colors.text,
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
  card: {
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: colors.surface,
  },
  cardText: {
    fontSize: 14,
    color: colors.text,
  },
  obs: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  empty: {
    textAlign: 'center',
    marginTop: 20,
    color: colors.textTertiary,
  },
});
