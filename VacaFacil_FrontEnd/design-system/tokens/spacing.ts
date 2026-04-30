// Sistema de espaçamento (baseado em escala consistente)
export const Spacing = {
  xs: 4,     // Espaço mínimo
  sm: 8,     // Pequeno
  md: 12,    // Médio
  lg: 16,    // Padrão mais utilizado
  xl: 20,    // Grande
  '2xl': 24, // Muito grande
  '3xl': 32, // Extra grande
  '4xl': 40, // Máximo (reduzido de 48 → mais compacto)
} as const; // Torna imutável e tipado

// Sistema de bordas (mais refinado e específico por uso)
export const BorderRadius = {
  none: 0,        // Sem borda
  sm: 4,          // Leve arredondamento
  md: 8,          // Médio
  lg: 12,         // Grande
  xl: 16,         // Extra grande
  '2xl': 20,      // Muito grande
  full: 9999,     // Totalmente arredondado (círculo)

  // Tokens específicos por componente
  button: 10,     // Botões (consistência visual)
  card: 12,       // Cards
  input: 10,      // Inputs
  chatBubble: 16, // Bolhas de chat
} as const;

// Tokens de layout (estrutura e dimensões globais)
export const Layout = {

  // Área mínima de toque (acessibilidade)
  minTouchTarget: 44,
  
  // Alturas padrão de componentes
  buttonHeight: 48,
  inputHeight: 48,
  headerHeight: 56,
  
  // Limites de largura
  maxChatBubbleWidth: '80%', // Evita bolhas muito largas
  maxContentWidth: 400,      // Limite de conteúdo em telas grandes
  
  // Padding padrão das telas
  screenPadding: Spacing.lg,
  
  // Espaçamento entre elementos
  componentMargin: Spacing.md, // Entre componentes
  sectionMargin: Spacing.xl,   // Entre seções
} as const;

// Sistema de sombras (níveis de elevação)
export const Shadows = {

  // Sem sombra
  none: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0, // Android
  },

  // Sombra leve
  sm: {
    shadowOffset: { width: 0, height: 1 }, // Pequeno deslocamento
    shadowOpacity: 0.1,                    // Levemente visível
    shadowRadius: 2,                       // Pouco blur
    elevation: 2,                          // Android
  },

  // Sombra média
  md: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },

  // Sombra grande
  lg: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },

  // Sombra extra grande
  xl: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 16,
  },
} as const;

// Opacidades padronizadas para estados e camadas
export const Opacity = {
  disabled: 0.5, // Componente desabilitado
  pressed: 0.8,  // Feedback ao pressionar
  overlay: 0.5,  // Fundo de modais
  subtle: 0.6,   // Elementos com menor destaque
} as const;
