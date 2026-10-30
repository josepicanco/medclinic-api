# MedClinic API

API REST da MedClinic, uma clínica médica pequena. Quem usa é a administração, a secretaria e os médicos.

Na etapa 1 fiz a base de acesso: usuários, login com JWT e perfis. Esta é a etapa 2, que trata de agendamento, escala e prontuário. Em cima daquela base entram pacientes, médicos, escala de trabalho, agenda do médico, agendamento sem conflito (inclusive com duas requisições ao mesmo tempo), ciclo de vida da consulta e prontuário. A API segue o contrato da Seção 4.9 do enunciado e é publicada a cada merge na `main`.

- API publicada: `https://medclinic-api-latest-qryr.onrender.com` (saúde em `/api/v1/health`)
- Board do projeto: `https://github.com/users/josepicanco/projects/3`

## Tecnologias

Node.js 26, TypeScript com `strict`, Express 5, TypeORM 0.3, PostgreSQL 16, zod para validar a entrada, bcryptjs e jsonwebtoken para senha e token, Vitest com cobertura v8. Na publicação uso Docker (multi-stage), GitHub Actions, GHCR e Render. No banco de produção uso Neon ou o PostgreSQL do Render, sempre com SSL.

## Como rodar

Precisa de Node 22 ou mais novo (o Dockerfile e o CI usam o 26), Docker (para o PostgreSQL) ou um PostgreSQL 14+ que você já tenha, e um cliente HTTP para testar.

```bash
git clone https://github.com/josepicanco/medclinic-api.git
cd medclinic-api
npm ci
cp .env.example .env
docker compose up -d db
npm run dev
```

No `.env`, preencha pelo menos `DB_PASSWORD`, `JWT_SECRET` e `ADMIN_PASSWORD`. O arquivo está no `.gitignore`, então as senhas não vão para o repositório.

O `docker-compose.yml` sobe um PostgreSQL 16 com as mesmas variáveis `DB_USER`, `DB_PASSWORD`, `DB_DATABASE` e `DB_PORT` do `.env`.

Ao subir, a API roda as migrations que faltam e cria o administrador inicial se ele não existir. O terminal mostra algo assim:

```
[database] Conexão com o PostgreSQL estabelecida.
[database] Migrations executadas: ...
[seed] Administrador criado: admin@medclinic.com
[server] MedClinic API rodando em http://0.0.0.0:3333 (development)
```

Para conferir: `curl http://localhost:3333/api/v1/health` deve devolver `{"status":"ok"}`. Há requisições de exemplo em `docs/requests.http`. Em produção as migrations e o seed rodam sozinhos quando o container sobe.

## Variáveis de ambiente

São as mesmas chaves do `.env.example`, sem valores reais.

| Variável | Para que serve | Exemplo |
|---|---|---|
| `NODE_ENV` | Ambiente de execução | `development` |
| `PORT` | Porta da API (ela escuta em `0.0.0.0`) | `3333` |
| `RUN_MIGRATIONS` | Roda as migrations pendentes na subida | `true` |
| `DATABASE_URL` | URL completa do banco gerenciado. Se estiver preenchida, as `DB_*` abaixo deixam de ser obrigatórias | `postgresql://...` |
| `DB_HOST` | Host do banco | `localhost` |
| `DB_PORT` | Porta do banco | `5432` |
| `DB_USER` | Usuário do banco | `postgres` |
| `DB_PASSWORD` | Senha do banco | |
| `DB_DATABASE` | Nome do banco | `medclinic` |
| `DB_LOGGING` | Mostra as queries no terminal | `false` |
| `DB_SSL` | Liga SSL na conexão (obrigatório no Neon e no Render) | `true` em produção |
| `DB_SSL_REJECT_UNAUTHORIZED` | Valida o certificado do servidor. Só use `false` se o provedor usar certificado próprio | `true` |
| `JWT_SECRET` | Chave que assina o token | uma string longa e aleatória |
| `JWT_EXPIRES_IN` | Validade do token | `1h` |
| `BCRYPT_SALT_ROUNDS` | Custo do hash da senha | `10` |
| `ADMIN_NAME` | Nome do administrador criado pelo seed | `Administrador do Sistema` |
| `ADMIN_EMAIL` | E-mail do administrador criado pelo seed | `admin@medclinic.com` |
| `ADMIN_PASSWORD` | Senha do administrador criado pelo seed | |

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe a API com reload (ts-node-dev) |
| `npm run build` | Compila `src/` para `dist/` |
| `npm start` | Roda a versão compilada (`node dist/server.bootstrap.js`) |
| `npm run migration:run` | Aplica as migrations pendentes |
| `npm run migration:revert` | Desfaz a última migration |
| `npm run seed:admin` | Cria o administrador inicial, se ainda não existir |
| `npm test` | Roda os testes unitários |
| `npm run test:cov` | Roda os testes com cobertura e reprova abaixo de 80% |
| `npm run typecheck` | Confere os tipos de `src/` e `tests/` sem gerar arquivos |

## Arquitetura

Continua sendo MVC em camadas, como na etapa 1. A diferença é que agora as camadas se ligam por injeção de dependência pelo construtor, tudo montado em um lugar só (`src/container.bootstrap.ts`). Nenhum service conhece TypeORM, Express ou variável de ambiente. Uma requisição passa por:

```
routes -> authenticate (JWT) -> authorize (perfil) -> validate (zod) -> controller
       -> service (regra de negócio) -> repository (TypeORM) -> PostgreSQL
erro em qualquer ponto -> error-handler -> { statusCode, error, message }
```

| Local | O que tem |
|---|---|
| `src/server.bootstrap.ts` | Conecta no banco, roda migrations e seed e sobe em `0.0.0.0:PORT` |
| `src/app.bootstrap.ts` | Monta o Express com o prefixo `/api/v1`, a rota 404 e o tratamento de erros |
| `src/container.bootstrap.ts` | Cria repositórios, services e controllers e liga tudo pelo construtor |
| `src/routes` | Endpoints e os middlewares de cada rota |
| `src/middlewares` | Autenticação, autorização por perfil, validação, rota não encontrada e tratamento de erros |
| `src/controllers` | Recebem os dados já validados, chamam o service e devolvem a resposta |
| `src/services` | Regras de negócio |
| `src/rules` | Regras puras, sem dependência de nada: sobreposição de períodos, escala, fuso da clínica e transições de status |
| `src/repositories` | A interface (`I*Repository`, usada pelo service) e a implementação com TypeORM, no mesmo arquivo |
| `src/entities` | Entidades do TypeORM |
| `src/dtos` | Schemas zod de entrada e a conversão da entidade para a resposta |
| `src/enums` | Perfis e status da consulta |
| `src/errors` | Classe de erro com o código do catálogo (sem status HTTP) |
| `src/utils` | Hash de senha, JWT e helpers de banco |
| `src/database` | DataSource, migrations e seed |
| `src/config` | Leitura das variáveis de ambiente |
| `src/types` | Usuário autenticado, paginação e a tipagem do `request.user` |
| `tests` | Dublês em memória (`tests/fakes`) e testes unitários (`tests/unit`) |
| `docs` | `schema.sql` com a estrutura final do banco e `requests.http` |

### Decisões

- **O que mudou da etapa 1.** As rotas foram para `/api/v1`, o login devolve `{ "accessToken" }`, os perfis `ADMIN` e `ATENDENTE` viraram `admin`, `secretary` e `doctor`, e o cadastro público `/auth/register` saiu, porque não pode haver rota aberta que crie usuário (RF13). A migration `AlterUsersToRolesArray` converte quem já existia: `ADMIN` vira `admin` e `ATENDENTE` vira `secretary`.
- **Id inteiro.** Na etapa 1 o id do usuário era `uuid`, mas o contrato usa número (`"id": 1`). A mesma migration troca o id de `users` para `SERIAL`. Foi possível sem perder dados porque nenhuma tabela apontava para `users` ainda. As tabelas novas já nascem com `SERIAL`.
- **Perfis em array.** Um usuário pode ter mais de um perfil, então `roles` é uma coluna `text[]` com um `CHECK` que aceita só os três valores. O token leva o id (`sub`) e os perfis (`roles`).
- **Médico é usuário mais registro profissional.** São duas tabelas, `users` (acesso) e `doctors` (CRM, com `user_id` único). O `DoctorRepository.createWithUser` grava as duas na mesma transação, então um CRM ou e-mail repetido desfaz tudo (RN03). O perfil `doctor` não sai do `POST /users`: médico só nasce pelo `POST /doctors`.
- **Unicidade no banco (RP04).** Existem `UQ_users_email`, `UQ_doctors_crm` e o índice único parcial `UQ_patients_cpf_active`. O service consulta antes para devolver o código certo, e o repositório traduz a violação do banco quando duas gravações chegam juntas.
- **Paciente com remoção lógica (`deleted_at`).** O paciente tem consultas e prontuário, e apagar a linha quebraria esse histórico. Depois de removido ele some das listagens e das buscas, e o CPF pode ser cadastrado de novo.
- **Escala em linhas, horas em minutos.** Cada turno é uma linha em `work_shifts`, com `start_minutes` e `end_minutes` contados desde 00:00 no horário de São Paulo. Assim, alinhar a grade e comparar turnos vira conta com inteiro. A API continua recebendo e devolvendo `HH:MM`. Trocar a escala é apagar e inserir na mesma transação.
- **Instantes em `timestamptz` (RP05).** A consulta guarda o próprio `ends_at`, calculado na hora de agendar pela duração do turno. Se a escala mudar depois, a consulta já marcada não muda (RN15).
- **Fuso da clínica.** A conversão entre UTC e `America/Sao_Paulo` usa `Intl.DateTimeFormat` (`src/rules/clinic-time.rules.ts`). Não depende do fuso do servidor nem de um offset fixo.
- **Concorrência (RF07).** O `POST /appointments` roda numa transação que faz `SELECT ... FOR UPDATE` na linha do médico e depois na do paciente, sempre nessa ordem para não dar deadlock. Só então confere a escala e os conflitos e grava. A segunda requisição espera o lock, vê a consulta já gravada e recebe `409 HORARIO_INDISPONIVEL`. Dentro da transação todas as consultas usam o `EntityManager` dela (`BookingTransaction`).
- **Conflito é interseção de períodos** (`a.inicio < b.fim && b.inicio < a.fim`), e as consultas canceladas não contam.
- **Troca de status.** Primeiro confiro o ciclo de vida (`422 TRANSICAO_INVALIDA`) e depois a autoridade do perfil (`403 ACESSO_NEGADO`).
- **Agenda.** O `GET /calendar` aceita no máximo 31 dias, contando as duas pontas, e considera o dia inteiro no horário local.
- **Erros.** A regra de negócio só lança a classe de erro com o código do catálogo. Quem converte em status HTTP é o `error-handler.middleware.ts`. Um erro inesperado volta `500` no mesmo envelope, com `error: "ERRO_INTERNO"` e sem stack trace. Usei esse código porque o catálogo não tem nenhum para 500.

### Padrão de nomes

Todo arquivo de `src` e de `tests` segue `kebab-case` + sufixo que diz o papel dele, como em `work-schedule.service.ts`. A única exceção é o `src/types/express.d.ts`, que é um arquivo de declaração de tipos e precisa manter o nome `.d.ts`.

| O quê | Padrão | Exemplo |
|---|---|---|
| Arquivos | `kebab-case` + sufixo | `appointment.repository.ts` |
| Sufixos de `src` | `.entity`, `.repository`, `.service`, `.rules`, `.dto`, `.controller`, `.routes`, `.middleware`, `.util`, `.enum`, `.seed`, `.error`, `.type`, `.config`, `.bootstrap` | `appointment-status.rules.ts`, `env.config.ts`, `server.bootstrap.ts` |
| Sufixos de `tests` | `.spec` para teste, `.fake` para dublê | `period.rules.spec.ts`, `password-hasher.fake.ts` |
| Classes | `PascalCase`, entidade sem sufixo | `AppointmentService`, `Patient` |
| Interfaces das portas | `I` + `PascalCase` | `IAppointmentRepository`, `IPasswordHasher` |
| Tipos de DTO | `PascalCase` + `DTO` | `CreatePatientDTO` |
| Funções, variáveis e campos | `camelCase` | `findShiftForSlot`, `startsAt` |
| Constantes de módulo | `UPPER_SNAKE_CASE` | `MAX_CALENDAR_DAYS` |
| Enums | chave em `UPPER_SNAKE_CASE`, valor como no contrato | `AppointmentStatus.IN_PROGRESS = 'in_progress'` |
| Rotas | substantivo no plural, `kebab-case`, sob `/api/v1` | `/doctors/{doctorId}/work-schedule` |
| Banco | tabelas e colunas em `snake_case`; restrições com `UQ_`, `FK_`, `CHK_` ou `IDX_` | `appointments.starts_at`, `UQ_doctors_crm` |
| Migrations | `<timestamp>-<Verbo><Objeto>.ts` | `1792886227905-CreateAppointmentsTable.ts` |
| Branches | `tipo/assunto` | `feat/agendamento`, `ci/deploy` |
| Commits | `tipo: descrição` | `feat: valida horario do agendamento contra a escala` |

## Testes e cobertura

Os testes são unitários (Vitest) e cobrem só a regra de negócio, com dublês em memória feitos em cima das interfaces dos repositórios (`tests/fakes`). Nenhum teste usa banco, rede ou variável de ambiente.

O recorte da cobertura está no `vitest.config.ts`: `src/services/**/*.service.ts` e `src/rules/**/*.rules.ts`. É onde mora o que dá prejuízo se quebrar: horário contra a escala, conflito, transição de status, posse do prontuário, unicidade e cadastro do médico. Controllers, rotas, DTOs, entidades, migrations e repositórios ficam de fora porque não têm regra de negócio. O limiar é 80% em linhas, branches, funções e statements, e o workflow do pull request reprova abaixo disso.

| Caso mínimo (Seção 4.5) | Onde está |
|---|---|
| Sobreposição de períodos (os 5 cenários) | `tests/unit/rules/period.rules.spec.ts` |
| Criação de agendamento (sucesso, fora do turno, desalinhado, não cabe, conflito do médico, conflito do paciente) | `tests/unit/services/appointment-booking.spec.ts` |
| Validação da escala (sobrepostos recusados, encostados aceitos) | `tests/unit/services/work-schedule.service.spec.ts` e `tests/unit/rules/schedule.rules.spec.ts` |
| Transição de status (válida e inválida) | `tests/unit/services/appointment-status.spec.ts` |
| Prontuário (com vínculo escreve, sem vínculo 403) | `tests/unit/services/medical-record.service.spec.ts` |
| Login (credencial inválida e comparação pelo hash) | `tests/unit/services/auth.service.spec.ts` |

## Integração e publicação contínuas

- `.github/workflows/pr-workflow.yml` roda em todo pull request para a `main`: `npm ci`, checagem de tipos, build e `npm run test:cov`. O job `validate` é o check obrigatório da proteção da `main`.
- `.github/workflows/deploy.yml` roda em todo push na `main`. Ele monta a imagem pelo `Dockerfile`, publica no GHCR (`latest` e o SHA do commit) e chama o Deploy Hook do Render, guardado no segredo `RENDER_DEPLOY_HOOK_URL`.
- As variáveis da aplicação ficam no painel do Render, nunca no repositório nem no workflow.

## Perfis de acesso

| Perfil | Quem é | O que faz |
|---|---|---|
| `admin` | administração | cria usuários, médicos e escalas, vê tudo e lê o prontuário para auditoria |
| `secretary` | secretaria | cadastra pacientes e agendamentos e cancela consulta agendada |
| `doctor` | médico | vê as próprias consultas, conduz o atendimento e escreve o prontuário de quem atendeu |

## Endpoints

Base URL: `http://localhost:3333/api/v1`. Fora as rotas públicas, todas pedem `Authorization: Bearer <accessToken>`.

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

| De para | Quem pode |
|---|---|
| `scheduled` para `in_progress` | `admin`, médico da consulta |
| `scheduled` para `cancelled` | `admin`, `secretary`, médico da consulta |
| `in_progress` para `done` | `admin`, médico da consulta |
| `in_progress` para `cancelled` | `admin`, médico da consulta |

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

Toda listagem é paginada. `?page=` começa em 1 e `?pageSize=` tem padrão 20 e máximo 100:

```json
{
  "data": [],
  "meta": { "total": 57, "page": 1, "pageSize": 20, "totalPages": 3 }
}
```
