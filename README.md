# VacaFácil — Mobile App

> Plataforma de gestão leiteira para produtores rurais. Controle de rebanho, produção diária, financeiro, reprodução, marketplace bovino e muito mais — tudo no celular, funcionando mesmo sem internet.

![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react)
![Expo](https://img.shields.io/badge/Expo-SDK_54-000020?logo=expo)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-5-FF4154)

---

## Funcionalidades

| Módulo | Descrição |
|---|---|
| **Rebanho** | Cadastro, edição e exclusão de vacas com foto, raça, peso e status de saúde |
| **Produção** | Registro diário de litros por vaca com histórico e exportação em PDF |
| **Financeiro** | Receitas e despesas com saldo, previsões e relatório em PDF |
| **Reprodução** | Eventos de inseminação, parto e diagnóstico com alertas de próximas tarefas |
| **Saúde / Carência** | Controle de medicamentos aplicados e bloqueio automático da produção em carência |
| **Marketplace** | Venda de bovinos com fotos, filtro por distância (GPS), contato via WhatsApp |
| **Notificações** | Alertas de fim de carência e eventos reprodutivos agendados |
| **Modo Offline** | Registros de produção salvos localmente e sincronizados ao reconectar |
| **Acessibilidade** | Toggle de texto grande persistido por usuário |
| **Exportação PDF** | Ficha individual de vaca e relatório consolidado de produção |

---

## Stack

| Tecnologia | Versão | Uso |
|---|---|---|
| React Native | 0.81 | Framework mobile |
| Expo (SDK 54) | ~54.0.33 | Toolchain + módulos nativos |
| Expo Router | ~6.0 | Navegação file-based |
| TypeScript | ~5.9 | Tipagem estática |
| TanStack Query | 5 | Cache, sincronização e estado servidor |
| AsyncStorage | — | Persistência local de cache e preferências |
| expo-location | — | GPS para geolocalização no marketplace |
| expo-notifications | — | Notificações locais agendadas |
| expo-print / sharing | — | Geração e compartilhamento de PDF |
| Cloudinary | — | Upload e otimização de imagens |
| EAS Build / Update | — | Builds na nuvem e atualizações OTA |

---

## Pré-requisitos

- Node.js 18+
- npm 9+
- Expo CLI: `npm install -g expo-cli`
- Conta Expo (gratuita): [expo.dev](https://expo.dev)

---

## Instalação e execução local

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd FrontEnd_VacaFacil_app/VacaFacil_FrontEnd

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm start

# Ou diretamente no dispositivo/emulador
npm run android
npm run ios
```

> O app aponta para a API em produção por padrão. Para usar uma API local, altere `BASE_URL` em `services/api.ts`.

---

## Variáveis de ambiente

Crie um arquivo `.env` na raiz de `VacaFacil_FrontEnd/`:

```env
EXPO_PUBLIC_API_URL=https://sua-api.onrender.com
```

---

## Estrutura de pastas

```
VacaFacil_FrontEnd/
├── app/                        # Rotas (Expo Router — file-based)
│   ├── _layout.tsx             # Layout raiz: providers, autenticação, NetInfo
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/                 # Navegação inferior
│   │   ├── dashboard.tsx       # Visão geral com previsões e alertas
│   │   ├── vacas.tsx           # Listagem do rebanho
│   │   ├── producao.tsx        # Histórico de produção
│   │   ├── financeiro.tsx      # Receitas e despesas
│   │   ├── marketplace.tsx     # Anúncios de venda bovina
│   │   └── perfil.tsx          # Perfil, configurações e acessibilidade
│   ├── vacas/[id].tsx          # Ficha completa da vaca
│   ├── vacas/create.tsx
│   ├── vacas/edit/[id].tsx
│   └── marketplace/
│       ├── [id].tsx
│       ├── create.tsx
│       └── edit/[id].tsx
│
├── components/                 # Componentes de negócio reutilizáveis
│   ├── ProductionModal.tsx     # Registro de produção (online + offline)
│   ├── SaudeModal.tsx          # Registro de medicamento e carência
│   └── ...
│
├── context/
│   ├── AuthContext.tsx         # JWT + Refresh Token + persistência
│   └── AccessibilityContext.tsx # Toggle de texto grande
│
├── hooks/
│   └── queries.ts              # Hooks TanStack Query (useVacas, useProducao, ...)
│
├── services/
│   ├── api.ts                  # Cliente HTTP com refresh token automático
│   ├── authService.ts
│   ├── cattleService.ts
│   ├── productionService.ts
│   ├── financialService.ts
│   ├── reproducaoService.ts
│   ├── medicamentosService.ts
│   ├── notificationService.ts
│   ├── uploadService.ts
│   └── offlineQueue.ts         # Fila offline para produção sem internet
│
├── utils/
│   ├── pdf.ts                  # Templates HTML para geração de PDF
│   └── index.ts                # Formatadores de data, moeda, etc.
│
├── constants/
│   ├── colors.ts
│   └── fonts.ts
│
├── types/
│   └── index.ts                # Interfaces TypeScript globais
│
├── assets/                     # Ícone, splash, imagens estáticas
├── app.json                    # Configuração Expo + EAS + plugins nativos
├── eas.json                    # Perfis de build (preview / production)
└── tsconfig.json
```

---

## Arquitetura de dados

### Cache offline (TanStack Query Persist)

O app usa `PersistQueryClientProvider` com `AsyncStorage` como storage. Dados são mantidos por **24 horas** localmente:

```
staleTime: 30s   → dados são considerados frescos por 30 segundos
gcTime: 24h      → dados permanecem em cache por 24 horas
```

Ao abrir o app sem internet, o usuário vê os dados da última sessão instantaneamente.

### Fila de escrita offline

Registros de produção feitos sem conexão são salvos em `AsyncStorage` via `offlineQueue.ts`. Quando o device reconecta, o listener `NetInfo` em `_layout.tsx` processa a fila automaticamente e invalida o cache React Query.

### Refresh Token

- Access token: JWT com expiração de **1 dia**
- Refresh token: 80 chars hex com expiração de **30 dias**, rotacionado a cada uso
- Em caso de 401, `api.ts` tenta renovar silenciosamente antes de deslogar o usuário

---

## Distribuição

### Build e distribuição gratuita (APK)

```bash
# Gera APK via EAS (gratuito)
eas build --profile preview --platform android

# Compartilhe o link gerado — usuários instalam diretamente
```

### Atualização OTA (sem republicar)

```bash
# Atualiza apenas o bundle JS — usuários recebem na próxima abertura
npx eas update --branch preview --message "descrição da atualização"
```

> Mudanças em código nativo (novos pacotes com código nativo) exigem um novo `eas build`.

---

## Rotas

| Arquivo | Rota |
|---|---|
| `(auth)/login.tsx` | `/login` |
| `(auth)/register.tsx` | `/register` |
| `(tabs)/dashboard.tsx` | `/dashboard` |
| `(tabs)/vacas.tsx` | `/vacas` |
| `(tabs)/producao.tsx` | `/producao` |
| `(tabs)/financeiro.tsx` | `/financeiro` |
| `(tabs)/marketplace.tsx` | `/marketplace` |
| `(tabs)/perfil.tsx` | `/perfil` |
| `vacas/[id].tsx` | `/vacas/:id` |
| `marketplace/[id].tsx` | `/marketplace/:id` |
| `marketplace/create.tsx` | `/marketplace/create` |

---

## Licença

Projeto proprietário — VacaFácil © 2025. Todos os direitos reservados.
