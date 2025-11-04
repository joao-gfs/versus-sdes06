// trabalha entre as rotas e os serviços.
const exampleService = require('../services/example.service');

const handleGetExample = async (req, res) => {
  try {
    const example = await exampleService.getExample();
    res.status(200).json(example);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  handleGetExample,
};