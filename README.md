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
