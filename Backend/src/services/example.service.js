//logica de negocio e chamadas ao banco de dados

const getExample = async () => {
    try {
        return {
            "name": "abcd",
            "email": "example@unifei.edu.br",
        }
    } catch (error) {
        throw new Error(`Erro ao fornecer exemplo: ${error.message}`);
    }
};

module.exports = {
    getExample,
}