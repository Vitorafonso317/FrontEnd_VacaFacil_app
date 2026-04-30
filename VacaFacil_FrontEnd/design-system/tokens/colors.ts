// Interface que define todas as cores obrigatórias do sistema
export interface ColorTokens {
  primary: string;        // Cor principal
  primaryLight: string;   // Versão clara da cor principal
  primaryDark: string;    // Versão escura da cor principal
  secondary: string;      // Cor secundária
  background: string;     // Fundo principal da aplicação
  surface: string;        // Fundo de cartões/componentes
  surfaceElevated: string;// Fundo de elementos elevados
  textPrimary: string;    // Texto principal
  textSecondary: string;  // Texto secundário
  textTertiary: string;   // Texto terciário
  success: string;        // Cor de sucesso
  error: string;          // Cor de erro
  warning: string;        // Cor de alerta
  border: string;         // Borda principal
  borderLight: string;    // Borda mais suave
  shadow: string;         // Cor da sombra
  overlay: string;        // Fundo de overlay/modal

  // Grupo específico para chat
  chat: {
    userBubble: string;   // Bolha do usuário
    otherBubble: string;  // Bolha do outro usuário
    userText: string;     // Texto do usuário
    otherText: string;    // Texto do outro usuário
  };
}

/* =========================
   Light Theme (tema claro)
   ========================= */
export const lightTheme: ColorTokens = {

  // Paleta azul clara
  primary: '#3B82F6',      // Azul principal
  primaryLight: '#DBEAFE', // Azul claro
  primaryDark: '#1D4ED8',  // Azul escuro
  secondary: '#E0F2FE',    // Azul secundário

  // Fundos claros
  background: '#FAFBFC',   // Fundo geral
  surface: '#FFFFFF',      // Superfícies
  surfaceElevated: '#F8FAFC', // Elementos elevados

  // Hierarquia de texto
  textPrimary: '#1F2937',  // Texto principal
  textSecondary: '#6B7280',// Texto secundário
  textTertiary: '#9CA3AF', // Texto discreto

  // Cores semânticas
  success: '#10B981',      // Verde
  error: '#EF4444',        // Vermelho
  warning: '#F59E0B',      // Amarelo

  // Bordas suaves
  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  // Sombras leves
  shadow: 'rgba(0, 0, 0, 0.05)',
  overlay: 'rgba(0, 0, 0, 0.3)',

  // Cores do chat no tema claro
  chat: {
    userBubble: '#3B82F6',  // Bolha azul do usuário
    otherBubble: '#F3F4F6', // Bolha cinza clara
    userText: '#FFFFFF',    // Texto branco
    otherText: '#1F2937',   // Texto escuro
  }
};

/* =========================
   Dark Theme (tema escuro)
   ========================= */
export const darkTheme: ColorTokens = {

  // Paleta azul para modo escuro
  primary: '#60A5FA',      // Azul principal
  primaryLight: '#1E3A8A', // Azul profundo
  primaryDark: '#3B82F6',  // Azul médio
  secondary: '#1E293B',    // Fundo secundário

  // Fundos escuros
  background: '#111827',   // Fundo geral
  surface: '#1F2937',      // Superfície
  surfaceElevated: '#374151', // Elevado

  // Hierarquia de texto escuro
  textPrimary: '#F9FAFB',  // Texto principal
  textSecondary: '#D1D5DB',// Texto secundário
  textTertiary: '#9CA3AF', // Texto discreto

  // Cores semânticas no dark
  success: '#34D399',
  error: '#F87171',
  warning: '#FBBF24',

  // Bordas escuras
  border: '#374151',
  borderLight: '#4B5563',

  // Sombras mais fortes
  shadow: 'rgba(0, 0, 0, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.6)',

  // Cores do chat no dark
  chat: {
    userBubble: '#60A5FA', // Azul claro
    otherBubble: '#374151',// Cinza escuro
    userText: '#111827',   // Texto escuro
    otherText: '#F9FAFB',  // Texto claro
  }
};

// Exporta o tema padrão da aplicação
export const Colors = lightTheme;
