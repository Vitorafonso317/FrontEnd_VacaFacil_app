// Sistema simples de espaçamento (spacing)
export const Spacing = {
  xs: 4,     // Espaço extra pequeno
  sm: 8,     // Espaço pequeno
  md: 12,    // Espaço médio
  lg: 16,    // Espaço grande (padrão mais usado)
  xl: 20,    // Espaço extra grande
  '2xl': 24, // Espaço muito grande
  '3xl': 32, // Espaço ainda maior
  '4xl': 48, // Espaço máximo
} as const; // Torna os valores imutáveis e tipados

// Sistema de bordas arredondadas
export const BorderRadius = {
  none: 0,   // Sem arredondamento
  sm: 4,     // Leve arredondamento
  md: 8,     // Médio
  lg: 12,    // Grande
  xl: 16,    // Extra grande
  full: 9999,// Totalmente arredondado (círculo/pill)
} as const;

// Tokens de layout (dimensões padrão)
export const Layout = {
  minTouchTarget: 44, // Tamanho mínimo recomendado para toque (acessibilidade)
  buttonHeight: 48,   // Altura padrão de botão
  inputHeight: 48,    // Altura padrão de input
  screenPadding: 16,  // Padding padrão de telas
} as const;

// Sistema de sombras leve (cross-platform)
export const Shadows = {

  // Sem sombra
  none: {
    shadowOffset: { width: 0, height: 0 }, // Offset da sombra
    shadowOpacity: 0,                      // Transparência (0 = invisível)
    shadowRadius: 0,                       // Desfoque
    elevation: 0,                          // Android
  },

  // Sombra pequena
  sm: {
    shadowOffset: { width: 0, height: 1 }, // Leve deslocamento
    shadowOpacity: 0.05,                   // Bem suave
    shadowRadius: 2,                       // Pouco blur
    elevation: 1,                          // Android
  },

  // Sombra média
  md: {
    shadowOffset: { width: 0, height: 2 }, // Mais deslocamento
    shadowOpacity: 0.1,                    // Mais visível
    shadowRadius: 4,                       // Mais blur
    elevation: 2,                          // Android
  },
} as const;

// Opacidades padrão para estados
export const Opacity = {
  disabled: 0.5, // Quando componente está desabilitado
  pressed: 0.7,  // Quando pressionado (feedback visual)
} as const;
