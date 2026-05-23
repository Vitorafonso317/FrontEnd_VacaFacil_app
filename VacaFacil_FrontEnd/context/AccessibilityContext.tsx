import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fonts } from '../constants/fonts';

const KEY = '@vacafacil:large-text';
const SCALE = 1.3;

type A11yCtx = {
  isLargeText: boolean;
  toggleLargeText: () => void;
  scale: (base: number) => number;
  btnHeight: number;
};

const Ctx = createContext<A11yCtx>({
  isLargeText: false,
  toggleLargeText: () => {},
  scale: (b) => b,
  btnHeight: 56,
});

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [isLargeText, setIsLargeText] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(v => {
      if (v === 'true') setIsLargeText(true);
    });
  }, []);

  useEffect(() => {
    (Text as any).defaultProps = (Text as any).defaultProps ?? {};
    (Text as any).defaultProps.style = isLargeText
      ? [{ fontFamily: fonts.regular, fontSize: 17 }]
      : [{ fontFamily: fonts.regular }];
  }, [isLargeText]);

  function toggleLargeText() {
    setIsLargeText(prev => {
      const next = !prev;
      AsyncStorage.setItem(KEY, String(next));
      return next;
    });
  }

  return (
    <Ctx.Provider value={{
      isLargeText,
      toggleLargeText,
      scale: (b) => isLargeText ? Math.round(b * SCALE) : b,
      btnHeight: isLargeText ? 68 : 56,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useA11y = () => useContext(Ctx);
