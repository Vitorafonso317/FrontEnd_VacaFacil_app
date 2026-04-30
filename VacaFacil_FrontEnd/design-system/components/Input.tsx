// Importa React e o hook useState
import React, { useState } from 'react';

// Importa componentes do React Native
import { TextInput, View, Text, StyleSheet, TextInputProps } from 'react-native';

// Importa cores do projeto
import { colors } from '../../constants/colors';

// Importa tokens de espaçamento e borda
import { Spacing, BorderRadius } from '../tokens/spacing';

// Interface das props, estendendo todas as props nativas do TextInput
interface InputProps extends TextInputProps {
  label?: string;       // Texto acima do input
  error?: string;       // Mensagem de erro
  helperText?: string;  // Texto auxiliar (quando não há erro)
}

// Componente Input
export function Input({
  label,
  error,
  helperText,
  style,
  ...props // Demais props do TextInput
}: InputProps) {

  // Estado para controlar se o input está focado
  const [isFocused, setIsFocused] = useState(false);

  // Handler ao focar o input
  const handleFocus = (e: any) => {
    setIsFocused(true);        // Marca como focado
    props.onFocus?.(e);        // Executa callback externo (se existir)
  };

  // Handler ao perder foco
  const handleBlur = (e: any) => {
    setIsFocused(false);       // Remove estado de foco
    props.onBlur?.(e);         // Executa callback externo
  };

  return (
    <View style={styles.container}>

      {/* Renderiza label se existir */}
      {label && (
        <Text
          style={[
            styles.label,                 // Estilo base
            isFocused && styles.labelFocused, // Muda cor ao focar
          ]}
        >
          {label}
        </Text>
      )}
      
      <TextInput

        // Estilo dinâmico do input
        style={[
          styles.input,                  // Base
          isFocused && styles.inputFocused, // Borda ativa
          error && styles.inputError,    // Borda de erro
          style,                         // Estilo externo
        ]}

        // Cor do placeholder
        placeholderTextColor={colors.textSecondary}

        // Eventos de foco e blur
        onFocus={handleFocus}
        onBlur={handleBlur}

        // Espalha outras props (value, onChangeText, etc.)
        {...props}
      />
      
      {/* Exibe erro se existir */}
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      {/* Exibe helper apenas se NÃO houver erro */}
      {helperText && !error && (
        <Text style={styles.helperText}>{helperText}</Text>
      )}

    </View>
  );
}

// Estilos
const styles = StyleSheet.create({

  // Container do input
  container: {
    marginBottom: Spacing.lg, // Espaço abaixo
  },
  
  // Label acima do input
  label: {
    fontSize: 15,                // Tamanho
    fontWeight: '500',           // Peso médio
    color: colors.text,          // Cor padrão
    marginBottom: Spacing.sm,    // Espaço abaixo
  },

  // Label quando focado
  labelFocused: {
    color: colors.primary,       // Destaque na cor primária
  },
  
  // Input base
  input: {
    borderRadius: BorderRadius.input, // Bordas arredondadas
    minHeight: 52,                    // Altura mínima
    borderWidth: 1,                   // Borda padrão
    borderColor: colors.border,       // Cor da borda
    backgroundColor: colors.background,// Fundo
    paddingHorizontal: Spacing.lg,    // Espaço lateral
    paddingVertical: Spacing.md,      // Espaço vertical
    fontSize: 16,                    // Tamanho do texto
    color: colors.text,              // Cor do texto
    includeFontPadding: false,       // Remove padding interno (Android)
    textAlignVertical: 'center',     // Centraliza verticalmente (Android)
  },
  
  // Estado focado
  inputFocused: {
    borderColor: colors.primary, // Cor da borda ativa
    borderWidth: 2,              // Borda mais grossa
  },

  // Estado de erro
  inputError: {
    borderColor: colors.error,   // Cor de erro
  },
  
  // Texto de erro
  errorText: {
    fontSize: 13,               // Pequeno
    color: colors.error,        // Vermelho
    marginTop: Spacing.xs,      // Espaço acima
    paddingHorizontal: Spacing.xs,
  },

  // Texto auxiliar
  helperText: {
    fontSize: 13,
    color: colors.textSecondary,// Cor mais suave
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
});
