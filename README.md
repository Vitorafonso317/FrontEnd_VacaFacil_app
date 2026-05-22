# VacaFacil — FrontEnd

Frontend mobile do projeto VacaFacil, construído com React Native + Expo.

---

## Stack

| Tecnologia | Versão |
|---|---|
| React Native | 0.81.5 |
| React | 19.1.0 |
| Expo | ~54.0.33 |
| Expo Router | ~6.0.23 |
| TypeScript | ~5.9.2 |

---

## Como rodar

```bash
cd VacaFacil_FrontEnd
npm install
npm start        # abre o Expo Dev Tools
npm run android  # roda no emulador/dispositivo Android
npm run ios      # roda no simulador iOS
npm run web      # roda no navegador
```

---

## Estrutura de pastas

```
VacaFacil_FrontEnd/
├── app/                          # Rotas da aplicação (Expo Router — file-based routing)
│   ├── _layout.tsx               # Layout raiz / navegação global
│   ├── index.tsx                 # Entry point (redireciona para auth ou tabs)
│   ├── auth/
│   │   ├── login.tsx             # /auth/login
│   │   └── register.tsx          # /auth/register
│   ├── (tabs)/                   # Grupo de tabs (barra de navegação inferior)
│   │   ├── _layout.tsx           # Configura as tabs
│   │   ├── dashboard.tsx         # Visão geral do rebanho e produção
│   │   ├── vacas.tsx             # Listagem de vacas
│   │   ├── producao.tsx          # Registros de produção
│   │   ├── financeiro.tsx        # Receitas e despesas
│   │   └── perfil.tsx            # Perfil do usuário
│   ├── vacas/
│   │   ├── [id].tsx              # Detalhe de uma vaca
│   │   ├── create.tsx            # Cadastro de vaca
│   │   └── edit/
│   │       └── [id].tsx          # Edição de vaca
│   ├── marketplace/
│   │   ├── index.tsx             # Listagem do marketplace
│   │   └── [id].tsx              # Detalhe de anúncio
│   └── about/
│       └── index.tsx             # Sobre o app
│
├── assets/                       # Imagens estáticas (ícone, splash, favicon)
│
├── components/                   # Componentes de negócio (específicos do app)
│   ├── CowCard/                  # Card de vaca
│   ├── Header/                   # Cabeçalho customizado
│   ├── EmptyState/               # Estado vazio de listas
│   └── Loading/                  # Indicador de carregamento
│
├── design-system/                # Componentes base e tokens visuais
│   ├── tokens/                   # Cores, espaçamentos, tipografia
│   ├── components/               # Button, Input, Card, Text, Avatar...
│   └── animations/               # Animações reutilizáveis
│
├── services/                     # Camada de comunicação com a API
│   ├── api.ts                    # Cliente HTTP base (baseURL, interceptors)
│   ├── authService.ts            # Login, register, logout, refresh token
│   ├── cattleService.ts          # CRUD de vacas
│   ├── productionService.ts      # Registros de produção
│   └── financialService.ts       # Receitas, despesas, relatórios
│
├── context/
│   └── AuthContext.tsx           # Usuário logado, token JWT, proteção de rotas
│
├── hooks/                        # Custom hooks (auth, API, formulário, storage...)
├── constants/                    # Rotas nomeadas, chaves de storage, configs
├── utils/                        # Formatadores, validadores, helpers (data, moeda...)
├── types/                        # Interfaces e tipos TypeScript (User, Cow, ApiResponse...)
├── app.json                      # Configuração do Expo
├── package.json
└── tsconfig.json
```

---

## Como funciona o roteamento

O projeto usa **Expo Router** com file-based routing. A estrutura de `app/` mapeia diretamente para as rotas navegáveis:

| Arquivo | Rota |
|---|---|
| `app/index.tsx` | `/` |
| `app/auth/login.tsx` | `/auth/login` |
| `app/auth/register.tsx` | `/auth/register` |
| `app/(tabs)/dashboard.tsx` | `/dashboard` (tab) |
| `app/(tabs)/vacas.tsx` | `/vacas` (tab) |
| `app/(tabs)/producao.tsx` | `/producao` (tab) |
| `app/(tabs)/financeiro.tsx` | `/financeiro` (tab) |
| `app/(tabs)/perfil.tsx` | `/perfil` (tab) |
| `app/vacas/[id].tsx` | `/vacas/:id` |
| `app/vacas/create.tsx` | `/vacas/create` |
| `app/vacas/edit/[id].tsx` | `/vacas/edit/:id` |
| `app/marketplace/index.tsx` | `/marketplace` |
| `app/marketplace/[id].tsx` | `/marketplace/:id` |

> Pastas entre parênteses como `(tabs)` são **grupos de rota** do Expo Router — organizam a navegação sem afetar a URL.

---

## Separação de responsabilidades

| Pasta | Responsabilidade |
|---|---|
| `app/` | Telas e rotas — só layout e orquestração |
| `components/` | Componentes de negócio reutilizáveis |
| `design-system/` | Componentes base genéricos e tokens visuais |
| `services/` | Toda comunicação com a API |
| `context/` | Estado global (auth, tema) |
| `hooks/` | Lógica reutilizável encapsulada |
| `types/` | Contratos TypeScript compartilhados |
| `utils/` | Funções puras auxiliares |
| `constants/` | Valores fixos da aplicação |

> Estilos ficam **junto do componente** (mesmo arquivo ou `styles.ts` na mesma pasta), não em uma pasta global separada.

---

## Configuração do app (app.json)

- Orientação: **portrait**
- Android: **edge-to-edge** + nova arquitetura (`newArchEnabled: true`)
- iOS: suporte a tablet
- Splash screen com fundo branco

---

## Relatório de Evolução e Impacto

### 1. Refatoração e Correções Críticas

#### Marketplace: Segurança na Gestão de Anúncios
**O que foi feito:** Ajuste na lógica de permissão para edição e exclusão de anúncios.

**Explicação Técnica:** Implementada tipagem estrita usando `Number(user.id) === Number(item.user_id)` para garantir que a comparação de IDs entre o usuário logado e o dono do anúncio seja sempre numérica, evitando falhas de validação comuns em JavaScript/TypeScript.

**Benefício:** Apenas o verdadeiro dono do animal pode alterar os dados da venda, garantindo a segurança do marketplace.

#### Sincronização de Interface (UI Sync)
**O que foi feito:** Migração para `useFocusEffect` / `useRefreshOnFocus` nas telas de Marketplace, Vacas, Produção, Financeiro e Dashboard.

**Explicação Técnica:** Diferente de um carregamento simples no mount, esses hooks detectam quando o usuário volta para a tela e disparam uma revalidação de dados. Resolve o problema de o usuário realizar uma venda ou registrar um gasto e a lista continuar mostrando o valor antigo.

#### Correção de Autenticação no Web (F5)
**O que foi feito:** Guard de rota em `_layout.tsx` agora aguarda o roteador hidratar a URL antes de decidir para onde navegar.

**Explicação Técnica:** Ao recarregar a página no browser, `useSegments()` retorna `[]` por alguns milissegundos. O guard passou a verificar `!segments.length` além de `loading`, evitando redirecionamentos prematuros para o login.

---

### 2. Otimização de Performance para o Campo

Considerando que o sinal de internet no ambiente rural é instável, o app foi otimizado para consumir o mínimo de dados possível.

#### Compressão Inteligente de Mídia
**O que foi feito:** Pipeline de redução de imagens no Frontend (Expo) e Backend (Cloudinary).

**Explicação Técnica:** O `expo-image-manipulator` redimensiona fotos para 900px com 70% de qualidade JPEG antes do envio. No servidor, o Cloudinary aplica transformações automáticas (`quality: auto:good`, `fetch_format: auto`) para entregar WebP/AVIF em browsers compatíveis.

**Impacto:** Uma foto de 5MB passa a pesar ~150KB. O produtor consegue cadastrar uma vaca mesmo com sinal 3G fraco, além de economizar espaço no plano gratuito de armazenamento em até 30×.

---

### 3. Arquitetura de Cache com TanStack Query

Esta é a mudança estrutural mais importante para a escalabilidade do VacaFácil.

#### Gerenciamento de Estado e Cache
**O que foi feito:** Migração de chamadas `fetch` manuais com `useState`/`useEffect` para hooks centralizados (`useVacas`, `useDashboard`, `useMarketplace`, etc.) via `@tanstack/react-query`.

**Explicação Técnica:** O TanStack Query gerencia o cache automaticamente com `staleTime: 30s` e `gcTime: 5min`. Quando o produtor abre o app, ele vê instantaneamente os dados da última sessão (em cache), enquanto o sistema busca atualizações em segundo plano.

| Hook | Tela | Dados gerenciados |
|---|---|---|
| `useDashboard` | Dashboard | Stats gerais, produção, financeiro, rebanho |
| `useVacas` | Vacas | Lista do rebanho com filtros |
| `useProducao` | Produção | Histórico de registros de leite |
| `useReceitas` / `useDespesas` | Financeiro | Entradas e saídas |
| `useMarketplace` | Marketplace | Anúncios disponíveis |
| `useProximasTarefas` | Dashboard | Eventos reprodutivos próximos 60 dias |

**Impacto no Render Free Tier:** Como o servidor gratuito pode demorar até 60 segundos para "acordar", o cache evita que o usuário veja tela vazia ou erro durante esse período.

---

### 4. Inteligência de Manejo no Dashboard

O Dashboard deixou de ser um visualizador de dados para se tornar um assistente de decisão.

#### Card de Próximas Tarefas
**O que faz:** Exibe alertas de inseminações, partos e diagnósticos pendentes nos próximos 60 dias.

**Explicação Técnica:** O hook `useProximasTarefas` filtra a tabela `reproducao` e calcula a diferença em dias entre a data atual e cada evento previsto, gerando badges visuais de urgência ("Hoje", "1 dia", "X dias") com ícones diferenciados por tipo de evento.

**Valor para o Produtor:** Inspirado em sistemas como o Aegro, essa função garante que nenhum evento reprodutivo importante seja esquecido.

---

### 5. Posicionamento de Mercado

| Concorrente | Diferencial do VacaFácil |
|---|---|
| **Agtor** | Agtor foca em gestão operacional geral e máquinas; VacaFácil foca na especificidade do leite (lactação e reprodução) |
| **Aegro** | VacaFácil oferece marketplace integrado de animais verificados, permitindo que o produtor monetize o excedente de rebanho diretamente no ecossistema de gestão |
