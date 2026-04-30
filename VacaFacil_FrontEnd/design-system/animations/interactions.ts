// Importa o hook useRef do React
import { useRef } from 'react';

// Importa a API de animações do React Native
import { Animated } from 'react-native';

// Hook para animação de clique (efeito de "pressionar")
export const usePressAnimation = (scale: number = 0.97) => {

  // Cria um valor animado inicial com escala 1 (tamanho normal)
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Função chamada quando o botão é pressionado (pressionar para baixo)
  const onPressIn = () => {
    // Aplica imediatamente uma escala menor (efeito de clique)
    scaleAnim.setValue(scale);
  };

  // Função chamada quando o botão é solto
  const onPressOut = () => {

    // Cria uma animação para voltar ao tamanho original
    Animated.timing(scaleAnim, {
      toValue: 1,            // Volta para escala normal
      duration: 150,         // Duração curta (rápida resposta)
      useNativeDriver: false,// false porque scale pode causar problemas dependendo do contexto
    }).start();              // Inicia a animação
  };

  // Retorna o estilo transform e os handlers de evento
  return {
    transform: [{ scale: scaleAnim }], // Aplica escala ao componente
    onPressIn,                         // Evento ao pressionar
    onPressOut,                        // Evento ao soltar
  };
};

// Hook para animação de "pulso" (crescer e voltar continuamente)
export const usePulseAnimation = (duration: number = 1000) => {

  // Valor animado inicial com escala 1
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Função para iniciar o efeito de pulso
  const startPulse = () => {

    // Define uma sequência de animações (cresce e diminui)
    const pulse = Animated.sequence([

      // Cresce levemente
      Animated.timing(pulseAnim, {
        toValue: 1.05,           // Aumenta um pouco o tamanho
        duration: duration / 2,  // Metade do tempo total
        useNativeDriver: false,  // Driver JS
      }),

      // Volta ao tamanho normal
      Animated.timing(pulseAnim, {
        toValue: 1,              // Escala normal
        duration: duration / 2,  // Outra metade do tempo
        useNativeDriver: false,
      }),
    ]);

    // Executa a sequência em loop infinito
    Animated.loop(pulse).start();
  };

  // Função para parar o pulso
  const stopPulse = () => {
    pulseAnim.stopAnimation(); // Para a animação atual
    pulseAnim.setValue(1);     // Reseta para o valor original
  };

  // Retorna estilo e funções de controle
  return {
    transform: [{ scale: pulseAnim }], // Aplica escala animada
    startPulse,                        // Inicia o pulso
    stopPulse,                         // Para o pulso
  };
};

// Hook para animação de rotação contínua
export const useSpinAnimation = (duration: number = 1000) => {

  // Valor animado inicial de 0 (início da rotação)
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Função para iniciar a rotação
  const startSpin = () => {

    // Garante que começa do zero
    spinAnim.setValue(0);

    // Cria um loop infinito de rotação
    Animated.loop(

      // Anima de 0 até 1 (será convertido em graus depois)
      Animated.timing(spinAnim, {
        toValue: 1,              // Final do ciclo
        duration,                // Tempo de uma volta completa
        useNativeDriver: true,   // Pode usar driver nativo (melhor performance)
      })

    ).start(); // Inicia o loop
  };

  // Função para parar a rotação
  const stopSpin = () => {
    spinAnim.stopAnimation(); // Interrompe a animação
  };

  // Interpola o valor de 0–1 para graus (0deg → 360deg)
  const spin = spinAnim.interpolate({
    inputRange: [0, 1],                 // Intervalo de entrada
    outputRange: ['0deg', '360deg'],    // Intervalo de saída
  });

  // Retorna estilo e funções
  return {
    transform: [{ rotate: spin }], // Aplica rotação
    startSpin,                     // Inicia rotação
    stopSpin,                      // Para rotação
  };
};
