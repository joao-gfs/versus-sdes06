//definição dos endpoints
const express = require('express');
const router = express.Router();
const exampleController = require('../controllers/example.controller');

router.get('/', exampleController.handleGetExample);

module.exports = router;