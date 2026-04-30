// Importa hooks do React
import { useRef, useEffect } from 'react';

// Importa API de animações do React Native
import { Animated } from 'react-native';

// Hook para animação de "subir" (slide + fade)
export const useSlideUp = (duration: number = 300, delay: number = 0) => {

  // Valor inicial em Y = 20 (começa levemente abaixo)
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Opacidade inicial = 0 (invisível)
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Executa ao montar o componente
  useEffect(() => {

    // Delay antes de iniciar animação
    const timer = setTimeout(() => {

      // Executa duas animações ao mesmo tempo
      Animated.parallel([

        // Move de Y = 20 para Y = 0 (sobe para posição final)
        Animated.timing(slideAnim, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),

        // Fade-in (0 → 1)
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),

      ]).start(); // Inicia animações simultâneas

    }, delay);

    // Limpa o timer ao desmontar
    return () => clearTimeout(timer);

  }, []); // Executa apenas uma vez

  // Retorna estilo animado
  return {
    transform: [{ translateY: slideAnim }], // Movimento vertical
    opacity: opacityAnim,                   // Opacidade
  };
};

// Hook genérico de slide em múltiplas direções
export const useSlideIn = (

  // Direção do movimento (padrão: 'up')
  direction: 'left' | 'right' | 'up' | 'down' = 'up',

  // Duração da animação
  duration: number = 300,

  // Delay antes de iniciar
  delay: number = 0
) => {

  // Valor inicial depende da direção (definido abaixo)
  const slideAnim = useRef(new Animated.Value(getInitialValue(direction))).current;

  // Opacidade inicial invisível
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Executa ao montar
  useEffect(() => {

    const timer = setTimeout(() => {

      // Executa animações simultâneas
      Animated.parallel([

        // Move para posição final (0)
        Animated.timing(slideAnim, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),

        // Fade-in
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),

      ]).start();

    }, delay);

    return () => clearTimeout(timer);

  }, []);

  // Define qual tipo de transform usar (X ou Y)
  const transform = getTransform(direction, slideAnim);

  // Retorna estilo final
  return {
    transform,
    opacity: opacityAnim,
  };
};

// Função que define o valor inicial baseado na direção
const getInitialValue = (direction: 'left' | 'right' | 'up' | 'down') => {

  switch (direction) {

    case 'left':
      return -20; // Começa à esquerda

    case 'right':
      return 20;  // Começa à direita

    case 'up':
      return 20;  // Começa abaixo (vai subir)

    case 'down':
      return -20; // Começa acima (vai descer)

    default:
      return 20;  // Fallback padrão
  }
};

// Função que define se o movimento será em X ou Y
const getTransform = (
  direction: 'left' | 'right' | 'up' | 'down',
  animValue: Animated.Value
) => {

  switch (direction) {

    case 'left':
    case 'right':
      // Movimento horizontal
      return [{ translateX: animValue }];

    case 'up':
    case 'down':
      // Movimento vertical
      return [{ translateY: animValue }];

    default:
      // Fallback vertical
      return [{ translateY: animValue }];
  }
};
