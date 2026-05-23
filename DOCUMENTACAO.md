# VacaFácil — Documentação Técnica Completa

**Data:** 23/05/2026 | **Versão:** 1.0.0 | **Plataforma:** React Native (Expo SDK 54) + Node.js

---

## 1. Visão Geral

O VacaFácil é um aplicativo móvel de gestão para pequenos e médios produtores de leite. Permite controle de rebanho, produção diária, financeiro, eventos reprodutivos, saúde animal (período de carência), marketplace e notificações inteligentes.

---

## 2. Stack Tecnológica

### Backend
| Camada | Tecnologia |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Banco de Dados | LibSQL/Turso (SQLite compatível) |
| Autenticação | JWT (jsonwebtoken) |
| Upload de Fotos | Multer + Cloudinary |
| Validação | express-validator |
| Documentação | Swagger (rota `/docs`) |

### Frontend
| Camada | Tecnologia |
|---|---|
| Framework | React Native + Expo SDK 54 |
| Roteamento | Expo Router (file-based) |
| Cache/Dados | TanStack React Query |
| Estado Global | React Context (Auth) |
| Armazenamento Local | AsyncStorage |
| Notificações | expo-notifications |
| Ícones | MaterialIcons + MaterialCommunityIcons |
| Fontes | Inter (expo-font) |
| Imagens | Expo Image Manipulator + Cloudinary |

---

## 3. Banco de Dados

### 3.1 Conexão
- Suporte a **Turso (cloud)** via `TURSO_URL` + `TURSO_AUTH_TOKEN`
- Fallback para **SQLite local** (`file:database.sqlite`) em desenvolvimento
- Tabelas criadas automaticamente na inicialização (`initTables()`)

### 3.2 Schema Completo

#### `users`
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT,
nome TEXT NOT NULL,
email TEXT UNIQUE NOT NULL,
password TEXT NOT NULL,
foto_url TEXT,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
last_login DATETIME
```

#### `vacas`
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT,
nome TEXT NOT NULL,
raca TEXT,
idade INTEGER,
peso REAL,
status_saude TEXT DEFAULT 'saudavel',  -- saudavel | seca | tratamento
foto_url TEXT,
user_id INTEGER NOT NULL,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (user_id) REFERENCES users(id)
```

#### `producao`
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT,
vaca_id INTEGER NOT NULL,
data DATE NOT NULL,
litros REAL NOT NULL,
observacoes TEXT,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (vaca_id) REFERENCES vacas(id)
```

#### `financeiro`
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT,
tipo TEXT NOT NULL,              -- receita | despesa
descricao TEXT NOT NULL,
valor REAL NOT NULL,
data DATE NOT NULL,
user_id INTEGER NOT NULL,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
```

#### `reproducao`
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT,
vaca_id INTEGER NOT NULL,
tipo_evento TEXT NOT NULL,       -- Inseminação | Parto | Diagnóstico | etc.
data DATE NOT NULL,
observacoes TEXT,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (vaca_id) REFERENCES vacas(id)
```

#### `marketplace`
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT,
titulo TEXT NOT NULL,
descricao TEXT,
preco REAL NOT NULL,
categoria TEXT NOT NULL,         -- Bovino | Insumo | Equipamento | Outro
contato TEXT,
vaca_id INTEGER,
fotos TEXT,                      -- JSON array de URLs
user_id INTEGER NOT NULL,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
```

#### `medicamentos_tratamentos`
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT,
vaca_id INTEGER NOT NULL,
user_id INTEGER NOT NULL,
nome_medicamento TEXT NOT NULL,
data_aplicacao DATE NOT NULL,
dias_carencia INTEGER NOT NULL,
observacoes TEXT,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
-- data_fim_carencia calculada dinamicamente:
-- DATE(data_aplicacao, '+' || dias_carencia || ' days')
FOREIGN KEY (vaca_id) REFERENCES vacas(id)
```

#### `notificacoes`
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id INTEGER NOT NULL,
titulo TEXT NOT NULL,
mensagem TEXT NOT NULL,
lida INTEGER DEFAULT 0,          -- 0 = não lida, 1 = lida
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
```

#### `planos`
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT,
nome TEXT NOT NULL,
preco REAL NOT NULL,
descricao TEXT
-- Dados fixos: Gratuito (R$0), Ouro (R$29,90), Diamante (R$59,90)
```

#### `assinaturas`
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id INTEGER UNIQUE NOT NULL,  -- UNIQUE: um plano por usuário
plano_id INTEGER NOT NULL,
status TEXT DEFAULT 'ativo',
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
```

### 3.3 Índices
```sql
idx_vacas_user_id         ON vacas(user_id)
idx_producao_vaca_id      ON producao(vaca_id)
idx_financeiro_user_id    ON financeiro(user_id)
idx_reproducao_vaca_id    ON reproducao(vaca_id)
idx_marketplace_user_id   ON marketplace(user_id)
idx_notificacoes_user_id  ON notificacoes(user_id)
idx_med_vaca_id           ON medicamentos_tratamentos(vaca_id)
idx_med_user_id           ON medicamentos_tratamentos(user_id)
```

---

## 4. Backend — Rotas da API

> Base URL: `http://<host>:5000`
> Todas as rotas (exceto `/auth/*`) exigem `Authorization: Bearer <token>`

### 4.1 Autenticação — `/auth`

| Método | Rota | Descrição | Rate Limit |
|---|---|---|---|
| POST | `/auth/register` | Criar conta | 20 req/15min |
| POST | `/auth/login` | Fazer login | 20 req/15min |

**Corpo do register:**
```json
{ "nome": "João", "email": "joao@email.com", "password": "senha123" }
```
**Resposta do login:**
```json
{ "token": "eyJ...", "user": { "id": 1, "nome": "João", "email": "..." } }
```

---

### 4.2 Usuário — `/users`

| Método | Rota | Descrição |
|---|---|---|
| GET | `/users/me` | Dados do usuário logado + plano |
| PUT | `/users/me` | Atualizar nome/email/senha |
| POST | `/users/me/foto` | Upload foto de perfil |
| DELETE | `/users` | Deletar conta |

---

### 4.3 Vacas — `/vacas`

| Método | Rota | Descrição |
|---|---|---|
| GET | `/vacas` | Listar rebanho (paginado) |
| POST | `/vacas` | Cadastrar nova vaca |
| GET | `/vacas/:id` | Detalhes de uma vaca |
| PUT | `/vacas/:id` | Editar vaca |
| DELETE | `/vacas/:id` | Remover vaca |
| POST | `/vacas/:id/foto` | Upload foto da vaca |

**Query params para GET /vacas:** `?page=1&limit=20`

---

### 4.4 Produção — `/producao`

| Método | Rota | Descrição |
|---|---|---|
| GET | `/producao` | Listar registros (paginado, filtrável por `vaca_id`) |
| POST | `/producao` | Registrar produção diária |
| PUT | `/producao/:id` | Editar registro |
| DELETE | `/producao/:id` | Remover registro |
| GET | `/producao/variacao` | Variação diária de produção |

**Query params:** `?page=1&limit=20&vaca_id=5`

> POST `/producao` retorna `alerta_carencia: true` se a vaca estiver em período de carência.

---

### 4.5 Financeiro — `/financeiro`

| Método | Rota | Descrição |
|---|---|---|
| GET | `/financeiro/resumo` | Total receitas, despesas e saldo |
| GET | `/financeiro/receitas` | Listar entradas |
| POST | `/financeiro/receitas` | Nova receita |
| PUT | `/financeiro/receitas/:id` | Editar receita |
| DELETE | `/financeiro/receitas/:id` | Remover receita |
| GET | `/financeiro/despesas` | Listar saídas |
| POST | `/financeiro/despesas` | Nova despesa |
| PUT | `/financeiro/despesas/:id` | Editar despesa |
| DELETE | `/financeiro/despesas/:id` | Remover despesa |

---

### 4.6 Reprodução — `/reproducao`

| Método | Rota | Descrição |
|---|---|---|
| GET | `/reproducao` | Listar eventos (filtrável por `vaca_id`) |
| POST | `/reproducao` | Registrar evento |
| PUT | `/reproducao/:id` | Editar evento |
| DELETE | `/reproducao/:id` | Remover evento |

**Tipos de evento:** `Inseminação`, `Parto`, `Diagnóstico de Gestação`, `Cio`, `Descarte`

---

### 4.7 Marketplace — `/marketplace`

| Método | Rota | Descrição |
|---|---|---|
| GET | `/marketplace` | Listar todos os anúncios (público) |
| GET | `/marketplace/meus` | Meus anúncios |
| GET | `/marketplace/:id` | Detalhes de um anúncio |
| POST | `/marketplace` | Criar anúncio |
| PUT | `/marketplace/:id` | Editar anúncio |
| DELETE | `/marketplace/:id` | Remover anúncio |
| POST | `/marketplace/:id/foto` | Adicionar foto (máx. 3 por anúncio) |

---

### 4.8 Notificações — `/notifications`

| Método | Rota | Descrição |
|---|---|---|
| POST | `/notifications/send` | Enviar notificação |
| GET | `/notifications` | Listar todas (paginado) |
| GET | `/notifications/unread/count` | Contador de não lidas |
| PUT | `/notifications/mark-all-read` | Marcar todas como lidas |
| PUT | `/notifications/:id` | Marcar uma como lida |
| DELETE | `/notifications/:id` | Deletar notificação |

---

### 4.9 Planos e Assinaturas — `/subscriptions`

| Método | Rota | Descrição |
|---|---|---|
| GET | `/subscriptions/plans` | Listar planos disponíveis |
| POST | `/subscriptions/subscribe` | Assinar um plano |
| GET | `/subscriptions/status` | Meu plano atual |
| DELETE | `/subscriptions/cancel` | Cancelar assinatura |

---

### 4.10 Medicamentos / Carência — `/medicamentos`

| Método | Rota | Descrição |
|---|---|---|
| GET | `/medicamentos` | Listar tratamentos (`?ativo=true&vaca_id=X`) |
| POST | `/medicamentos` | Registrar tratamento |
| DELETE | `/medicamentos/:id` | Remover tratamento |

**Carência ativa** — filtro SQL no backend:
```sql
WHERE DATE('now') <= DATE(data_aplicacao, '+' || dias_carencia || ' days')
```

---

### 4.11 Relatórios — `/relatorios`

| Método | Rota | Descrição |
|---|---|---|
| GET | `/relatorios/producao/json` | Total de litros + todos os registros |
| GET | `/relatorios/financeiro/json` | Receitas, despesas, saldo + registros |
| GET | `/relatorios/completo/json` | Rebanho + produção + financeiro + reprodução |

---

### 4.12 Inteligência Artificial — `/ml`

| Método | Rota | Descrição |
|---|---|---|
| GET | `/ml/detect-anomalies` | Detecta queda de produção ≥ 20% por vaca |
| GET | `/ml/predict-production` | Previsão dos próximos 7 dias |
| GET | `/ml/analyze-performance` | Score do rebanho (0–100) |
| GET | `/ml/recommendations` | Recomendações de manejo |
| GET | `/ml/financial-forecast` | Previsão financeira do próximo mês |
| GET | `/ml/insights` | Insights gerais |

**Lógica de detecção de anomalias:**
1. Busca últimos 8 registros por vaca
2. Calcula média dos registros 2–8 (janela de 7 dias)
3. Se registro mais recente caiu ≥ 20%: gera alerta
4. `severidade: "alta"` se queda > 30%, `"media"` se 20–30%

---

## 5. Frontend — Estrutura de Telas

```
app/
├── index.tsx                  ← Redireciona para /login ou /dashboard
├── _layout.tsx                ← Providers: QueryClient + Auth + Fonts + Notifications
├── configuracoes.tsx
│
├── (auth)/
│   ├── login.tsx              ← E-mail + senha
│   └── register.tsx           ← Nome + e-mail + senha
│
├── (tabs)/
│   ├── _layout.tsx            ← Bottom tab bar (6 abas)
│   ├── dashboard.tsx          ← Cards: produção, financeiro, alertas, partos, carência
│   ├── vacas.tsx              ← Lista do rebanho
│   ├── producao.tsx           ← Registros de produção com avatar da vaca
│   ├── financeiro.tsx         ← Resumo + listas receita/despesa
│   ├── marketplace.tsx        ← Feed de anúncios
│   └── perfil.tsx             ← Perfil + plano + configurações
│
├── vacas/
│   ├── [id].tsx               ← Detalhes: timeline, parto previsto, badge carência
│   ├── create.tsx
│   └── edit/[id].tsx
│
└── marketplace/
    ├── [id].tsx
    ├── create.tsx
    └── edit/[id].tsx
```

---

## 6. Frontend — Serviços e Hooks

### 6.1 Cliente HTTP (`services/api.ts`)
- Injeta `Bearer token` automaticamente em todas as requisições
- Timeout de 60 segundos com `AbortController`
- Resposta 401 → `signOut()` automático
- Erros tipados com mensagem descritiva

### 6.2 Cache de Dados (TanStack React Query)

| Hook | Endpoint | Stale Time |
|---|---|---|
| `useDashboard()` | múltiplos endpoints | 60s |
| `useVacas()` | `GET /vacas` | padrão |
| `useProducao()` | `GET /producao` | padrão |
| `useProducaoByCow(id)` | `GET /producao?vaca_id=X` | padrão |
| `useReceitas()` | `GET /financeiro/receitas` | padrão |
| `useDespesas()` | `GET /financeiro/despesas` | padrão |
| `useMarketplace()` | `GET /marketplace` | padrão |
| `useReproducao(id?)` | `GET /reproducao?vaca_id=X` | padrão |
| `useCarencia(id?)` | `GET /medicamentos?ativo=true` | padrão |
| `useEstaEmCarencia(id)` | usa `useCarencia` | — |
| `useAnomalias()` | `GET /ml/detect-anomalies` | 10min |
| `usePartosProximos()` | usa `useReproducao` | — |
| `useProximasTarefas()` | usa `useReproducao` | — |

### 6.3 Cálculo de Parto Previsto
```ts
// Inseminação + 283 dias = data prevista do parto
const partoDate = new Date(inseminacaoDate);
partoDate.setDate(partoDate.getDate() + 283);
```

---

## 7. Sistema de Notificações

### Notificações Locais Agendadas

| Notificação | Trigger | Identificador |
|---|---|---|
| Lembrete de produção | Diário às 07:00 | `vf-daily-producao` |
| Resumo financeiro | Segunda às 09:00 | `vf-weekly-financeiro` |
| Evento reprodutivo (1 dia antes) | DATE às 08:00 | `vf-event-{id}-1d` |
| Evento reprodutivo (7 dias antes) | DATE às 08:00 | `vf-event-{id}-7d` |
| Parto previsto (7 dias antes) | DATE às 08:00 | `vf-parto-{id}` |
| Fim de carência (no dia) | DATE às 08:00 | `vf-carencia-{id}` |

### Fluxo de Restauração (boot do app)
1. `restoreNotifications()` lê preferências do AsyncStorage
2. Re-agenda `producao` e `financeiro` conforme configurações salvas
3. `useEffect` no Dashboard agenda eventos e partos quando os dados carregam

---

## 8. Upload de Imagens

### Pipeline completo
```
Usuário seleciona foto
       ↓
Expo Image Manipulator
  - Resize para máx. 900px
  - Compressão 70% JPEG
  - (2-5MB → ~80-200KB)
       ↓
FormData com campo "foto"
       ↓
Multer (backend)
  - Valida MIME: JPEG/PNG/WEBP
  - Limite: 5MB
  - Armazena em memória
       ↓
Cloudinary
  - Converte para WebP/AVIF
  - Redimensiona para 900px
  - Retorna URL permanente
```

---

## 9. Autenticação e Segurança

### Fluxo JWT
1. `POST /auth/login` → backend valida credenciais → retorna `{ token, user }`
2. Frontend salva no AsyncStorage + Context (`signIn(token, user)`)
3. Todas as requisições: `Authorization: Bearer <token>`
4. Backend valida com `JWT_SECRET` em cada rota protegida
5. Token expirado → 401 → `signOut()` → redirect para login

### Validações de Entrada (express-validator)
- **Registro:** nome obrigatório, e-mail válido, senha mínimo 6 chars
- **Vaca:** `status_saude` deve ser `saudavel | seca | tratamento`
- **Produção:** litros entre 0.01 e 500, data não pode ser futura
- **Financeiro:** valor positivo, data obrigatória
- **Marketplace:** categoria deve ser `Bovino | Insumo | Equipamento | Outro`

---

## 10. Variáveis de Ambiente

### Backend (`.env`)
```env
JWT_SECRET=sua_chave_secreta_aqui
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=seu_api_secret
PORT=5000
TURSO_URL=libsql://seu-banco.turso.io    # opcional (usa SQLite local se omitido)
TURSO_AUTH_TOKEN=seu_token               # opcional
ALLOWED_ORIGINS=https://seu-app.com      # opcional (padrão: localhost:8081)
```

### Frontend
```env
BASE_URL=http://<ip-do-servidor>:5000
```

---

## 11. EAS / OTA Updates

```json
// app.json
{
  "updates": {
    "url": "https://u.expo.dev/d9bb7f61-3047-4686-a2bc-f84b31e208d2",
    "checkAutomatically": "ON_LOAD"
  },
  "runtimeVersion": { "policy": "appVersion" },
  "owner": "vitor_afonso"
}
```

```json
// eas.json
{
  "build": {
    "development": { "developmentClient": true, "channel": "development" },
    "preview":     { "distribution": "internal", "channel": "preview" },
    "production":  { "autoIncrement": true, "channel": "production" }
  }
}
```

### Fluxo de deploy
```bash
# 1. Gerar APK (apenas uma vez por versão nativa)
npx eas build --profile preview --platform android

# 2. Publicar atualização JS (sem reinstalar o app)
npx eas update --branch preview --message "descrição da mudança"
```

---

## 12. Componentes Reutilizáveis

| Componente | Uso |
|---|---|
| `CowForm` | Formulário criar/editar vaca |
| `ProductionModal` | Registrar produção diária |
| `ReproducaoModal` | Criar/editar evento reprodutivo (suporta modo edição via prop `editing`) |
| `SaudeModal` | Registrar tratamento/medicamento com preview de data fim de carência |
| `TransactionModal` | Registrar receita ou despesa |

---

## 13. Geração de PDF (`utils/pdf.ts`)

Gera relatórios em HTML e exporta via `expo-print` + `expo-sharing`.

| Função | Descrição |
|---|---|
| `buildCowsReport(cows, userName)` | Relatório do rebanho com status e totais |
| `buildProductionReport(records, cowMap, userName)` | Produção com total de litros e média |
| `buildFinancialReport(receitas, despesas, userName)` | Financeiro com saldo final |
| `exportPdf(html, filename)` | Renderiza HTML em PDF e abre dialog de compartilhamento |
