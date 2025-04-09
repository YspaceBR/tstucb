const express = require("express");
const exphbs = require("express-handlebars");
const mysql = require("mysql2");
const path = require("path");
const session = require("express-session");

const PORT = 3001;
const app = express();

app.use(
  session({
    secret: "seuSegredoAqui",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(express.urlencoded({ extended: true }));

app.engine(
  "handlebars",
  exphbs.engine({
    defaultLayout: "main", // padrão com moldura
    layoutsDir: __dirname + "/views/layouts",
  })
);

app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

const conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "nodemysql2",
});

conn.connect((err) => {
  if (err) {
    console.log("Erro ao conectar ao MySQL:", err);
    return;
  }

  console.log("Conectado ao MySQL!");

  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  });
});

function checarAutenticacao(req, res, next) {
  if (req.session && req.session.usuario) {
    next();
  } else {
    res.redirect("/login");
  }
}

app.get("/", (req, res) => {
  res.render("home", {
    navClass: "nav-home",
  });
});

app.get("/principal", checarAutenticacao, (req, res) => {
  const nome = req.session.usuario.nome || "Usuário";
  res.render("principal", {
    navClass: "nav-principal",
    nome,
  });
});


app.get("/reciclar", checarAutenticacao, (req, res) => {
  res.render("reciclar", {
    layout: "auth",
    navClass: "nav-reciclar",
  });
});

app.get("/cadastrar", (req, res) => {
  res.render("cadastrar", {
    navClass: "nav-cadastrar",
  });
});

app.post("/cadastrar", (req, res) => {
  const { nome, email, senha } = req.body;

  const sql = "INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)";
  const values = [nome, email, senha];

  conn.query(sql, values, (err, result) => {
    if (err) {
      console.error("Erro ao cadastrar usuário:", err);
      return res.status(500).send("Erro ao cadastrar");
    }

    console.log("Usuário cadastrado com sucesso!");
    res.redirect("/login");
  });
});

app.get("/login", (req, res) => {
  res.render("login", {
    layout: "main",
    navClass: "nav-login",
  });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM usuarios WHERE email = ? AND senha = ?";
  conn.query(sql, [email, password], (err, results) => {
    if (err) {
      console.error("Erro ao buscar usuário:", err);
      return res.status(500).send("Erro interno no servidor.");
    }

    if (results.length === 0) {
      return res.render("login", { erro: "Email ou senha incorretos." });
    }

    const usuario = results[0];

    req.session.usuario = {
      nome: usuario.nome,
      email: usuario.email,
    };

    res.redirect("/principal");
  });
});

