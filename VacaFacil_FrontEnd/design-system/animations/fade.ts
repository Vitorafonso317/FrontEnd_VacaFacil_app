// Importa hooks do React
import { useRef, useEffect } from 'react';

// Importa API de animações do React Native
import { Animated } from 'react-native';

// Hook customizado para efeito de fade-in (aparecer suavemente)
export const useFadeIn = (duration: number = 300, delay: number = 0) => {

  // Cria um valor animado inicializado com 0 (totalmente invisível)
  // useRef garante que o valor não seja recriado a cada render
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // useEffect executa quando o componente monta ou quando dependências mudam
  useEffect(() => {

    // Cria um timer para aplicar um delay antes de iniciar a animação
    const timer = setTimeout(() => {

      // Define uma animação de transição (timing)
      Animated.timing(fadeAnim, {
        toValue: 1,          // Valor final: 1 (totalmente visível)
        duration,            // Duração da animação (ms)
        useNativeDriver: true, // Usa o driver nativo (melhor performance)
      }).start();            // Inicia a animação

    }, delay); // Tempo de espera antes de começar

    // Cleanup: limpa o timer ao desmontar ou atualizar
    return () => clearTimeout(timer);

  }, [fadeAnim, duration, delay]); // Dependências do efeito

  // Retorna o valor animado para ser usado no componente
  return fadeAnim;
};

// Hook customizado para efeito de fade-out (desaparecer suavemente)
export const useFadeOut = (duration: number = 200) => {

  // Valor animado começa em 1 (totalmente visível)
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Função que executa o fade-out
  const fadeOut = (callback?: () => void) => {

    // Cria a animação de transição para desaparecer
    Animated.timing(fadeAnim, {
      toValue: 0,            // Valor final: 0 (invisível)
      duration,              // Duração da animação
      useNativeDriver: true, // Melhor performance com driver nativo
    }).start(callback);      // Inicia animação e executa callback ao finalizar
  };

  // Retorna o valor animado e a função de fadeOut
  return { fadeAnim, fadeOut };
};

// Função utilitária para criar uma animação de fade genérica
export const createFadeAnimation = (
  value: Animated.Value, // Valor animado a ser modificado
  toValue: number,       // Valor final da animação
  duration: number = 300 // Duração padrão
) => {

  // Retorna a animação configurada (não inicia automaticamente)
  return Animated.timing(value, {
    toValue,              // Valor final
    duration,             // Tempo da animação
    useNativeDriver: true,// Usa driver nativo
  });
};
