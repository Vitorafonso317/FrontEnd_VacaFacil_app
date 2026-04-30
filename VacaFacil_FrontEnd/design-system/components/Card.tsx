// Importa React
import React from 'react';

// Importa componentes do React Native
import { View, StyleSheet, ViewStyle, TouchableOpacity, Animated } from 'react-native';

// Importa tokens de cores
import { Colors } from '../tokens/colors';

// Importa tokens de espaçamento, borda e sombras
import { Spacing, BorderRadius, Shadows } from '../tokens/spacing';

// Importa hook de animação de pressão (scale)
import { usePressAnimation } from '../animations/interactions';

// Define variantes visuais do card
export type CardVariant = 'default' | 'elevated' | 'outlined';

// Interface das props do Card
interface CardProps {
  children: React.ReactNode;       // Conteúdo interno do card
  variant?: CardVariant;           // Variante visual
  padding?: keyof typeof Spacing;  // Padding baseado nos tokens
  onPress?: () => void;            // Torna o card clicável
  style?: ViewStyle;               // Estilo externo
  disabled?: boolean;              // Estado desabilitado
}

// Componente Card
export function Card({
  children,
  variant = 'default',  // Variante padrão
  padding = 'lg',       // Padding padrão
  onPress,
  style,
  disabled = false,     // Estado padrão
}: CardProps) {

  // Hook de animação de clique (scale)
  const pressAnimation = usePressAnimation(0.98);

  // Define se o card é interativo (clicável e não desabilitado)
  const isInteractive = !!onPress && !disabled;

  // Se for interativo, renderiza com animação e Touchable
  if (isInteractive) {
    return (

      // View animada para aplicar escala
      <Animated.View style={[pressAnimation.transform]}>

        <TouchableOpacity

          // Estilos combinados
          style={[
            styles.base,                 // Base
            styles[variant],             // Variante
            { padding: Spacing[padding] }, // Padding dinâmico
            disabled && styles.disabled, // Estado desabilitado
            style,                       // Estilo externo
          ]}

          // Evento de clique
          onPress={onPress}

          // Eventos para animação de pressão
          onPressIn={pressAnimation.onPressIn}
          onPressOut={pressAnimation.onPressOut}

          // Desabilita interação
          disabled={disabled}

          // Remove efeito padrão de opacidade (já temos animação)
          activeOpacity={1}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Caso NÃO seja interativo, renderiza apenas uma View simples
  return (
    <View
      style={[
        styles.base,                 // Base
        styles[variant],             // Variante
        { padding: Spacing[padding] }, // Padding dinâmico
        style,                       // Estilo externo
      ]}
    >
      {children}
    </View>
  );
}

// Definição dos estilos
const styles = StyleSheet.create({

  // Estilo base do card
  base: {
    borderRadius: BorderRadius.card, // Bordas arredondadas
    backgroundColor: Colors.surface, // Fundo padrão
  },
  
  // Variante padrão
  default: {
    backgroundColor: Colors.surface,
  },
  
  // Variante elevada (com sombra)
  elevated: {
    backgroundColor: Colors.surfaceElevated, // Fundo elevado
    ...Shadows.md,                           // Sombra padrão
    shadowColor: Colors.shadow,              // Cor da sombra
  },
  
  // Variante com borda
  outlined: {
    backgroundColor: Colors.background, // Fundo
    borderWidth: 1,                     // Espessura da borda
    borderColor: Colors.border,         // Cor da borda
  },
  
  // Estado desabilitado
  disabled: {
    opacity: 0.6, // Reduz visibilidade
  },
});
