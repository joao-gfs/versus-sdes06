const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario.controller');

// POST /api/usuarios - cria um novo usuário conforme RFS01.1
router.post('/createUser', usuarioController.handleCreateUsuario);
// POST /api/usuarios/login - autentica usuário (RFS01.2)
router.post('/login', usuarioController.handleLogin);
// GET /api/usuarios - lista usuários ativos (para seleção em formulários)
router.get('/', usuarioController.handleListUsuarios);

module.exports = router;
