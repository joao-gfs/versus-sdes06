const partidaService = require('../services/partida.service');

// PUT /api/partidas/:id/registrar - registra o resultado de uma partida
async function handleRegistrarPartida(req, res) {
    try {
        const partidaId = Number(req.params.id);
        const payload = req.body;

        // Extrair role do usuário
        const roleHeader = (req.headers['x-role'] || '').toString().toUpperCase();
        const requesterRole = roleHeader || (req.user && req.user.role ? String(req.user.role).toUpperCase() : '');

        const updated = await partidaService.registrarPartida(partidaId, payload, requesterRole);

        return res.status(200).json({
            message: "Resultado da partida registrado com sucesso.",
            partida: updated
        });

    } catch (err) {
        const code = err.statusCode || 400;
        return res.status(code).json({ error: err.message });
    }
}

// GET /api/partidas - consulta partidas (filtros por torneioId, fase, status, equipe, dataPartida)
async function handleListPartidas(req, res) {
    try {
        const filters = req.query;

        // Extrair informações de permissão do usuário
        const roleHeader = (req.headers['x-role'] || '').toString().toUpperCase();
        const requesterRole = roleHeader || (req.user && req.user.role ? String(req.user.role).toUpperCase() : '');
        const requesterOrgId = req.headers['x-org-id'] || (req.user && req.user.organizacaoId);
        const requesterEquipeId = req.headers['x-equipe-id'] || (req.user && req.user.equipeId);

        const list = await partidaService.listPartidas({
            ...filters,
            requesterRole,
            requesterOrgId,
            requesterEquipeId,
        });

        return res.json(list);
    } catch (err) {
        const code = err.statusCode || 400;
        return res.status(code).json({ error: err.message });
    }
}

module.exports = {
    handleRegistrarPartida,
    handleListPartidas
};