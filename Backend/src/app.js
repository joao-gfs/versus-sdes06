const express = require('express');
const allRoutes = require('./routes'); // Importa o roteador principal

const app = express();

app.use(express.json());
// app.use(cors()); // Se precisar de CORS

// Rota de saúde
app.get('/', (req, res) => {
  res.send('API com Node, Express, Prisma e Postgres está no ar!');
});

// Conecta todas as rotas
app.use('/api', allRoutes);

module.exports = app;