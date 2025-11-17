const express = require('express');
const router = express.Router();

const exampleRoutes = require('./example.routes');
const usuarioRoutes = require('./usuario.routes');
const organizacaoRoutes = require('./organizacao.routes');
const torneioRoutes = require('./torneio.routes');
const equipeRoutes = require('./equipe.routes');

// Todas as rotas em 'example.routes.js' serão prefixadas com /example
router.use('/example', exampleRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/organizacoes', organizacaoRoutes);
router.use('/torneios', torneioRoutes);
router.use('/equipes', equipeRoutes);

// Adicione mais rotas aqui
// router.use('/user', userRoutes);

module.exports = router;