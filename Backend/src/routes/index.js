const express = require('express');
const router = express.Router();

const exampleRoutes = require('./example.routes');
const usuarioRoutes = require('./usuario.routes');

// Todas as rotas em 'example.routes.js' serão prefixadas com /example
router.use('/example', exampleRoutes);
router.use('/usuarios', usuarioRoutes);

// Adicione mais rotas aqui
// router.use('/user', userRoutes);

module.exports = router;