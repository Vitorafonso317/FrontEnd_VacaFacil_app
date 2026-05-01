// Importa React
import React from 'react';

// Importa componentes do React Native
import { View, Text, StyleSheet } from 'react-native';

// Importa tokens de cores
import { Colors } from '../tokens/colors';

// Importa tokens de espaçamento e borda
import { Spacing, BorderRadius } from '../tokens/spacing';

// Define posição da mensagem (esquerda = outro usuário, direita = usuário atual)
export type ChatBubblePosition = 'left' | 'right';

// Interface das props
interface ChatBubbleProps {
  message: string;                 // Texto da mensagem
  position: ChatBubblePosition;    // Posição da bolha
  timestamp?: string;              // Horário (opcional)
  username?: string;               // Nome do usuário (opcional)
  showUsername?: boolean;          // Exibir nome (opcional)
}

// Componente ChatBubble
export function ChatBubble({
  message,
  position,
  timestamp,
  username,
  showUsername = false, // padrão: não mostrar username
}: ChatBubbleProps) {

  // Verifica se a mensagem é do usuário atual
  const isUser = position === 'right';

  return (
    <View

      // Define alinhamento com base na origem da mensagem
      style={[
        styles.container,                    // Base
        isUser ? styles.userContainer        // Direita
               : styles.otherContainer,      // Esquerda
      ]}
    >

      {/* Mostra username apenas se:
          - habilitado
          - existe username
          - não é mensagem do próprio usuário */}
      {showUsername && username && !isUser && (
        <Text style={styles.username}>{username}</Text>
      )}
      
      <View

        // Estilo da bolha
        style={[
          styles.bubble,                 // Base da bolha
          isUser ? styles.userBubble     // Usuário
                 : styles.otherBubble,   // Outro usuário
        ]}
      >

        <Text

          // Estilo do texto da mensagem
          style={[
            styles.message,              // Base
            isUser ? styles.userMessage  // Cor usuário
                   : styles.otherMessage,// Cor outro
          ]}
        >
          {message}
        </Text>
        
        {/* Renderiza timestamp se existir */}
        {timestamp && (
          <Text

            // Estilo do timestamp (varia por lado)
            style={[
              styles.timestamp,                  // Base
              isUser ? styles.userTimestamp      // Usuário
                     : styles.otherTimestamp,    // Outro
            ]}
          >
            {timestamp}
          </Text>
        )}

      </View>
    </View>
  );
}

// Estilos
const styles = StyleSheet.create({

  // Container externo da mensagem
  container: {
    marginVertical: Spacing.xs,        // Espaço entre mensagens
    paddingHorizontal: Spacing.md,     // Espaço lateral
  },
  
  // Alinhamento à direita (usuário)
  userContainer: {
    alignItems: 'flex-end',
  },

  // Alinhamento à esquerda (outros)
  otherContainer: {
    alignItems: 'flex-start',
  },
  
  // Base da bolha
  bubble: {
    maxWidth: '80%',                  // Limita largura
    paddingHorizontal: Spacing.md,    // Padding lateral
    paddingVertical: Spacing.sm,      // Padding vertical
    borderRadius: BorderRadius.lg,    // Borda arredondada
  },
  
  // Bolha do usuário
  userBubble: {
    backgroundColor: Colors.primary,         // Verde VacaFácil
    borderBottomRightRadius: Spacing.xs,     // "quebra" do canto (efeito chat)
  },

  // Bolha de outro usuário
  otherBubble: {
    backgroundColor: Colors.surfaceVariant,
    borderBottomLeftRadius: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  
  // Username acima da bolha
  username: {
    fontSize: 12,                     // Tamanho pequeno
    color: Colors.textSecondary,      // Cor secundária
    fontWeight: '500',                // Peso médio
    marginBottom: Spacing.xs,         // Espaço abaixo
    marginLeft: Spacing.sm,           // Leve deslocamento
  },
  
  // Texto da mensagem
  message: {
    fontSize: 16,                     // Tamanho padrão
    lineHeight: 20,                   // Altura da linha (legibilidade)
  },

  // Cor da mensagem do usuário
  userMessage: {
    color: Colors.onPrimary,
  },

  // Cor da mensagem de outro usuário
  otherMessage: {
    color: Colors.textPrimary,
  },
  
  // Estilo base do timestamp
  timestamp: {
    fontSize: 11,                     // Pequeno
    marginTop: Spacing.xs,            // Espaço acima
  },

  // Timestamp do usuário
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)', // Branco com transparência
    textAlign: 'right',                // Alinhado à direita
  },

  // Timestamp de outro usuário
  otherTimestamp: {
    color: Colors.textTertiary,        // Cor discreta
    textAlign: 'left',                 // Alinhado à esquerda
  },
});
