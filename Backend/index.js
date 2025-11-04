// index.js (na raiz)
require('dotenv').config(); // Carrega o .env antes de tudo
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});