const express = require('express');
const cors = require('cors'); // 1. Importe o pacote
const allRoutes = require('./routes'); // Importa o roteador principal

const app = express();

const corsOptions = {
  origin: 'http://localhost:5173'
};

app.use(cors(corsOptions));


app.use(express.json());


// Rota de saúde
app.get('/', (req, res) => {
  res.send('API com Node, Express, Prisma e Postgres está no ar!');
});

// Conecta todas as rotas
app.use('/api', allRoutes);

module.exports = app;