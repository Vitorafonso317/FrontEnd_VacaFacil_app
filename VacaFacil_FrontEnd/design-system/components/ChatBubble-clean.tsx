// Importa React
import React from 'react';

// Importa componentes do React Native
import { View, Text, StyleSheet } from 'react-native';

// Importa tokens de cores
import { Colors } from '../tokens/colors';

// Importa tokens de espaçamento e borda
import { Spacing, BorderRadius } from '../tokens/spacing';

// Importa estilos tipográficos
import { TextStyles } from '../tokens/typography';

// Define a posição da mensagem (esquerda = outro usuário, direita = usuário atual)
export type ChatBubblePosition = 'left' | 'right';

// Interface das props do ChatBubble
interface ChatBubbleProps {
  message: string;                 // Texto da mensagem
  position: ChatBubblePosition;    // Posição da bolha
  timestamp?: string;              // Horário da mensagem (opcional)
  username?: string;               // Nome do usuário (opcional)
  showUsername?: boolean;          // Se deve mostrar o nome (opcional)
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

      // Define alinhamento com base no tipo de mensagem
      style={[
        styles.container,                    // Estilo base
        isUser ? styles.userContainer        // Alinha à direita
               : styles.otherContainer,      // Alinha à esquerda
      ]}
    >

      {/* Mostra username apenas se:
          - showUsername for true
          - username existir
          - NÃO for mensagem do usuário (evita redundância) */}
      {showUsername && username && !isUser && (
        <Text style={styles.username}>{username}</Text>
      )}
      
      <View

        // Estilo da bolha (cor + formato)
        style={[
          styles.bubble,                 // Base da bolha
          isUser ? styles.userBubble     // Estilo do usuário
                 : styles.otherBubble,   // Estilo do outro
        ]}
      >

        <Text

          // Estilo do texto da mensagem
          style={[
            styles.message,              // Tipografia base
            isUser ? styles.userMessage  // Cor do usuário
                   : styles.otherMessage,// Cor do outro
          ]}
        >
          {message}
        </Text>
        
        {/* Exibe timestamp se existir */}
        {timestamp && (
          <Text style={styles.timestamp}>
            {timestamp}
          </Text>
        )}

      </View>
    </View>
  );
}

// Definição dos estilos
const styles = StyleSheet.create({

  // Container externo da mensagem
  container: {
    marginVertical: Spacing.xs,        // Espaço entre mensagens
    paddingHorizontal: Spacing.lg,     // Espaço lateral
  },
  
  // Alinhamento do usuário (direita)
  userContainer: {
    alignItems: 'flex-end',
  },

  // Alinhamento de outros usuários (esquerda)
  otherContainer: {
    alignItems: 'flex-start',
  },
  
  // Base da bolha
  bubble: {
    maxWidth: '80%',                  // Limita largura
    paddingHorizontal: Spacing.lg,    // Espaço lateral interno
    paddingVertical: Spacing.md,      // Espaço vertical interno
    borderRadius: BorderRadius.lg,    // Bordas arredondadas
  },
  
  // Estilo da bolha do usuário
  userBubble: {
    backgroundColor: Colors.chat.userBubble, // Cor de fundo
    borderBottomRightRadius: Spacing.sm,     // "rabinho" visual
  },

  // Estilo da bolha de outro usuário
  otherBubble: {
    backgroundColor: Colors.chat.otherBubble,
    borderBottomLeftRadius: Spacing.sm,
  },
  
  // Estilo do username
  username: {
    ...TextStyles.small,              // Tipografia pequena
    color: Colors.textSecondary,      // Cor secundária
    marginBottom: Spacing.xs,         // Espaço abaixo
    marginLeft: Spacing.md,           // Leve indentação
  },
  
  // Estilo base da mensagem
  message: {
    ...TextStyles.body,               // Tipografia padrão
  },

  // Texto do usuário
  userMessage: {
    color: Colors.chat.userText,
  },

  // Texto de outro usuário
  otherMessage: {
    color: Colors.chat.otherText,
  },
  
  // Timestamp (horário)
  timestamp: {
    ...TextStyles.small,              // Tipografia pequena
    marginTop: Spacing.xs,            // Espaço acima
    color: Colors.textTertiary,       // Cor discreta
    opacity: 0.7,                    // Menor destaque visual
  },
});
