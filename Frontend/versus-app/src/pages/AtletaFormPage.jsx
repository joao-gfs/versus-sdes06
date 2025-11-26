import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createAtleta, getAtletaById, updateAtleta } from '../api/atletaApi';
import { listEquipes } from '../api/equipeApi';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const POSICOES = ['Goleiro', 'Zagueiro', 'Meio-campo', 'Atacante'];

function AtletaFormPage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { hasAnyRole, getEquipeId } = useAuth();

  // fields
  const [equipeId, setEquipeId] = useState('');
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState(''); // DD/MM/AAAA
  const [documento, setDocumento] = useState(''); // CPF
  const [posicao, setPosicao] = useState('');
  const [numeroCamisa, setNumeroCamisa] = useState('');
  const [status, setStatus] = useState('ativo');

  const [equipes, setEquipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (isEditMode) {
      // Editar: TEC, ADM
      if (!hasAnyRole(['ADM', 'TEC'])) {
        navigate('/');
      }
    } else {
      // Criar: ORG, TEC, EMP, ADM
      if (!hasAnyRole(['ADM', 'ORG', 'TEC', 'EMP'])) {
        navigate('/');
      }
    }
  }, [hasAnyRole, navigate, isEditMode]);

  useEffect(() => {
    const loadEquipes = async () => {
      try {
        const data = await listEquipes();
        setEquipes(data);
      } catch {}
    };
    loadEquipes();
  }, []);

  // se TEC, pré-selecionar e travar equipe
  const tecEquipeId = getEquipeId();
  useEffect(() => {
    if (!isEditMode && tecEquipeId) setEquipeId(String(tecEquipeId));
  }, [tecEquipeId, isEditMode]);

  useEffect(() => {
    const loadAtleta = async () => {
      if (!isEditMode) return;
      setLoadingData(true); setError(null);
      try {
        const a = await getAtletaById(Number(id));
        setNome(a.nome || '');
        setEquipeId(a.equipeId ? String(a.equipeId) : '');
        // a.dataNascimento não vem no payload da lista; manter edição sem mudar a data
        setPosicao(a.posicao || '');
        setNumeroCamisa(a.numeroCamisa ? String(a.numeroCamisa) : '');
        setStatus(a.status || 'ativo');
      } catch (err) {
        setError(err.message || 'Falha ao carregar atleta');
      } finally {
        setLoadingData(false);
      }
    };
    loadAtleta();
  }, [id, isEditMode]);

  const formatCPF = (value) => {
    const digits = (value || '').replace(/\D/g, '').slice(0, 11);
    const part1 = digits.slice(0, 3);
    const part2 = digits.slice(3, 6);
    const part3 = digits.slice(6, 9);
    const part4 = digits.slice(9, 11);
    let res = part1;
    if (part2) res += '.' + part2;
    if (part3) res += '.' + part3;
    if (part4) res += '-' + part4;
    return res;
  };

  const handleDocumentoChange = (e) => setDocumento(formatCPF(e.target.value));

  const formatData = (value) => {
    const digits = (value || '').replace(/\D/g, '').slice(0, 8);
    const dd = digits.slice(0, 2);
    const mm = digits.slice(2, 4);
    const yyyy = digits.slice(4, 8);
    let res = dd;
    if (mm) res += '/' + mm;
    if (yyyy) res += '/' + yyyy;
    return res;
  };
  const handleDataChange = (e) => setDataNascimento(formatData(e.target.value));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(null); setSuccess(null);

    if (!nome.trim()) return setError('Nome completo é obrigatório');
    if (!equipeId) return setError('Equipe é obrigatória');

    try {
      setLoading(true);
      if (isEditMode) {
        const payload = {
          nome: nome.trim(),
          posicao: posicao || null,
          numeroCamisa: numeroCamisa ? Number(numeroCamisa) : null,
          status,
          equipeId: Number(equipeId),
        };
        await updateAtleta(Number(id), payload);
        setSuccess('Atleta atualizado com sucesso!');
      } else {
        if (!documento.trim()) return setError('CPF é obrigatório');
        if (!dataNascimento.trim()) return setError('Data de nascimento é obrigatória');
        const payload = {
          equipeId: Number(equipeId),
          nome: nome.trim(),
          dataNascimento,
          documento: documento.replace(/\D/g, ''),
          posicao: posicao || undefined,
          numeroCamisa: numeroCamisa ? Number(numeroCamisa) : undefined,
        };
        await createAtleta(payload);
        setSuccess('Atleta criado com sucesso!');
      }
      setTimeout(() => navigate('/atletas'), 1500);
    } catch (err) {
      setError(err.message || `Falha ao ${isEditMode ? 'atualizar' : 'criar'} atleta`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return <div className="flex items-center justify-center py-12"><div className="text-xl text-muted-foreground">Carregando dados...</div></div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="p-8 space-y-6 bg-card text-card-foreground rounded-lg shadow-lg border">
        <div>
          <h2 className="text-3xl font-bold text-versus-yellow">{isEditMode ? 'Editar Atleta' : 'Novo Atleta'}</h2>
          <p className="text-sm text-muted-foreground mt-2">{isEditMode ? 'Atualize os dados do atleta' : 'Preencha os dados para cadastrar um atleta'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Equipe */}
          <div className="space-y-2">
            <Label htmlFor="equipe">Equipe *</Label>
            <Select value={equipeId} onValueChange={setEquipeId} disabled={!!tecEquipeId}>
              <SelectTrigger id="equipe"><SelectValue placeholder="Selecione uma equipe" /></SelectTrigger>
              <SelectContent className="bg-background">
                {equipes.map(eq => <SelectItem key={eq.id} value={String(eq.id)}>{eq.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome completo *</Label>
            <Input id="nome" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: João da Silva" required />
          </div>

          {/* Data nasc e CPF (somente criação) */}
          {!isEditMode && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data">Data de nascimento *</Label>
                <Input id="data" value={dataNascimento} onChange={handleDataChange} placeholder="DD/MM/AAAA" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input id="cpf" value={documento} onChange={handleDocumentoChange} placeholder="000.000.000-00" />
              </div>
            </div>
          )}

          {/* Posição e Número */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="posicao">Posição</Label>
              <Select value={posicao} onValueChange={setPosicao}>
                <SelectTrigger id="posicao"><SelectValue placeholder="Selecione a posição" /></SelectTrigger>
                <SelectContent className="bg-background">
                  {POSICOES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="numero">Número da camisa</Label>
              <Input id="numero" type="number" min="1" max="99" value={numeroCamisa} onChange={e => setNumeroCamisa(e.target.value)} placeholder="1 a 99" />
            </div>
          </div>

          {/* Telefone e Status (status só em edição) */}
          {isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {error && <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">{error}</div>}
          {success && <div className="p-3 text-sm text-green-500 bg-green-500/10 border border-green-500/20 rounded-md">{success}</div>}

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading} className="flex-1 font-bold">{loading ? (isEditMode ? 'Salvando...' : 'Criando...') : (isEditMode ? 'Salvar Alterações' : 'Criar Atleta')}</Button>
            <Button type="button" variant="outline" className="flex-1" disabled={loading} onClick={() => navigate('/atletas')}>Cancelar</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AtletaFormPage;
