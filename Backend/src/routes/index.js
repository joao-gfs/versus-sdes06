const express = require('express');
const router = express.Router();

const exampleRoutes = require('./example.routes');

// Todas as rotas em 'example.routes.js' serão prefixadas com /example
router.use('/example', exampleRoutes);

// Adicione mais rotas aqui
// router.use('/user', userRoutes);

module.exports = router;