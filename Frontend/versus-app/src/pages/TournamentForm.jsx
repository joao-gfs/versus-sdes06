import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createTorneio, getTorneioById, updateTorneio } from '../api/torneioApi';
import { listOrganizacoes } from '../api/organizacaoApi';

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

function TournamentForm() {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { user, hasRole, getOrganizacaoId } = useAuth();

  const [formData, setFormData] = useState({
    organizacaoId: '',
    nome: '',
    edicao: '',
    categoria: '',
    formato: '',
    criteriosDesempate: '',
    capacidadeMaxima: '',
    dataInicio: '',
    dataFim: '',
    status: 'em configuração',
  });

  const [organizacoes, setOrganizacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isAdm = hasRole('ADM');

  useEffect(() => {
    if (isAdm) {
      loadOrganizacoes();
    } else {
      const orgId = getOrganizacaoId();
      if (orgId) {
        setFormData(prev => ({ ...prev, organizacaoId: String(orgId) }));
      } else {
        // Se não tem organizacaoId, mostrar erro
        setError('Seu perfil de usuário não está associado a uma organização. Entre em contato com o administrador.');
      }
    }

    if (isEditMode) {
      loadTorneio();
    }
  }, [isEditMode, isAdm, user, getOrganizacaoId]);

  const loadOrganizacoes = async () => {
    try {
      const data = await listOrganizacoes();
      setOrganizacoes(data);
    } catch (err) {
      console.error('Erro ao carregar organizações', err);
    }
  };

  const loadTorneio = async () => {
    setLoading(true);
    try {
      const data = await getTorneioById(id);

      // Formatar datas para input type="date" (YYYY-MM-DD)
      const formatDate = (isoString) => {
        if (!isoString) return '';
        return new Date(isoString).toISOString().split('T')[0];
      };

      setFormData({
        organizacaoId: String(data.organizacaoId),
        nome: data.nome,
        edicao: data.edicao,
        categoria: data.categoria || '',
        formato: data.formato || '',
        criteriosDesempate: data.criteriosDesempate || '',
        capacidadeMaxima: data.capacidadeMaxima || '',
        dataInicio: formatDate(data.dataInicio),
        dataFim: formatDate(data.dataFim),
        status: data.status,
      });
    } catch (err) {
      setError('Erro ao carregar dados do torneio.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validar organizacaoId antes de enviar
      if (!formData.organizacaoId || formData.organizacaoId === '' || formData.organizacaoId === '0') {
        throw new Error('A organização é obrigatória. Verifique se você está associado a uma organização.');
      }

      const orgIdNumber = Number(formData.organizacaoId);
      if (!Number.isInteger(orgIdNumber) || orgIdNumber <= 0) {
        throw new Error('ID de organização inválido.');
      }

      const payload = {
        ...formData,
        organizacaoId: orgIdNumber,
        capacidadeMaxima: formData.capacidadeMaxima ? Number(formData.capacidadeMaxima) : undefined,
      };

      const role = user?.role || '';
      const orgId = user?.organizacaoId || null;

      if (isEditMode) {
        await updateTorneio(id, payload, role, orgId);
      } else {
        await createTorneio(payload);
      }

      navigate('/torneios');
    } catch (err) {
      setError(err.message || 'Erro ao salvar torneio.');
    } finally {
      setLoading(false);
    }
  };

  // Regra: Após publicado, não pode editar (exceto talvez status para encerrado?)
  // O requisito diz: "Após o torneio ser publicado, não é permitido fazer edições"
  // Vamos bloquear todos os campos se status != 'em configuração' e não for ADM?
  // Ou se status == 'publicado'.
  // Se estiver editando e o status original for publicado, deve bloquear.
  const isReadOnly = isEditMode && formData.status !== 'em configuração' && !isAdm;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-versus-yellow">
          {isEditMode ? 'Editar Torneio' : 'Novo Torneio'}
        </h1>
        <p className="text-muted-foreground">
          {isEditMode ? 'Atualize os dados do torneio' : 'Preencha os dados para criar um novo torneio'}
        </p>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-card p-6 rounded-lg shadow-lg border space-y-6">

        {/* Organização (Apenas ADM) */}
        {isAdm && (
          <div className="space-y-2">
            <Label htmlFor="organizacaoId">Organização</Label>
            <Select
              value={formData.organizacaoId}
              onValueChange={(val) => handleSelectChange('organizacaoId', val)}
              disabled={isEditMode || isReadOnly} // Geralmente não se muda a organização dona
            >
              <SelectTrigger id="organizacaoId">
                <SelectValue placeholder="Selecione a organização" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {organizacoes.map(org => (
                  <SelectItem key={org.id} value={String(org.id)}>{org.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Torneio</Label>
            <Input
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
              disabled={isReadOnly}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edicao">Edição / Temporada (AAAA)</Label>
            <Input
              id="edicao"
              name="edicao"
              value={formData.edicao}
              onChange={handleChange}
              placeholder="Ex: 2025"
              required
              pattern="\d{4}"
              disabled={isReadOnly}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Select
              value={formData.categoria}
              onValueChange={(val) => handleSelectChange('categoria', val)}
              disabled={isReadOnly}
            >
              <SelectTrigger id="categoria">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="Sub-11">Sub-11</SelectItem>
                <SelectItem value="Sub-13">Sub-13</SelectItem>
                <SelectItem value="Sub-15">Sub-15</SelectItem>
                <SelectItem value="Sub-17">Sub-17</SelectItem>
                <SelectItem value="Sub-20">Sub-20</SelectItem>
                <SelectItem value="Adulto">Adulto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="formato">Formato</Label>
            <Select
              value={formData.formato}
              onValueChange={(val) => handleSelectChange('formato', val)}
              disabled={isReadOnly}
            >
              <SelectTrigger id="formato">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="Liga">Liga</SelectItem>
                <SelectItem value="Fase de grupos">Fase de grupos</SelectItem>
                <SelectItem value="Mata-mata">Mata-mata</SelectItem>
                <SelectItem value="Grupos + Mata-mata">Grupos + Mata-mata</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dataInicio">Data de Início</Label>
            <Input
              id="dataInicio"
              name="dataInicio"
              type="date"
              value={formData.dataInicio}
              onChange={handleChange}
              required
              disabled={isReadOnly}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataFim">Data de Término</Label>
            <Input
              id="dataFim"
              name="dataFim"
              type="date"
              value={formData.dataFim}
              onChange={handleChange}
              required
              disabled={isReadOnly}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="capacidadeMaxima">Capacidade Máxima de Equipes</Label>
          <Input
            id="capacidadeMaxima"
            name="capacidadeMaxima"
            type="number"
            value={formData.capacidadeMaxima}
            onChange={handleChange}
            placeholder="Opcional"
            disabled={isReadOnly}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="criteriosDesempate">Critérios de Desempate</Label>
          <Textarea
            id="criteriosDesempate"
            name="criteriosDesempate"
            value={formData.criteriosDesempate}
            onChange={handleChange}
            placeholder="Ex: Saldo de gols, Confronto direto..."
            disabled={isReadOnly}
          />
        </div>

        {/* Status - Apenas na edição */}
        {isEditMode && (
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(val) => handleSelectChange('status', val)}
              disabled={isReadOnly && !isAdm} // Se for readOnly (publicado), talvez nem status possa mudar?
            // Requisito: "Após o torneio ser publicado, não é permitido fazer edições"
            // Mas talvez mudar para encerrado?
            // Vamos assumir que se for publicado, só pode mudar para encerrado.
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="em configuração">Em Configuração</SelectItem>
                <SelectItem value="publicado">Publicado</SelectItem>
                <SelectItem value="encerrado">Encerrado</SelectItem>
              </SelectContent>
            </Select>
            {isReadOnly && (
              <p className="text-xs text-yellow-500">
                Torneios publicados não podem ser editados.
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/torneios')}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || (isReadOnly && !isAdm)}
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default TournamentForm;
