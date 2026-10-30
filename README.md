# MedClinic API

API REST da MedClinic, uma clínica médica de pequeno porte, de uso interno da
administração, da secretaria e dos médicos.

Na etapa 1 fiz a base de acesso (usuários, login com JWT e RBAC). Esta é a
**etapa 2 — agendamento, escala e prontuário**: em cima daquela base entram
pacientes, médicos, escala de trabalho, agenda do médico, agendamento sem
conflito (inclusive com duas requisições ao mesmo tempo), ciclo de vida da
consulta e prontuário com acesso pelo vínculo de atendimento. A API segue o
contrato da Seção 4.9 do enunciado e é publicada a cada merge na `main`.

- **API publicada:** `https://medclinic-api-SEU-NOME.onrender.com` (saúde em `/api/v1/health`)
- **Board do projeto:** `https://github.com/users/josepicanco/projects/N`

## Tecnologias

- Node.js 22
- TypeScript (`strict: true`)
- Express 5
- TypeORM 0.3 (migrations, QueryBuilder, transações e lock pessimista)
- PostgreSQL 16 (Neon/Render em produção, com SSL)
- zod (validação de entrada)
- bcryptjs (hash de senha) e jsonwebtoken (JWT)
- Vitest + cobertura v8
- Docker (multi-stage), GitHub Actions, GHCR e Render
- dotenv e ts-node-dev (desenvolvimento)

## Como rodar o projeto

### 1. Pré-requisitos

- Node.js 22 ou superior
- Docker (para subir o PostgreSQL pelo `docker compose`) ou um PostgreSQL 14+ já instalado
- Um cliente HTTP para testar (Insomnia, Postman ou a extensão REST Client do VS Code)

### 2. Instalar as dependências

```bash
git clone https://github.com/josepicanco/medclinic-api.git
cd medclinic-api
npm ci
```

### 3. Configurar o .env

```bash
cp .env.example .env
```

Preencha pelo menos `DB_PASSWORD`, `JWT_SECRET` e `ADMIN_PASSWORD`. O `.env`
está no `.gitignore`, então as credenciais não vão para o repositório.

### 4. Subir o banco

```bash
docker compose up -d db
```

O `docker-compose.yml` sobe um PostgreSQL 16 usando as mesmas variáveis
`DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` e `DB_PORT` do `.env`.

### 5. Subir a API

```bash
npm run dev
```

Na subida a API roda as migrations pendentes e cria o administrador inicial se
ele ainda não existir. Se estiver tudo certo, aparece no terminal:

```
[database] Conexão com o PostgreSQL estabelecida.
[database] Migrations executadas: ...
[seed] Administrador criado: admin@medclinic.com
[server] MedClinic API rodando em http://0.0.0.0:3333 (development)
```

Para testar: `curl http://localhost:3333/api/v1/health` → `{"status":"ok"}`.
As requisições de exemplo estão em `docs/requests.http`.

## Variáveis de ambiente

São as mesmas chaves do `.env.example`, sem valores reais.

| Variável | Para que serve | Exemplo |
|---|---|---|
| `NODE_ENV` | Ambiente de execução | `development` |
| `PORT` | Porta da API (a API escuta em `0.0.0.0`) | `3333` |
| `RUN_MIGRATIONS` | Roda as migrations pendentes na subida | `true` |
| `DATABASE_URL` | URL completa do banco gerenciado. Se preenchida, as `DB_*` abaixo deixam de ser obrigatórias | `postgresql://...` |
| `DB_HOST` | Host do banco | `localhost` |
| `DB_PORT` | Porta do banco | `5432` |
| `DB_USERNAME` | Usuário do banco | `postgres` |
| `DB_PASSWORD` | Senha do banco | — |
| `DB_DATABASE` | Nome do banco | `medclinic` |
| `DB_LOGGING` | Mostra as queries no terminal | `false` |
| `DB_SSL` | Liga SSL no DataSource (obrigatório no Neon/Render) | `true` em produção |
| `DB_SSL_REJECT_UNAUTHORIZED` | Valida o certificado do servidor. Só use `false` se o provedor usar certificado próprio | `true` |
| `JWT_SECRET` | Chave usada para assinar o token | uma string longa e aleatória |
| `JWT_EXPIRES_IN` | Tempo de validade do token | `1h` |
| `BCRYPT_SALT_ROUNDS` | Custo do hash da senha | `10` |
| `ADMIN_NAME` | Nome do administrador criado pelo seed | `Administrador do Sistema` |
| `ADMIN_EMAIL` | E-mail do administrador criado pelo seed | `admin@medclinic.com` |
| `ADMIN_PASSWORD` | Senha do administrador criado pelo seed | — |

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe a API em modo desenvolvimento (ts-node-dev, com reload) |
| `npm run build` | Compila `src/` para `dist/` |
| `npm start` | Roda a versão compilada (`node dist/server.js`) |
| `npm run migration:run` | Aplica as migrations pendentes |
| `npm run migration:revert` | Desfaz a última migration |
| `npm run seed:admin` | Cria o administrador inicial, se ainda não existir |
| `npm test` | Roda os testes unitários |
| `npm run test:cov` | Roda os testes com cobertura; reprova abaixo de 80% |
| `npm run typecheck` | Checa os tipos de `src/` e `tests/` sem gerar arquivos |

Em produção as migrations e o seed rodam sozinhos na subida do container.

## Arquitetura

Continua o MVC em camadas da etapa 1. A diferença é que agora as camadas se
ligam por injeção de dependência pelo construtor, montadas em um só lugar
(`src/container.ts`), e nenhum service conhece TypeORM, Express ou variável de
ambiente. Uma requisição passa por:

```
routes -> authenticate (JWT) -> authorize (perfil) -> validate (zod) -> controller
       -> service (regra de negócio) -> repository (TypeORM) -> PostgreSQL
erro em qualquer ponto -> error-handler -> { statusCode, error, message }
```

| Pasta | O que tem |
|---|---|
| `src/server.ts` | Conecta no banco, roda migrations e seed, sobe em `0.0.0.0:PORT` |
| `src/app.ts` | Monta o Express com o prefixo `/api/v1`, a rota 404 e o tratamento de erros |
| `src/container.ts` | Cria repositórios, services e controllers e liga tudo pelo construtor |
| `src/routes` | Endpoints e os middlewares de cada rota |
| `src/middlewares` | Autenticação (JWT), autorização (RBAC), validação, rota não encontrada e tratamento de erros |
| `src/controllers` | Pegam os dados já validados, chamam o service e devolvem a resposta |
| `src/services` | Regras de negócio (`*.service.ts`) |
| `src/rules` | Regras puras sem dependência nenhuma (`*.rules.ts`): sobreposição de períodos, escala, fuso da clínica e transições de status |
| `src/repositories` | Interface do repositório (`I*Repository`, a porta usada pelo service) e a implementação com TypeORM, no mesmo arquivo |
| `src/entities` | Entidades do TypeORM |
| `src/dtos` | Schemas zod de entrada e conversão da entidade para a resposta |
| `src/enums` | Perfis (`admin`, `secretary`, `doctor`) e status da consulta |
| `src/errors` | Classes de erro com o código do catálogo (sem status HTTP) |
| `src/utils` | Hash de senha, JWT e helpers de banco |
| `src/database` | DataSource, migrations e seed |
| `src/config` | Leitura das variáveis de ambiente |
| `src/types` | Usuário autenticado, paginação e a tipagem do `request.user` |
| `tests` | Dublês em memória das portas (`tests/fakes`) e testes unitários (`tests/unit`) |
| `docs` | `schema.sql` (estrutura final do banco) e `requests.http` |

### Decisões de modelagem

- **O que mudou da etapa 1.** As rotas foram para `/api/v1`, o login devolve
  `{ "accessToken" }`, os perfis passaram de `ADMIN`/`ATENDENTE` para
  `admin`/`secretary`/`doctor` e o cadastro público `/auth/register` saiu, porque
  não pode existir rota aberta que crie usuário (RF13). A migration
  `AlterUsersToRolesArray` converte os usuários que já existiam (`ADMIN` vira
  `admin`, `ATENDENTE` vira `secretary`).
- **Id inteiro.** Na etapa 1 o id do usuário era `uuid`. O contrato usa ids
  numéricos (`"id": 1`), então a mesma migration troca o id de `users` para
  `SERIAL`. Deu para fazer sem perder nada porque ainda não havia nenhuma
  chave estrangeira apontando para `users`. As tabelas novas já nascem com
  `SERIAL`.
- **Perfis em array.** Um usuário pode ter mais de um perfil, então `roles` é
  uma coluna `text[]` com um `CHECK` que só aceita os três valores. O token
  leva o id (`sub`) e os perfis (`roles`).
- **Médico = usuário + registro profissional.** São duas tabelas: `users`
  (acesso) e `doctors` (CRM, com `user_id` único). O `DoctorRepository.createWithUser`
  grava as duas na mesma transação, então CRM ou e-mail repetido desfaz tudo
  (RN03). O perfil `doctor` não é concedido pelo `POST /users`: médico só nasce
  pelo `POST /doctors`.
- **Unicidade no banco (RP04).** `UQ_users_email`, `UQ_doctors_crm` e o índice
  único parcial `UQ_patients_cpf_active`. O service consulta antes para devolver
  o código certo, e o repositório traduz a violação do banco quando duas
  gravações correm juntas.
- **Paciente com remoção lógica (`deleted_at`).** O paciente tem consultas e
  prontuário, e apagar a linha quebraria esse histórico. Removido, ele some das
  listagens e das buscas, e o CPF pode ser cadastrado de novo.
- **Escala em linhas, horas em minutos.** Um turno por linha em `work_shifts`,
  com `start_minutes` e `end_minutes` (minutos desde 00:00 no horário de São
  Paulo). Assim alinhar a grade e comparar turnos vira conta com inteiro; a API
  continua recebendo e devolvendo `HH:MM`. Trocar a escala é apagar e inserir
  na mesma transação.
- **Instantes em `timestamptz` (RP05)**, e a consulta guarda o próprio
  `ends_at`, calculado no momento de agendar pela duração do turno. Mudar a
  escala depois não mexe em consulta marcada (RN15).
- **Fuso da clínica.** A conversão UTC ↔ `America/Sao_Paulo` usa
  `Intl.DateTimeFormat` (`src/rules/clinic-time.rules.ts`), sem depender do fuso
  do servidor e sem offset fixo.
- **Concorrência (RF07).** O `POST /appointments` roda numa transação que faz
  `SELECT ... FOR UPDATE` na linha do **médico** (e depois na do paciente,
  sempre nessa ordem para não dar deadlock) antes de verificar a escala e os
  conflitos e gravar. A segunda requisição espera o lock, enxerga a consulta já
  gravada e recebe `409 HORARIO_INDISPONIVEL`. Dentro da transação todas as
  consultas usam o `EntityManager` dela (`BookingTransaction`).
- **Conflito é interseção de períodos** (`a.inicio < b.fim && b.inicio < a.fim`),
  ignorando as consultas canceladas.
- **Troca de status.** Primeiro confiro o ciclo de vida (`422 TRANSICAO_INVALIDA`)
  e depois a autoridade do perfil (`403 ACESSO_NEGADO`).
- **Agenda.** O `GET /calendar` aceita no máximo 31 dias contando as duas pontas
  e considera o dia inteiro no horário local.
- **Erros.** A regra de negócio só lança a classe de erro com o código do
  catálogo; quem transforma em status HTTP é o `error-handler.middleware.ts`.
  Erro inesperado volta `500` no mesmo envelope, com `error: "ERRO_INTERNO"` e
  sem stack trace.

### Padrão de nomes

| O quê | Padrão | Exemplo |
|---|---|---|
| Arquivos | `kebab-case` + sufixo da camada | `work-schedule.service.ts`, `appointment.repository.ts` |
| Sufixos | `.entity`, `.repository`, `.service`, `.rules`, `.dto`, `.controller`, `.routes`, `.middleware`, `.util`, `.enum`, `.seed`, `.spec` | `appointment-status.rules.ts` |
| Classes | `PascalCase`, entidade sem sufixo | `AppointmentService`, `Patient` |
| Interfaces de porta | `I` + `PascalCase` | `IAppointmentRepository`, `IPasswordHasher` |
| Tipos de DTO | `PascalCase` + `DTO` | `CreatePatientDTO`, `PatientResponseDTO` |
| Funções, variáveis e campos | `camelCase` | `findShiftForSlot`, `startsAt` |
| Constantes de módulo | `UPPER_SNAKE_CASE` | `MAX_CALENDAR_DAYS` |
| Valores de enum | `UPPER_SNAKE_CASE` na chave, valor do contrato | `AppointmentStatus.IN_PROGRESS = 'in_progress'` |
| Rotas | substantivo no plural, `kebab-case`, sob `/api/v1` | `/doctors/{doctorId}/work-schedule` |
| Banco | tabelas e colunas em `snake_case`; restrições com prefixo `UQ_`, `FK_`, `CHK_`, `IDX_` | `appointments.starts_at`, `UQ_doctors_crm` |
| Migrations | `<timestamp>-<Verbo><Objeto>.ts` | `1792886227905-CreateAppointmentsTable.ts` |
| Branches | `tipo/assunto` | `feat/agendamento`, `ci/deploy` |
| Commits | `tipo: descrição no imperativo` | `feat: valida horario do agendamento contra a escala` |

## Testes e recorte da cobertura

Os testes são unitários (Vitest) e rodam só sobre a regra de negócio, com
dublês em memória construídos em cima das interfaces dos repositórios
(`tests/fakes`). Nenhum teste usa banco, rede ou variável de ambiente.

**Recorte** (`vitest.config.ts`): `src/services/**/*.service.ts` e
`src/rules/**/*.rules.ts`. É onde está o que dá prejuízo quando quebra:
validação do horário contra a escala, detecção de conflito, transição de
status, posse do prontuário, unicidade e cadastro atômico do médico.
Controllers, rotas, DTOs, entidades, migrations e repositórios ficam de fora
porque não têm regra de negócio. O limiar é 80% em `lines`, `branches`,
`functions` e `statements`, e o workflow do pull request reprova abaixo disso.

| Caso mínimo (Seção 4.5) | Onde está |
|---|---|
| Sobreposição de períodos (os 5 cenários) | `tests/unit/rules/period.rules.spec.ts` |
| Criação de agendamento (sucesso, fora do turno, desalinhado, não cabe, conflito do médico, conflito do paciente) | `tests/unit/services/appointment-booking.spec.ts` |
| Validação da escala (sobrepostos recusados, encostados aceitos) | `tests/unit/services/work-schedule.service.spec.ts` e `tests/unit/rules/schedule.rules.spec.ts` |
| Transição de status (válida e inválida) | `tests/unit/services/appointment-status.spec.ts` |
| Prontuário (com vínculo escreve, sem vínculo 403) | `tests/unit/services/medical-record.service.spec.ts` |
| Login (credencial inválida e comparação pelo hash) | `tests/unit/services/auth.service.spec.ts` |

## Integração e publicação contínuas

- `.github/workflows/pr-workflow.yml`: em todo pull request para a `main` roda
  `npm ci`, checagem de tipos, build e `npm run test:cov`. O job `validate` é o
  check obrigatório na proteção da branch `main`.
- `.github/workflows/deploy.yml`: em todo push na `main` (merge de PR) faz o
  build da imagem pelo `Dockerfile`, publica no GHCR (`latest` e o SHA do commit)
  e chama o Deploy Hook do Render (segredo `RENDER_DEPLOY_HOOK_URL`).
- As variáveis da aplicação ficam no painel do Render, nunca no repositório nem
  no workflow.

## Perfis de acesso

| Perfil | Quem é | O que faz |
|---|---|---|
| `admin` | administração | cria usuários, médicos e escalas; enxerga tudo; lê prontuário para auditoria |
| `secretary` | secretaria | cadastra pacientes e agendamentos; cancela consulta agendada |
| `doctor` | médico | vê as próprias consultas, conduz o atendimento e escreve o prontuário de quem atendeu |

## Endpoints

Base URL: `http://localhost:3333/api/v1`. Fora as rotas públicas, todas pedem
`Authorization: Bearer <accessToken>`.

| Método | Rota | Perfis |
|---|---|---|
| GET | `/health` | público |
| POST | `/auth/login` | público |
| GET | `/users/me` | autenticado |
| POST | `/users` | `admin` |
| POST | `/patients` | `admin`, `secretary` |
| GET | `/patients?name=&page=&pageSize=` | autenticado |
| GET | `/patients/{id}` | autenticado |
| PATCH | `/patients/{id}` | `admin`, `secretary` |
| DELETE | `/patients/{id}` | `admin` |
| POST | `/doctors` | `admin` |
| GET | `/doctors?name=&page=&pageSize=` | autenticado |
| GET | `/doctors/{id}` | autenticado |
| PUT | `/doctors/{doctorId}/work-schedule` | `admin` |
| GET | `/doctors/{doctorId}/work-schedule` | autenticado |
| GET | `/doctors/{doctorId}/calendar?from=&to=` | autenticado |
| POST | `/appointments` | `admin`, `secretary` |
| GET | `/appointments?doctorId=&patientId=&status=&from=&to=` | autenticado (`doctor` só vê as próprias) |
| GET | `/appointments/{id}` | autenticado (`doctor` só as próprias) |
| PATCH | `/appointments/{id}/status` | depende da transição (tabela abaixo) |
| POST | `/patients/{patientId}/medical-records` | `doctor` com vínculo |
| GET | `/patients/{patientId}/medical-records` | `doctor` com vínculo, `admin` |

Transições de status:

| De → para | Quem pode |
|---|---|
| `scheduled` → `in_progress` | `admin`, médico da consulta |
| `scheduled` → `cancelled` | `admin`, `secretary`, médico da consulta |
| `in_progress` → `done` | `admin`, médico da consulta |
| `in_progress` → `cancelled` | `admin`, médico da consulta |

## Erros e listagens

Todo erro volta no mesmo envelope, com um dos códigos do catálogo do contrato:

```json
{
  "statusCode": 409,
  "error": "HORARIO_INDISPONIVEL",
  "message": "Este horário acabou de ser ocupado."
}
```

| Status | `error` |
|---|---|
| `400` | `DADOS_INVALIDOS` |
| `401` | `NAO_AUTENTICADO`, `CREDENCIAIS_INVALIDAS` |
| `403` | `ACESSO_NEGADO` |
| `404` | `RECURSO_NAO_ENCONTRADO` |
| `409` | `EMAIL_JA_CADASTRADO`, `CPF_JA_CADASTRADO`, `CRM_JA_CADASTRADO`, `HORARIO_INDISPONIVEL`, `PACIENTE_INDISPONIVEL` |
| `422` | `HORARIO_FORA_DA_ESCALA`, `TRANSICAO_INVALIDA` |

Toda listagem é paginada (`?page=`, padrão 1; `?pageSize=`, padrão 20, máximo 100):

```json
{
  "data": [],
  "meta": { "total": 57, "page": 1, "pageSize": 20, "totalPages": 3 }
}
```
