// Importa React
import React from 'react';

// Importa componentes e tipos do React Native
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

// Importa tokens de cores do design system
import { Colors } from '../tokens/colors';

// Importa estilos tipográficos
import { TextStyles } from '../tokens/typography';

// Importa tokens de espaçamento, borda, layout e opacidade
import { Spacing, BorderRadius, Layout, Opacity } from '../tokens/spacing';

// Define os tipos de variação do botão
export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

// Define os tamanhos disponíveis do botão
export type ButtonSize = 'md' | 'lg';

// Interface das propriedades do componente Button
interface ButtonProps {
  title: string;              // Texto do botão
  onPress: () => void;        // Função ao clicar
  variant?: ButtonVariant;    // Tipo visual do botão
  size?: ButtonSize;          // Tamanho do botão
  disabled?: boolean;         // Se está desabilitado
  loading?: boolean;          // Estado de carregamento
  style?: ViewStyle;          // Estilo customizado do container
  textStyle?: TextStyle;      // Estilo customizado do texto
  fullWidth?: boolean;        // Se ocupa largura total
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

  return (
    <TouchableOpacity

      // Array de estilos aplicados dinamicamente
      style={[
        styles.base,                 // Estilo base
        styles[variant],             // Estilo da variante (primary, secondary, ghost)
        styles[size],                // Estilo do tamanho (md, lg)
        disabled && styles.disabled, // Aplica se estiver desabilitado
        fullWidth && styles.fullWidth,// Aplica largura total
        style,                       // Estilo customizado externo
      ]}

      // Função executada ao clicar
      onPress={onPress}

      // Desabilita botão se disabled ou loading
      disabled={disabled || loading}

      // Define opacidade ao pressionar
      activeOpacity={Opacity.pressed}
    >

      <Text
        // Estilos do texto
        style={[
          styles.text,                 // Estilo base do texto
          styles[`${variant}Text`],    // Estilo do texto baseado na variante
          textStyle,                  // Estilo customizado externo
        ]}
      >
        {/* Se estiver carregando, mostra texto fixo */}
        {loading ? 'Carregando...' : title}
      </Text>

    </TouchableOpacity>
  );
}

// Criação dos estilos
const styles = StyleSheet.create({

  // Estilo base do botão
  base: {
    alignItems: 'center',              // Centraliza horizontalmente
    justifyContent: 'center',          // Centraliza verticalmente
    borderRadius: BorderRadius.md,     // Arredondamento
    minHeight: Layout.buttonHeight,    // Altura mínima
  },

  // Variante principal
  primary: {
    backgroundColor: Colors.primary,   // Cor principal
  },

  // Variante secundária
  secondary: {
    backgroundColor: Colors.surface,   // Fundo neutro
    borderWidth: 1,                   // Borda
    borderColor: Colors.border,       // Cor da borda
  },

  // Variante ghost (sem fundo)
  ghost: {
    backgroundColor: 'transparent',
  },

  // Tamanho médio
  md: {
    paddingHorizontal: Spacing.lg,     // Espaço lateral
    paddingVertical: Spacing.md,       // Espaço vertical
  },

  // Tamanho grande
  lg: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },

  // Estado desabilitado
  disabled: {
    opacity: Opacity.disabled,         // Reduz visibilidade
  },

  // Ocupa largura total
  fullWidth: {
    width: '100%',
  },

  // Estilo base do texto
  text: {
    ...TextStyles.button,              // Aplica tipografia padrão
  },

  // Texto do botão primary
  primaryText: {
    color: '#FFFFFF',                  // Branco
  },

  // Texto do botão secondary
  secondaryText: {
    color: Colors.textPrimary,         // Cor padrão de texto
  },

  // Texto do botão ghost
  ghostText: {
    color: Colors.primary,             // Cor principal
  },
});
