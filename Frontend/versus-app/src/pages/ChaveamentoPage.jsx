import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { consultarChaveamento, getTorneioById } from '../api/torneioApi';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../components/ui/table';

function ChaveamentoPage() {
    const { id } = useParams();
    const [torneio, setTorneio] = useState(null);
    const [chaveamento, setChaveamento] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Filtros
    const [filtroEquipe, setFiltroEquipe] = useState('');
    const [ordenacao, setOrdenacao] = useState('fase');

    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
        if (id) {
            loadChaveamento();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ordenacao]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const torneioData = await getTorneioById(Number(id));
            setTorneio(torneioData);
            await loadChaveamento();
        } catch (err) {
            setError(err.message || 'Falha ao carregar dados do torneio');
        } finally {
            setLoading(false);
        }
    };

    const loadChaveamento = async () => {
        setLoading(true);
        setError(null);
        try {
            const filters = {
                ordenacao,
                equipe: filtroEquipe || undefined,
            };

            const data = await consultarChaveamento(Number(id), filters);
            setChaveamento(data);
        } catch (err) {
            setError(err.message || 'Falha ao carregar chaveamento');
        } finally {
            setLoading(false);
        }
    };

    const handleBuscar = () => {
        loadChaveamento();
    };

    const handleLimparFiltros = () => {
        setFiltroEquipe('');
        setOrdenacao('fase');
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Concluída': return 'text-green-500';
            case 'Cancelada': return 'text-red-500';
            case 'Marcada': return 'text-yellow-500';
            default: return 'text-foreground';
        }
    };



    return (
        <div className="space-y-6">
            {/* Cabeçalho */}
            <div className="flex justify-between items-center">
                <div>
                    <Button
                        onClick={() => navigate('/torneios')}
                        variant="outline"
                        size="sm"
                        className="mb-2"
                    >
                        ← Voltar para Torneios
                    </Button>
                    <h1 className="text-4xl font-bold text-versus-yellow">
                        Chaveamento - {torneio?.nome}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Edição: {torneio?.edicao} | Formato: {torneio?.formato} | Status: {torneio?.status}
                    </p>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-card text-card-foreground p-6 rounded-lg shadow-lg border">
                <h3 className="text-lg font-semibold mb-4 text-versus-yellow">Filtros</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="filtroEquipe">Buscar Equipe</Label>
                        <Input
                            id="filtroEquipe"
                            value={filtroEquipe}
                            onChange={(e) => setFiltroEquipe(e.target.value)}
                            placeholder="Nome da equipe..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="ordenacao">Ordenar por</Label>
                        <Select value={ordenacao} onValueChange={setOrdenacao}>
                            <SelectTrigger id="ordenacao">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-background">
                                <SelectItem value="fase">Fase</SelectItem>
                                <SelectItem value="grupo">Grupo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-end gap-2">
                        <Button onClick={handleBuscar} variant="secondary" className="w-full">
                            Buscar
                        </Button>
                        <Button onClick={handleLimparFiltros} variant="outline" className="w-full">
                            Limpar
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mensagens */}
            {error && (
                <div className="p-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
                    {error}
                </div>
            )}

            {/* Chaveamento */}
            {loading ? (
                <div className="p-8 text-center text-muted-foreground">
                    Carregando chaveamento...
                </div>
            ) : !chaveamento || !chaveamento.chaveamento || chaveamento.chaveamento.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground bg-card rounded-lg border">
                    Nenhuma partida encontrada para este torneio.
                </div>
            ) : (
                <div className="space-y-6">
                    {chaveamento.chaveamento.map((grupoObj, index) => (
                        <div key={index} className="bg-card text-card-foreground rounded-lg shadow-lg border overflow-hidden">
                            <div className="bg-versus-yellow/10 px-6 py-3 border-b">
                                <h3 className="text-lg font-semibold text-versus-yellow">
                                    {grupoObj.fase} {grupoObj.grupo !== 'Único' ? `- Grupo ${grupoObj.grupo}` : ''}
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Equipe Mandante</TableHead>
                                            <TableHead className="text-center">Gols</TableHead>
                                            <TableHead className="text-center">x</TableHead>
                                            <TableHead className="text-center">Gols</TableHead>
                                            <TableHead>Equipe Visitante</TableHead>
                                            <TableHead>Data</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Observações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {grupoObj.partidas.map((partida) => (
                                            <TableRow key={partida.id}>
                                                <TableCell className="font-semibold">
                                                    {partida.equipeA?.nome || '-'}
                                                </TableCell>
                                                <TableCell className="text-center font-bold">
                                                    {partida.placarA ?? '-'}
                                                </TableCell>
                                                <TableCell className="text-center text-muted-foreground">
                                                    x
                                                </TableCell>
                                                <TableCell className="text-center font-bold">
                                                    {partida.placarB ?? '-'}
                                                </TableCell>
                                                <TableCell className="font-semibold">
                                                    {partida.equipeB?.nome || '-'}
                                                </TableCell>
                                                <TableCell>{formatDate(partida.dataJogo)}</TableCell>
                                                <TableCell className={getStatusColor(partida.status)}>
                                                    {partida.status}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {partida.observacoes || '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Resumo */}
            {!loading && chaveamento?.chaveamento && (
                <div className="text-sm text-muted-foreground text-center">
                    Total de grupos/fases: {chaveamento.chaveamento.length}
                </div>
            )}
        </div>
    );
}

export default ChaveamentoPage;
