export * from './screens';

export const StyleUtils = {
  shadow: (elevation: number) => ({
    shadowOffset: { width: 0, height: elevation / 2 },
    shadowOpacity: 0.1,
    shadowRadius: elevation,
    elevation,
  }),
  centerContent: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  fullWidth: {
    width: '100%' as const,
  },
  flex1: {
    flex: 1,
  },
};
