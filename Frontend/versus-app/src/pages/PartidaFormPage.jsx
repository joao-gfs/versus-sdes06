import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registrarPartida } from '../api/partidaApi';
import { listPartidas } from '../api/partidaApi';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';

function PartidaFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, hasRole } = useAuth();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Dados da partida
    const [partida, setPartida] = useState(null);

    // Campos do formulário
    const [golsMandante, setGolsMandante] = useState('');
    const [golsVisitante, setGolsVisitante] = useState('');
    const [status, setStatus] = useState('Marcada');
    const [dataPartida, setDataPartida] = useState('');
    const [observacoes, setObservacoes] = useState('');

    const isAdm = hasRole('ADM');
    const isOrg = hasRole('ORG');

    useEffect(() => {
        loadPartida();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const loadPartida = async () => {
        setLoading(true);
        setError(null);
        try {
            const role = user?.role || '';
            const orgId = user?.organizacaoId || null;
            const equipeId = user?.equipeId || null;

            // Buscar todas as partidas e filtrar pelo ID
            const partidas = await listPartidas({}, role, orgId, equipeId);
            const partidaEncontrada = partidas.find((p) => p.id === Number(id));

            if (!partidaEncontrada) {
                setError('Partida não encontrada');
                return;
            }

            setPartida(partidaEncontrada);

            // Preencher formulário com dados existentes
            if (partidaEncontrada.golsMandante !== null) {
                setGolsMandante(String(partidaEncontrada.golsMandante));
            }
            if (partidaEncontrada.golsVisitante !== null) {
                setGolsVisitante(String(partidaEncontrada.golsVisitante));
            }
            if (partidaEncontrada.status) {
                setStatus(partidaEncontrada.status);
            }
            if (partidaEncontrada.dataPartida) {
                // Converter para formato DD/MM/AAAA
                const date = new Date(partidaEncontrada.dataPartida);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                setDataPartida(`${day}/${month}/${year}`);
            }
            if (partidaEncontrada.observacoes) {
                setObservacoes(partidaEncontrada.observacoes);
            }
        } catch (err) {
            setError(err.message || 'Falha ao carregar partida');
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        // Validar gols
        const golsM = Number(golsMandante);
        const golsV = Number(golsVisitante);

        if (golsMandante !== '' && (isNaN(golsM) || golsM < 0)) {
            setError('Gols do mandante devem ser um número maior ou igual a 0');
            return false;
        }

        if (golsVisitante !== '' && (isNaN(golsV) || golsV < 0)) {
            setError('Gols do visitante devem ser um número maior ou igual a 0');
            return false;
        }

        // Validar data (formato DD/MM/AAAA)
        if (dataPartida) {
            const regex = /^\d{2}\/\d{2}\/\d{4}$/;
            if (!regex.test(dataPartida)) {
                setError('Data deve estar no formato DD/MM/AAAA');
                return false;
            }
        }

        // Verificar permissões
        if (partida?.status === 'Concluída' && !isAdm) {
            setError('Apenas administradores podem editar partidas concluídas');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const data = {
                golsMandante: golsMandante !== '' ? Number(golsMandante) : undefined,
                golsVisitante: golsVisitante !== '' ? Number(golsVisitante) : undefined,
                status,
                dataPartida: dataPartida || undefined,
                observacoes: observacoes || undefined,
            };

            const role = user?.role || '';
            await registrarPartida(Number(id), data, role);

            setSuccess('Resultado registrado com sucesso!');
            setTimeout(() => {
                navigate('/partidas');
            }, 1500);
        } catch (err) {
            setError(err.message || 'Falha ao registrar resultado');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !partida) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                Carregando partida...
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            {/* Cabeçalho */}
            <div>
                <Button
                    onClick={() => navigate('/partidas')}
                    variant="outline"
                    size="sm"
                    className="mb-2"
                >
                    ← Voltar para Partidas
                </Button>
                <h1 className="text-4xl font-bold text-versus-yellow">
                    Registrar Resultado
                </h1>
                <p className="text-sm text-muted-foreground mt-2">
                    Preencha os dados da partida
                </p>
            </div>

            {/* Informações da Partida */}
            {partida && (
                <div className="bg-card text-card-foreground p-6 rounded-lg shadow-lg border">
                    <h3 className="text-lg font-semibold mb-4 text-versus-yellow">
                        Informações da Partida
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-muted-foreground">Equipe Mandante:</span>
                            <p className="font-semibold">{partida.equipeMandante?.nome || '-'}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Equipe Visitante:</span>
                            <p className="font-semibold">{partida.equipeVisitante?.nome || '-'}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Torneio:</span>
                            <p className="font-semibold">{partida.torneio?.nome || '-'}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Fase/Grupo:</span>
                            <p className="font-semibold">{partida.fase || partida.grupo || '-'}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Mensagens */}
            {error && (
                <div className="p-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
                    {error}
                </div>
            )}
            {success && (
                <div className="p-4 text-sm text-green-500 bg-green-500/10 border border-green-500/20 rounded-md">
                    {success}
                </div>
            )}

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="bg-card text-card-foreground p-6 rounded-lg shadow-lg border space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="golsMandante">
                            Gols Mandante <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="golsMandante"
                            type="number"
                            min="0"
                            value={golsMandante}
                            onChange={(e) => setGolsMandante(e.target.value)}
                            placeholder="0"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="golsVisitante">
                            Gols Visitante <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="golsVisitante"
                            type="number"
                            min="0"
                            value={golsVisitante}
                            onChange={(e) => setGolsVisitante(e.target.value)}
                            placeholder="0"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">
                            Status <span className="text-red-500">*</span>
                        </Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger id="status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-background">
                                <SelectItem value="Marcada">Marcada</SelectItem>
                                <SelectItem value="Concluída">Concluída</SelectItem>
                                <SelectItem value="Cancelada">Cancelada</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="dataPartida">
                            Data da Partida (DD/MM/AAAA) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="dataPartida"
                            type="text"
                            value={dataPartida}
                            onChange={(e) => setDataPartida(e.target.value)}
                            placeholder="25/12/2025"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                        id="observacoes"
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        placeholder="Observações sobre a partida (opcional)..."
                        rows={4}
                    />
                </div>

                <div className="flex gap-4 justify-end">
                    <Button
                        type="button"
                        onClick={() => navigate('/partidas')}
                        variant="outline"
                    >
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Salvando...' : 'Salvar Resultado'}
                    </Button>
                </div>
            </form>
        </div>
    );
}

export default PartidaFormPage;
