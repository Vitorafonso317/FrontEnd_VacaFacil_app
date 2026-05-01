// =========================
// TOKENS (fundação do design system)
// =========================

// Exporta todas as cores (tema, paleta, chat, etc.)
export * from './tokens/colors';

// Exporta tipografia (fontSize, lineHeight, TextStyles)
export * from './tokens/typography';

// Exporta espaçamentos, bordas, layout, sombras
export * from './tokens/spacing';


// =========================
// COMPONENTS (UI reutilizável)
// =========================

// Exporta o componente Button
export { Button } from './components/Button';

// Exporta o tipo das variantes do botão (primary, secondary, etc.)
export type { ButtonVariant } from './components/Button';

// Exporta o componente Input
export { Input } from './components/Input';

// Exporta o componente Card
export { Card } from './components/Card';

// Exporta o tipo das variantes do Card (default, elevated, outlined)
export type { CardVariant } from './components/Card';

// Exporta o componente de chat (bolha de mensagem)
export { ChatBubble } from './components/ChatBubble';

// Exporta o tipo de posição da bolha (left | right)
export type { ChatBubblePosition } from './components/ChatBubble';


// =========================
// ANIMAÇÕES (interações e feedback)
// =========================

// Exporta animações de fade (entrada/saída)
export * from './animations/fade';

// Exporta animações de slide (movimento)
export * from './animations/slide';

// Exporta animações de interação (press, pulse, spin)
export * from './animations/interactions';


// =========================
// INFORMAÇÕES DO DESIGN SYSTEM
// =========================

// Objeto com metadados do design system
export const DesignSystemInfo = {
  name: 'VacaFácil Design System',
  version: '1.0.0',
  description: 'Design system voltado para produtores rurais — alta legibilidade, contraste elevado e uso em ambientes externos',

  principles: [
    'Alto contraste para uso no campo (luz forte)',
    'Simplicidade — foco na tarefa, não na interface',
    'Áreas de toque generosas (uso com luvas ou mãos sujas)',
    'Hierarquia visual clara',
    'Identidade verde — conexão com o agronegócio',
    'Feedback visual direto e sem ambiguidade',
  ],
} as const; // Torna o objeto imutável e tipado
