// Importa React
import React from 'react';

// Importa componentes e tipos do React Native
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

// Importa tokens de cores
import { Colors } from '../tokens/colors';

// Importa estilos tipográficos
import { TextStyles } from '../tokens/typography';

// Importa tokens de espaçamento, borda, layout e opacidade
import { Spacing, BorderRadius, Layout, Opacity } from '../tokens/spacing';

// Define as variantes do botão (inclui danger)
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

// Define os tamanhos disponíveis
export type ButtonSize = 'sm' | 'md' | 'lg';

// Interface das props do botão
interface ButtonProps {
  title: string;              // Texto exibido
  onPress: () => void;        // Função de clique
  variant?: ButtonVariant;    // Variante visual
  size?: ButtonSize;          // Tamanho
  disabled?: boolean;         // Estado desabilitado
  loading?: boolean;          // Estado de carregamento
  style?: ViewStyle;          // Estilo externo do container
  textStyle?: TextStyle;      // Estilo externo do texto
  fullWidth?: boolean;        // Ocupa largura total
}

// Componente Button
export function Button({
  title,
  onPress,
  variant = 'primary',   // Valor padrão
  size = 'md',           // Valor padrão
  disabled = false,      // Valor padrão
  loading = false,       // Valor padrão
  style,
  textStyle,
  fullWidth = false,     // Valor padrão
}: ButtonProps) {

  // Função intermediária para evitar clique quando desabilitado ou carregando
  const handlePress = () => {
    if (!disabled && !loading) {
      onPress(); // Executa ação apenas se permitido
    }
  };

  return (
    <TouchableOpacity

      // Combinação de estilos dinâmica
      style={[
        styles.base,                  // Base do botão
        styles[variant],              // Variante (primary, secondary, etc.)
        styles[size],                 // Tamanho (sm, md, lg)
        disabled && styles.disabled,  // Estado desabilitado
        fullWidth && styles.fullWidth,// Largura total
        style,                        // Estilo externo
      ]}

      // Evento de clique controlado
      onPress={handlePress}

      // Bloqueia interação se desabilitado ou carregando
      disabled={disabled || loading}

      // Opacidade ao pressionar
      activeOpacity={0.8}
    >

      <Text

        // Estilos do texto
        style={[
          styles.text,                    // Base tipográfica
          styles[`${variant}Text`],       // Cor baseada na variante
          styles[`${size}Text`],          // Ajuste de tamanho do texto
          disabled && styles.disabledText,// Cor para estado desabilitado
          textStyle,                      // Estilo externo
        ]}
      >

        {/* Mostra loading ou título */}
        {loading ? 'Carregando...' : title}

      </Text>
    </TouchableOpacity>
  );
}

// Criação dos estilos
const styles = StyleSheet.create({

  // Base do botão
  base: {
    alignItems: 'center',                // Centraliza horizontal
    justifyContent: 'center',            // Centraliza vertical
    borderRadius: BorderRadius.button,   // Borda arredondada
    minHeight: Layout.minTouchTarget,    // Área mínima de toque
  },
  
  // Variantes visuais
  primary: {
    backgroundColor: Colors.primary,     // Fundo principal
  },
  secondary: {
    backgroundColor: Colors.surface,     // Fundo neutro
    borderWidth: 1,                      // Borda
    borderColor: Colors.border,          // Cor da borda
  },
  ghost: {
    backgroundColor: 'transparent',      // Sem fundo
  },
  danger: {
    backgroundColor: Colors.error,       // Cor de erro
  },
  
  // Tamanhos do botão
  sm: {
    paddingHorizontal: Spacing.md,       // Espaço lateral
    paddingVertical: Spacing.md,         // Espaço vertical
    minHeight: 44,                       // Altura mínima
  },
  md: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    minHeight: 52,
  },
  lg: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    minHeight: 56,
  },
  
  // Estados
  disabled: {
    backgroundColor: Colors.border,      // Fundo neutro
    opacity: Opacity.disabled,           // Reduz visibilidade
  },
  fullWidth: {
    width: '100%',                       // Ocupa largura total
  },
  
  // Texto base
  text: {
    ...TextStyles.button,                // Tipografia padrão
    textAlign: 'center',                 // Centraliza texto
    includeFontPadding: false,           // Remove padding interno (Android)
    textAlignVertical: 'center',         // Centraliza vertical (Android)
  },

  // Texto por variante
  primaryText: {
    color: Colors.background,            // Texto claro
    fontWeight: '600',
  },
  secondaryText: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  ghostText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  dangerText: {
    color: Colors.background,
    fontWeight: '600',
  },

  // Texto desabilitado
  disabledText: {
    color: Colors.textTertiary,
  },
  
  // Ajustes de texto por tamanho
  smText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
  },
  mdText: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 18,
  },
  lgText: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 20,
  },
});
