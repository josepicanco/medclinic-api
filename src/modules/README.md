# Modulos de dominio (etapa futura)

Esta pasta esta reservada para os modulos de negocio da clinica que serao
solicitados na proxima etapa do projeto:

- `specialties/` - especialidades medicas
- `doctors/` - medicos
- `patients/` - pacientes
- `appointments/` - consultas

A arquitetura atual (routes -> middlewares -> controllers -> services ->
repositories -> entities) ja esta preparada para receber esses modulos sem
reestruturacao: bastara criar a entidade, o repositorio, o service, o
controller e registrar as rotas em `src/routes/index.ts`, reaproveitando os
middlewares de autenticacao e autorizacao ja existentes.
