// Interface que define todas as cores obrigatórias do sistema
export interface ColorTokens {
  primary: string;        // Cor principal
  primaryLight: string;   // Versão clara da cor principal (container)
  primaryDark: string;    // Versão escura da cor principal
  onPrimary: string;      // Texto/ícone sobre a cor primária
  secondary: string;      // Cor secundária
  background: string;     // Fundo principal da aplicação
  surface: string;        // Fundo de cartões/componentes
  surfaceElevated: string;// Fundo de elementos elevados
  surfaceVariant: string; // Variação de superfície (chips, tags)
  textPrimary: string;    // Texto principal
  textSecondary: string;  // Texto secundário
  textTertiary: string;   // Texto terciário (placeholders, hints)
  success: string;        // Cor de sucesso
  error: string;          // Cor de erro
  onError: string;        // Texto/ícone sobre cor de erro
  warning: string;        // Cor de alerta
  border: string;         // Borda principal
  borderLight: string;    // Borda mais suave
  outline: string;        // Contorno de campos e componentes
  shadow: string;         // Cor da sombra
  overlay: string;        // Fundo de overlay/modal

  // Grupo específico para notificações e status do rebanho
  status: {
    active: string;       // Vaca ativa/saudável
    inactive: string;     // Vaca inativa
    alert: string;        // Alerta (reprodução, saúde)
    onActive: string;     // Texto sobre status ativo
  };
}

/* =========================
   Light Theme — VacaFácil
   Alta legibilidade para uso externo (campo aberto, luz forte)
   ========================= */
export const lightTheme: ColorTokens = {

  // Verde VacaFácil — identidade do produto
  primary: '#2e7d32',      // Verde principal (botões, links, destaques)
  primaryLight: '#c8e6c9', // Verde claro (container, chips, badges)
  primaryDark: '#0d631b',  // Verde escuro (hover, pressed, headers)
  onPrimary: '#ffffff',    // Texto branco sobre verde
  secondary: '#a5d6a7',    // Verde suave (elementos secundários)

  // Fundos — tons naturais de campo
  background: '#f7fbf0',   // Fundo geral (verde muito claro, quase branco)
  surface: '#ffffff',      // Superfícies (cards, modais)
  surfaceElevated: '#f1f8e9', // Elementos elevados (dropdowns, tooltips)
  surfaceVariant: '#dcedc8',  // Chips, tags, badges de categoria

  // Hierarquia de texto — alto contraste para uso externo
  textPrimary: '#181d17',  // Texto principal (quase preto, máximo contraste)
  textSecondary: '#3a4a36',// Texto secundário (verde escuro neutro)
  textTertiary: '#707a6c', // Texto discreto (placeholders, hints)

  // Cores semânticas
  success: '#2e7d32',      // Sucesso (mesmo verde primário — consistência)
  error: '#ba1a1a',        // Erro (vermelho forte, alto contraste)
  onError: '#ffffff',      // Texto branco sobre erro
  warning: '#e65100',      // Alerta (laranja escuro — legível no campo)

  // Bordas
  border: '#707a6c',       // Borda principal (cinza-verde, visível no campo)
  borderLight: '#e0e4da',  // Borda suave (separadores, divisores)
  outline: '#2e7d32',      // Contorno de campos focados

  // Sombras e sobreposições
  shadow: 'rgba(13, 99, 27, 0.08)',  // Sombra esverdeada sutil
  overlay: 'rgba(24, 29, 23, 0.4)', // Overlay escuro com tom de campo

  // Status do rebanho
  status: {
    active: '#2e7d32',     // Verde — vaca ativa/saudável
    inactive: '#707a6c',   // Cinza — vaca inativa
    alert: '#e65100',      // Laranja — requer atenção
    onActive: '#ffffff',   // Texto sobre status ativo
  },
};

/* =========================
   Dark Theme — VacaFácil
   Para uso noturno (ordenha, registros noturnos)
   ========================= */
export const darkTheme: ColorTokens = {

  // Verde adaptado para fundo escuro
  primary: '#81c784',      // Verde claro (legível no escuro)
  primaryLight: '#1b5e20', // Verde profundo (container no dark)
  primaryDark: '#a5d6a7',  // Verde mais claro (hover no dark)
  onPrimary: '#003300',    // Texto escuro sobre verde claro
  secondary: '#4caf50',    // Verde médio

  // Fundos escuros com tom esverdeado
  background: '#0f1a0f',   // Fundo geral (verde muito escuro)
  surface: '#1a2e1a',      // Superfície
  surfaceElevated: '#243324', // Elevado
  surfaceVariant: '#2d3d2d',  // Chips, tags no dark

  // Hierarquia de texto no dark
  textPrimary: '#e8f5e9',  // Texto principal (verde muito claro)
  textSecondary: '#a5d6a7',// Texto secundário
  textTertiary: '#6a9b6a', // Texto discreto

  // Cores semânticas no dark
  success: '#81c784',
  error: '#ef9a9a',
  onError: '#690000',
  warning: '#ffb74d',

  // Bordas no dark
  border: '#4a5e4a',
  borderLight: '#2d3d2d',
  outline: '#81c784',

  // Sombras mais fortes no dark
  shadow: 'rgba(0, 0, 0, 0.4)',
  overlay: 'rgba(0, 0, 0, 0.7)',

  // Status do rebanho no dark
  status: {
    active: '#81c784',
    inactive: '#6a9b6a',
    alert: '#ffb74d',
    onActive: '#003300',
  },
};

// Exporta o tema padrão da aplicação (light)
export const Colors = lightTheme;
