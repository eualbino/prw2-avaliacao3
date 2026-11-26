# PRW2 - Avaliação 3

Servidor backend com Node + Express para gerenciar alunos, com autenticação JWT.

## Como rodar

```bash
npm install
node server.js
```

Servidor em `http://localhost:3000`.

## Endpoints

| Método | Rota | Token? | Descrição |
|---|---|---|---|
| POST | /register | não | cria usuário |
| POST | /login | não | confere usuário/senha e retorna o JWT |
| GET | /alunos | sim | todos os alunos |
| GET | /alunos/:id | sim | um aluno |
| GET | /alunos/medias | sim | nome e média |
| GET | /alunos/aprovados | sim | nome e status (média ≥ 6: aprovado) |
| POST | /alunos | sim | cria aluno |
| PUT | /alunos/:id | sim | altera aluno |
| DELETE | /alunos/:id | sim | apaga aluno |

O token vai no header: `Authorization: Bearer <token>`.

Todas as respostas são em JSON. Alunos e usuários ficam em arrays na memória.

O arquivo `.env` (JWT_SECRET) foi mantido no repositório de propósito, conforme pedido na avaliação.
