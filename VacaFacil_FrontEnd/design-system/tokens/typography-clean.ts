// Escala de tamanhos de fonte (tipografia base)
export const FontSizes = {
  xs: 12,     // Muito pequeno (labels, microcopy)
  sm: 14,     // Pequeno (caption, textos auxiliares)
  md: 16,     // Base padrão (body)
  lg: 18,     // Título leve
  xl: 20,     // Subtítulo
  '2xl': 24,  // Título maior
  '3xl': 30,  // Heading principal
} as const; // Tipagem imutável

// Pesos de fonte (font-weight)
export const FontWeights = {
  regular: '400' as const,   // Normal
  medium: '500' as const,    // Médio
  semibold: '600' as const,  // Semi-negrito
  bold: '700' as const,      // Negrito
};

// Altura de linha (line-height)
export const LineHeights = {
  tight: 1.2,    // Mais compacto (headings)
  normal: 1.4,   // Padrão
  relaxed: 1.6,  // Mais espaçado (body para leitura)
} as const;

// Estilos tipográficos prontos para uso
export const TextStyles = {

  // Heading principal
  h1: {
    fontSize: FontSizes['3xl'],     // Tamanho grande
    fontWeight: FontWeights.bold,   // Forte destaque
    lineHeight: LineHeights.tight,  // Linha mais compacta
  },

  // Heading secundário
  h2: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
    lineHeight: LineHeights.tight,
  },

  // Heading terciário
  h3: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.semibold,
    lineHeight: LineHeights.normal,
  },

  // Título de seções/cards
  title: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    lineHeight: LineHeights.normal,
  },

  // Texto padrão do app
  body: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.regular,
    lineHeight: LineHeights.relaxed, // Melhor leitura
  },

  // Texto auxiliar (legendas)
  caption: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.regular,
    lineHeight: LineHeights.normal,
  },

  // Texto muito pequeno
  small: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.regular,
    lineHeight: LineHeights.normal,
  },

  // Texto de botão
  button: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium, // Um pouco mais forte para ação
    lineHeight: LineHeights.normal,
  },
} as const;
