# MeetStranger Clean Design System

## Overview
Um design system limpo e simples, utilizando tons de azul claro para proporcionar clareza e facilidade de uso

## Design Principles
- **Simplicity**: Interface limpa e minimalista
- **Clarity**: Alto contraste e boa legibilidade
- **Light Blue Palette**: Cores suaves e profissionais
- **Consistency**: Espaçamento e tipografia padronizados

## Color System

### Light Blue Palette
- **Primary: `#3B82F6` – Azul principal para botões e links
- **Primary Light: `#DBEAFE` – Fundos em azul claro
- **Primary Dark: `#1D4ED8` – Azul mais escuro para estados de hover
- **Secondary: `#E0F2FE` – Azul muito claro para detalhes

### Backgrounds
- **Background: `#FAFBFC` – Fundo principal da aplicação
- **Surface: `#FFFFFF` – Cards e componentes
- **Surface Elevated: `#F8FAFC` – Superfícies elevadas

### Text
- **Text Primary: `#1F2937` – Texto principal
- **Text Secondary: `#6B7280` – Texto secundário
- **Text Tertiary: `#9CA3AF` – Texto mais discreto

### Semantic Colors
- **Success: `#10B981` – Verde para sucesso
- **Error: `#EF4444` – Vermelho para erros
- **Warning: `#F59E0B` – Laranja para alertas

## Typography

### Font Sizes
- **xs**: 12px – Labels pequenos
- **sm**: 14px – Legendas
- **md**: 16px – Texto padrão
- **lg**: 18px – Títulos
- **xl**: 20px – Títulos maiores
- **2xl**: 24px – Cabeçalhos de seção
- **3xl**: 30px – Títulos de página

### Text Styles
- **H1**: 30px, Bold – Títulos principais
- **H2**: 24px, Bold – Títulos de seção
- **H3**: 20px, Semibold – Subseções
- **Title**: 18px, Semibold – Títulos de componentes
- **Body**: 16px, Regular – Conteúdo principal
- **Caption**: 14px, Regular – Texto auxiliar
- **Button**: 16px, Medium – Texto de botões

## Spacing

### Scale
- **xs**: 4px - Espaçamento mínimo
- **sm**: 8px - Espaços pequenos
- **md**: 12px - Espaçamento padrão
- **lg**: 16px - Padding de componentes
- **xl**: 20px - Espaçamento de seções
- **2xl**: 24px - Espaços maiores
- **3xl**: 32px - Margens de seção
- **4xl**: 48px - Margens de página

## Components

### Button
```typescript
// Botão primário
<Button variant="primary">Continuar</Button>

// Botão secundário
<Button variant="secondary">Cancelar</Button>

// Botão ghost
<Button variant="ghost">Pular</Button>
```

### Input
```typescript
<Input 
  label="Email" 
  placeholder="Digite seu email"
/>
```

### Chat Bubble
```typescript
<ChatBubble 
  message="Olá!"
  position="right"
  timestamp="14:30"
/>
```

## Usage Guidelines

### Screen Layout
- Utilize padding consistente de 16px
- Mantenha espaçamento adequado entre componentes
- Prefira fundos limpos e minimalistas

### Color Usage
- Utilize o azul principal para ações importantes
- Mantenha cores secundárias sutis
- Garanta bom contraste para leitura

### Typography
- Utilize estilos de texto consistentes
- Mantenha uma hierarquia clara
- Use line-height adequado para leitura

## Implementation

### Import Design System
```typescript
import { Colors, TextStyles, Spacing } from './design-system';
```

### Apply Styles
```typescript
const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  title: {
    ...TextStyles.h2,
    color: Colors.textPrimary,
  },
});
```
