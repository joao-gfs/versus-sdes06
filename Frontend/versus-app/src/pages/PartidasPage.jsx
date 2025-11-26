import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listPartidas } from '../api/partidaApi';
import { listTorneios } from '../api/torneioApi';

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

function PartidasPage() {
    const [partidas, setPartidas] = useState([]);
    const [torneios, setTorneios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Filtros
    const [filtroTorneio, setFiltroTorneio] = useState('ALL');
    const [filtroEquipe, setFiltroEquipe] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('ALL');
    const [filtroData, setFiltroData] = useState('');

    const { user, hasRole } = useAuth();
    const navigate = useNavigate();

    const isAdm = hasRole('ADM');
    const isOrg = hasRole('ORG');

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        loadPartidas();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtroTorneio, filtroStatus]);

    const loadData = async () => {
        setLoading(true);
        try {
            const torneiosData = await listTorneios();
            setTorneios(torneiosData);
            await loadPartidas();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadPartidas = async () => {
        setLoading(true);
        setError(null);
        try {
            const filters = {
                torneioId: filtroTorneio !== 'ALL' ? filtroTorneio : undefined,
                equipe: filtroEquipe || undefined,
                status: filtroStatus !== 'ALL' ? filtroStatus : undefined,
                dataPartida: filtroData || undefined,
            };

            const role = user?.role || '';
            const orgId = user?.organizacaoId || null;
            const equipeId = user?.equipeId || null;

            const data = await listPartidas(filters, role, orgId, equipeId);
            setPartidas(data);
        } catch (err) {
            setError(err.message || 'Falha ao carregar partidas');
        } finally {
            setLoading(false);
        }
    };

    const handleBuscar = () => {
        loadPartidas();
    };

    const handleLimparFiltros = () => {
        setFiltroTorneio('ALL');
        setFiltroEquipe('');
        setFiltroStatus('ALL');
        setFiltroData('');
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

    const canEditPartida = (partida) => {
        if (isAdm) return true;
        if (isOrg && partida.status !== 'Concluída') return true;
        return false;
    };

    return (
        <div className="space-y-6">
            {/* Cabeçalho */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold text-versus-yellow">Partidas</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Gerencie os resultados das partidas dos torneios
                    </p>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-card text-card-foreground p-6 rounded-lg shadow-lg border">
                <h3 className="text-lg font-semibold mb-4 text-versus-yellow">Filtros</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="filtroTorneio">Torneio</Label>
                        <Select value={filtroTorneio} onValueChange={setFiltroTorneio}>
                            <SelectTrigger id="filtroTorneio">
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent className="bg-background">
                                <SelectItem value="ALL">Todos</SelectItem>
                                {torneios.map((t) => (
                                    <SelectItem key={t.id} value={String(t.id)}>
                                        {t.nome} - {t.edicao}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="filtroEquipe">Equipe</Label>
                        <Input
                            id="filtroEquipe"
                            value={filtroEquipe}
                            onChange={(e) => setFiltroEquipe(e.target.value)}
                            placeholder="Nome da equipe..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="filtroStatus">Status</Label>
                        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                            <SelectTrigger id="filtroStatus">
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent className="bg-background">
                                <SelectItem value="ALL">Todos</SelectItem>
                                <SelectItem value="Marcada">Marcada</SelectItem>
                                <SelectItem value="Concluída">Concluída</SelectItem>
                                <SelectItem value="Cancelada">Cancelada</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="filtroData">Data (DD/MM/AAAA)</Label>
                        <Input
                            id="filtroData"
                            value={filtroData}
                            onChange={(e) => setFiltroData(e.target.value)}
                            placeholder="Ex: 25/12/2025"
                        />
                    </div>

                    <div className="flex items-end gap-2 md:col-span-2 lg:col-span-4">
                        <Button onClick={handleBuscar} variant="secondary" className="w-full md:w-auto">
                            Buscar
                        </Button>
                        <Button onClick={handleLimparFiltros} variant="outline" className="w-full md:w-auto">
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

            {/* Tabela */}
            <div className="bg-card text-card-foreground rounded-lg shadow-lg border overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-muted-foreground">Carregando partidas...</div>
                ) : partidas.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">Nenhuma partida encontrada.</div>
                ) : (
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
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {partidas.map((p) => (
                                    <TableRow key={p.id}>
                                        <TableCell className="font-semibold">
                                            {p.equipeMandante?.nome || '-'}
                                        </TableCell>
                                        <TableCell className="text-center font-bold">
                                            {p.golsMandante ?? '-'}
                                        </TableCell>
                                        <TableCell className="text-center text-muted-foreground">
                                            x
                                        </TableCell>
                                        <TableCell className="text-center font-bold">
                                            {p.golsVisitante ?? '-'}
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            {p.equipeVisitante?.nome || '-'}
                                        </TableCell>
                                        <TableCell>{formatDate(p.dataPartida)}</TableCell>
                                        <TableCell className={getStatusColor(p.status)}>
                                            {p.status}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {p.observacoes || '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {canEditPartida(p) && (
                                                <Button
                                                    onClick={() => navigate(`/partidas/${p.id}/registrar`)}
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    Registrar Resultado
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* Resumo */}
            {!loading && (
                <div className="text-sm text-muted-foreground text-center">
                    Mostrando {partidas.length} partida(s)
                </div>
            )}
        </div>
    );
}

export default PartidasPage;
