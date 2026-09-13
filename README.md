# MedClinic API

API REST da MedClinic, uma clínica médica de pequeno porte. Nesta etapa 1 o foco
é só a parte de acesso ao sistema: cadastro de usuários, login com JWT e
controle de acesso por perfil (RBAC).

Especialidades, médicos, pacientes e consultas ficam para a próxima etapa, em
cima desta mesma base.

## Tecnologias

- Node.js 18+
- TypeScript
- Express
- TypeORM
- PostgreSQL
- bcryptjs (hash de senha)
- jsonwebtoken (JWT)
- dotenv
- ts-node-dev (ambiente de desenvolvimento)

## Como rodar o projeto

### 1. Pré-requisitos

- Node.js 18 ou superior
- PostgreSQL 14 ou superior rodando
- Um cliente HTTP para testar (Insomnia, Postman ou a extensão REST Client do VS Code)

### 2. Instalar as dependências

```bash
git clone https://github.com/josepicanco/medclinic-api.git
cd medclinic-api
npm install
```

### 3. Criar o banco

```bash
createdb medclinic
```

ou pelo psql:

```bash
psql -U postgres -c "CREATE DATABASE medclinic;"
```

### 4. Configurar o .env

Copie o arquivo de exemplo e ajuste com os dados do seu PostgreSQL:

```bash
cp .env.example .env
```

| Variável | Para que serve | Exemplo |
|---|---|---|
| `NODE_ENV` | Ambiente de execução | `development` |
| `PORT` | Porta da API | `3333` |
| `DB_HOST` | Host do banco | `localhost` |
| `DB_PORT` | Porta do banco | `5432` |
| `DB_USERNAME` | Usuário do banco | `postgres` |
| `DB_PASSWORD` | Senha do banco | `postgres` |
| `DB_DATABASE` | Nome do banco | `medclinic` |
| `DB_LOGGING` | Mostra as queries no terminal | `false` |
| `JWT_SECRET` | Chave usada para assinar o token | uma string longa e aleatória |
| `JWT_EXPIRES_IN` | Tempo de validade do token | `1h` |
| `BCRYPT_SALT_ROUNDS` | Custo do hash da senha | `10` |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Dados do admin criado pelo seed | ver `.env.example` |

O `.env` está no `.gitignore`, então as credenciais não vão para o repositório.

### 5. Criar as tabelas

```bash
npm run migration:run
```

Também deixei o SQL equivalente em `docs/schema.sql`, caso prefira rodar direto
no banco:

```bash
psql -U postgres -d medclinic -f docs/schema.sql
```

### 6. Criar o administrador

```bash
npm run seed:admin
```

O cadastro pela rota `/auth/register` cria usuários `ATENDENTE` por padrão, então
o primeiro `ADMIN` é criado pelo seed.

### 7. Subir a API

```bash
npm run dev
```

Se estiver tudo certo, aparece no terminal:

```
[database] Conexão com o PostgreSQL estabelecida.
[server] MedClinic API rodando em http://localhost:3333 (development)
```

Outros scripts:

```bash
npm run build      # compila para dist/
npm start          # roda a versão compilada
npm run typecheck  # checa os tipos sem gerar arquivos
```

## Arquitetura

O projeto segue MVC em camadas. Uma requisição passa por:

```
routes -> middlewares -> controllers -> services -> repositories -> entities -> PostgreSQL
```

| Pasta | O que tem |
|---|---|
| `src/routes` | Endpoints e os middlewares de cada rota |
| `src/middlewares` | Autenticação (JWT), autorização (RBAC), rota não encontrada e tratamento de erros |
| `src/controllers` | Recebem a requisição, validam a entrada e devolvem a resposta |
| `src/services` | Regras de negócio (e-mail duplicado, hash da senha, login, token) |
| `src/repositories` | Acesso ao banco com TypeORM |
| `src/entities` | Entidade `User` |
| `src/dtos` | Dados de entrada e saída, validação e conversão para resposta |
| `src/database` | DataSource, migration e seed |
| `src/errors` | Classes de erro com o status HTTP de cada uma |
| `src/utils` | Hash de senha, JWT e validações |
| `src/config` | Leitura das variáveis de ambiente |
| `src/types` | Tipagem do `req.user` no Express |
| `docs` | `schema.sql` e `requests.http` com as requisições de teste |

`server.ts` conecta no banco e sobe a porta; `app.ts` monta o Express com as
rotas e os middlewares.

## Perfis de acesso

| Perfil | Valor | O que pode acessar |
|---|---|---|
| Administrador | `ADMIN` | Tudo, inclusive as rotas `/admin` |
| Atendente | `ATENDENTE` | Rotas autenticadas, menos as de `/admin` (recebe 403) |

O perfil fica salvo no usuário e vai dentro do token, no campo `role`. O
middleware `authorize(...)` confere se o perfil do token está entre os
permitidos na rota.

## Endpoints

Base URL: `http://localhost:3333`

Os exemplos abaixo também estão prontos para uso em `docs/requests.http`.

### GET /health (público)

Só para ver se a API está no ar.

```json
{ "status": "ok", "service": "MedClinic API", "stage": "auth" }
```

### POST /auth/register (público)

Cadastra um usuário. A senha é salva como hash bcrypt.

```json
{
  "name": "Maria Atendente",
  "email": "maria@medclinic.com",
  "password": "Senha@123",
  "role": "ATENDENTE"
}
```

| Campo | Obrigatório | Regra |
|---|---|---|
| `name` | sim | mínimo de 3 caracteres |
| `email` | sim | formato válido e não pode estar cadastrado |
| `password` | sim | mínimo de 8 caracteres |
| `role` | não | `ADMIN` ou `ATENDENTE` (padrão `ATENDENTE`) |

Resposta `201`:

```json
{
  "message": "Usuário cadastrado com sucesso.",
  "data": {
    "id": "184642a8-de9a-41fc-9947-0ce107e7de4e",
    "name": "Maria Atendente",
    "email": "maria@medclinic.com",
    "role": "ATENDENTE",
    "createdAt": "2026-09-13T13:52:08.614Z"
  }
}
```

Erros: `400` se algum campo for inválido e `409` se o e-mail já existir.

### POST /auth/login (público)

```json
{ "email": "admin@medclinic.com", "password": "Admin@123" }
```

Resposta `200`:

```json
{
  "message": "Autenticação realizada com sucesso.",
  "data": {
    "user": {
      "id": "d971482f-0f63-4347-8630-e4a63d4244d2",
      "name": "Administrador do Sistema",
      "email": "admin@medclinic.com",
      "role": "ADMIN",
      "createdAt": "2026-09-12T19:08:51.127Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "1h"
  }
}
```

O token leva o id do usuário (`sub`), o perfil (`role`) e a expiração (`exp`).

Erros: `400` se faltar e-mail ou senha e `401` se as credenciais estiverem
erradas. A mensagem é a mesma nos dois casos, para não revelar se o e-mail existe.

### GET /users/me (precisa de token)

Header: `Authorization: Bearer <token>`

Retorna os dados do usuário do token.

```json
{
  "message": "Usuário autenticado recuperado com sucesso.",
  "data": {
    "id": "184642a8-de9a-41fc-9947-0ce107e7de4e",
    "name": "Maria Atendente",
    "email": "maria@medclinic.com",
    "role": "ATENDENTE",
    "createdAt": "2026-09-13T13:52:08.614Z"
  }
}
```

Erro: `401` se o token estiver ausente, inválido ou expirado.

### GET /admin/ping (precisa de token de ADMIN)

Rota para testar o RBAC.

```json
{
  "message": "pong - acesso autorizado ao recurso restrito de administrador.",
  "data": {
    "userId": "d971482f-0f63-4347-8630-e4a63d4244d2",
    "role": "ADMIN",
    "checkedAt": "2026-09-13T13:54:37.902Z"
  }
}
```

Erros: `401` sem token e `403` quando o usuário é `ATENDENTE`.

## Erros

Todos os erros passam pelo middleware central e voltam no mesmo formato:

```json
{
  "status": "error",
  "statusCode": 409,
  "message": "Já existe um usuário cadastrado com este e-mail.",
  "path": "/auth/register",
  "timestamp": "2026-09-13T13:52:19.045Z"
}
```

Quando é erro de validação, vem também o `details` com a lista de problemas:

```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Dados inválidos para o cadastro de usuário.",
  "details": [
    "O campo \"name\" deve possuir no mínimo 3 caracteres.",
    "O campo \"email\" deve conter um endereço de e-mail válido."
  ],
  "path": "/auth/register",
  "timestamp": "2026-09-13T13:53:02.771Z"
}
```

| Status | Quando acontece |
|---|---|
| `400` | Campo obrigatório faltando, e-mail inválido ou JSON mal formatado |
| `401` | Credenciais erradas ou token ausente, inválido ou expirado |
| `403` | Usuário logado sem o perfil exigido pela rota |
| `404` | Rota que não existe |
| `409` | E-mail já cadastrado |
| `500` | Erro inesperado no servidor |

## Observações

- O `synchronize` do TypeORM está desligado. As tabelas são criadas pela migration.
- A senha nunca volta nas respostas: todo retorno de usuário passa pelo
  `toUserResponseDTO`, que não inclui o hash.
- Os services recebem o repositório pelo construtor, o que facilita trocar por
  um mock quando eu for escrever testes.
- Cada tipo de erro é uma classe (`BadRequestError`, `UnauthorizedError`,
  `ForbiddenError`, `NotFoundError`, `ConflictError`) que já carrega o status HTTP.
