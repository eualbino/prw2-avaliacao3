import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

// Cria o aplicativo express:
const app = express();

// Middleware express.json() aplicado em todas as rotas:
app.use(express.json());

// Array para simular um banco de dados de usuários:
const users = [];

// Armazenamento principal, com alguns dados mockados:
const alunos = [
    {
        id: 1,
        nome: "Asdrubal",
        ra: "11111",
        nota1: 8.5,
        nota2: 9.5
    },
    {
        id: 2,
        nome: "Lupita",
        ra: "22222",
        nota1: 7.5,
        nota2: 7
    },
    {
        id: 3,
        nome: "Zoroastro",
        ra: "33333",
        nota1: 3,
        nota2: 4
    },
];

// ---------------------------------------------------------------
// Rotas públicas (sem token)
// ---------------------------------------------------------------

// Rota register, para criar o usuário:
app.post('/register', async (req, res) => {

    const { username, password } = req.body || {};

    if (!username || !password) {
        return res.status(400).json({ message: "Informe username e password!" });
    }

    if (users.find(user => user.username === username)) {
        return res.status(409).json({ message: "Usuário já existe!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    users.push({ username, password: hashedPassword });
    console.log(users);

    res.status(201).json({ message: "Usuário criado!" });
});

// Rota login, para retornar o jwt:
app.post('/login', async (req, res) => {

    const { username, password } = req.body || {};

    // Procurar o usuário na "base de dados":
    const user = users.find(user => user.username === username);

    // Se não achou, ou a senha não confere, retorna erro:
    if (!user || !password || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Login Incorreto!" });
    }

    // Se está tudo ok, cria e retorna o jwt:
    const token = jwt.sign(
        { username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '1h', algorithm: 'HS256' }
    );

    console.log('Login efetuado pelo usuário ' + user.username);

    res.json({
        message: "Login efetuado pelo usuário " + user.username,
        jwt: token
    });
});

// ---------------------------------------------------------------
// Middleware para verificar o jwt.
// O token vem no 'authorization header', na forma: Bearer blablabla
// ---------------------------------------------------------------
const authenticateJWT = (req, res, next) => {

    const authHeader = req.header('Authorization');
    console.log('Authorization: ' + authHeader);

    let token;

    if (authHeader) {
        const parts = authHeader.split(' ');
        if (parts.length === 2) {
            token = parts[1];
        }
    }

    if (!token) {
        return res.status(401).json({ message: "Acesso negado. Token não fornecido." });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {

        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: "Acesso negado. Token expirado." });
            } else if (err.name === 'JsonWebTokenError') {
                return res.status(403).json({ message: "Acesso negado. Token inválido." });
            } else {
                return res.status(403).json({ message: "Acesso negado. Erro na verificação do token." });
            }
        }

        req.user = user;
        const issuedAtISO = new Date(user.iat * 1000).toISOString();
        const expiresAtISO = new Date(user.exp * 1000).toISOString();

        console.log(`Token validado para usuário: ${user.username}
            Emitido em: ${issuedAtISO}
            Expira em: ${expiresAtISO}
        `);

        next();
    });
};

// Aplica o middleware em todas as rotas que vierem depois:
app.use(authenticateJWT);

// ---------------------------------------------------------------
// Rotas protegidas (precisam de token)
// ATENÇÃO: /alunos/medias e /alunos/aprovados precisam vir
// ANTES de /alunos/:id, senão "medias" seria tratado como id.
// ---------------------------------------------------------------

// Função auxiliar para calcular a média:
const calcularMedia = (aluno) => (aluno.nota1 + aluno.nota2) / 2;

// Retorna todos os alunos:
app.get('/alunos', (req, res) => {
    res.json(alunos);
});

// Retorna nome e média de cada aluno:
app.get('/alunos/medias', (req, res) => {
    const medias = alunos.map(aluno => ({
        nome: aluno.nome,
        media: calcularMedia(aluno)
    }));
    res.json(medias);
});

// Retorna nome e status (aprovado / reprovado) de cada aluno:
app.get('/alunos/aprovados', (req, res) => {
    const aprovados = alunos.map(aluno => ({
        nome: aluno.nome,
        status: calcularMedia(aluno) >= 6 ? "aprovado" : "reprovado"
    }));
    res.json(aprovados);
});

// Retorna um aluno específico:
app.get('/alunos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const aluno = alunos.find(a => a.id === id);

    if (!aluno) {
        return res.status(404).json({ message: "Aluno não encontrado!" });
    }

    res.json(aluno);
});

// Cria um aluno:
app.post('/alunos', (req, res) => {
    const { id, nome, ra, nota1, nota2 } = req.body || {};

    if (id === undefined || !nome || !ra || nota1 === undefined || nota2 === undefined) {
        return res.status(400).json({ message: "Dados incompletos! Informe id, nome, ra, nota1 e nota2." });
    }

    if (alunos.find(a => a.id === parseInt(id))) {
        return res.status(409).json({ message: "Já existe um aluno com este id!" });
    }

    alunos.push({
        id: parseInt(id),
        nome,
        ra,
        nota1: parseFloat(nota1),
        nota2: parseFloat(nota2)
    });

    res.status(201).json({ message: "Aluno criado com sucesso!" });
});

// Altera os dados de um aluno:
app.put('/alunos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const aluno = alunos.find(a => a.id === id);

    if (!aluno) {
        return res.status(404).json({ message: "Aluno não encontrado!" });
    }

    const { nome, ra, nota1, nota2 } = req.body || {};

    if (nome !== undefined) aluno.nome = nome;
    if (ra !== undefined) aluno.ra = ra;
    if (nota1 !== undefined) aluno.nota1 = parseFloat(nota1);
    if (nota2 !== undefined) aluno.nota2 = parseFloat(nota2);

    res.json(aluno);
});

// Apaga os dados de um aluno:
app.delete('/alunos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = alunos.findIndex(a => a.id === id);

    if (index === -1) {
        return res.status(404).json({ message: "Aluno não encontrado!" });
    }

    alunos.splice(index, 1);

    res.json({ message: "Aluno removido!" });
});

app.listen(3000, () => {
    console.log("Servidor ativo e aguardando requisições...");
});
