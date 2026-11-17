import React, { useState, useEffect } from 'react';
import {
  Home, Users, Wine, DollarSign, BookOpen, Music, HeartHandshake, Bell,
  LogOut, Copy, ExternalLink, Calendar, Cake, Shield,
  HeartPulse, Sparkles, Trash2, Send, MessageCircle,
  AlertCircle, CheckCircle2, Lock, Mail, Clock, RefreshCw, BookmarkPlus,
  Check, X, Pencil, PlusCircle, ArrowUpDown
} from 'lucide-react';
import { supabase, isConfigured } from './supabaseClient';

const MES_ATUAL = new Date().toISOString().slice(0, 7);
const MES_NUMERO = new Date().getMonth() + 1;

const MODULOS_PERMISSAO = [
  { id: 'cadastros', label: 'Gestão de Cadastros (Médiuns)' },
  { id: 'caixinha', label: 'Gestão da Caixinha (Doações)' },
  { id: 'bebidas', label: 'Gestão de Bebidas (R$ 10)' },
  { id: 'biblioteca', label: 'Gestão da Biblioteca' },
  { id: 'curimba', label: 'Curadoria da Curimba' },
];

const LINHAS_CURIMBA_PADRAO = [
  'Abertura / Defumação',
  'Oxalá',
  'Caboclos',
  'Pretos-Velhos',
  'Erês / Crianças',
  'Boiadeiros',
  'Marinheiros',
  'Baianos',
  'Ciganos',
  'Mestres',
  'Mestras',
  'Exu',
  'Pombagira',
  'Encerramento'
];

const LINHAS_ENTIDADE_PADRAO = [
  'Caboclo(a)',
  'Preto(a)-Velho(a)',
  'Erê / Criança',
  'Boiadeiro',
  'Marinheiro',
  'Baiano(a)',
  'Cigano(a)',
  'Mestre',
  'Mestra',
  'Exu',
  'Pombagira'
];

const CATEGORIAS_BIBLIOTECA_PADRAO = [
  'Fundamentos',
  'Mediunidade',
  'Ervas & Banhos',
  'Orixás & Linhas',
  'História & Teologia'
];

const CATEGORIAS_CAIXINHA_PADRAO = [
  'Manutenção & Velas',
  'Festas & Obrigações',
  'Obras & Reformas',
  'Caridade & Ação Social'
];

export default function App() {
  const [session, setSession] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authNome, setAuthNome] = useState('');
  const [authTelefone, setAuthTelefone] = useState('');
  const [authNascimento, setAuthNascimento] = useState('');
  const [authError, setAuthError] = useState('');

  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [toast, setToast] = useState('');

  const [mediums, setMediums] = useState([]);
  const [bebidas, setBebidas] = useState([]);
  const [financeiro, setFinanceiro] = useState([]);
  const [campanhas, setCampanhas] = useState([]);
  const [livros, setLivros] = useState([]);
  const [pontos, setPontos] = useState([]);
  const [giras, setGiras] = useState([]);
  const [notificacoes, setNotificacoes] = useState([]);
  const [listasCustom, setListasCustom] = useState([]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3800);
  };

  useEffect(() => {
    if (!isConfigured) {
      setLoadingAuth(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadAllData(session.user);
      else setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadAllData(session.user);
      else {
        setCurrentUserProfile(null);
        setLoadingAuth(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadAllData = async (user) => {
    setLoadingAuth(true);
    try {
      const [
        resMediums, resBebidas, resFin, resCamp, resLivros, resPontos, resGiras, resNotif, resListas
      ] = await Promise.all([
        supabase.from('mediums').select('*').order('nome'),
        supabase.from('caixinha_bebidas').select('*').eq('mes_referencia', MES_ATUAL),
        supabase.from('financeiro').select('*').order('data_movimento', { ascending: false }),
        supabase.from('campanhas_doacao').select('*').eq('ativa', true).order('created_at', { ascending: false }),
        supabase.from('biblioteca').select('*').order('titulo'),
        supabase.from('curimba_pontos').select('*').order('created_at', { ascending: false }),
        supabase.from('calendario_giras').select('*').order('data_gira'),
        supabase.from('notificacoes').select('*').order('created_at', { ascending: false }),
        supabase.from('configuracoes_listas').select('*').order('created_at'),
      ]);

      const allMediums = resMediums.data || [];
      setMediums(allMediums);
      setBebidas(resBebidas.data || []);
      setFinanceiro(resFin.data || []);
      setCampanhas(resCamp.data || []);
      setLivros(resLivros.data || []);
      setPontos(resPontos.data || []);
      setGiras(resGiras.data || []);
      setNotificacoes(resNotif.data || []);
      setListasCustom(resListas.data || []);

      let myProfile = allMediums.find(m => m.user_id === user.id || m.email === user.email);
      if (!myProfile) {
        const isFirstUser = allMediums.length === 0;
        const newProfile = {
          user_id: user.id,
          nome: user.user_metadata?.nome || user.email.split('@')[0],
          email: user.email,
          telefone: user.user_metadata?.telefone || '',
          data_nascimento: user.user_metadata?.data_nascimento || null,
          cargo: isFirstUser ? 'Administração Geral' : 'Médium de Corrente',
          nivel_acesso: isFirstUser ? 'admin' : 'medium',
          permissoes: [],
          ritos: [],
          entidades: []
        };
        const { data: inserted } = await supabase.from('mediums').insert([newProfile]).select().single();
        if (inserted) {
          myProfile = inserted;
          setMediums([inserted, ...allMediums]);
        }
      } else if (!myProfile.user_id) {
        await supabase.from('mediums').update({ user_id: user.id }).eq('id', myProfile.id);
      }
      setCurrentUserProfile(myProfile);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAuth(false);
    }
  };

  const adicionarItemLista = async (tipo, valor) => {
    const limpo = valor.trim();
    if (!limpo) return;
    const { data, error } = await supabase
      .from('configuracoes_listas')
      .insert([{ tipo, valor: limpo }])
      .select()
      .single();
    if (!error && data) {
      setListasCustom([...listasCustom, data]);
      showToast(`"${limpo}" adicionado às opções!`);
    }
  };

  const removerItemLista = async (id) => {
    await supabase.from('configuracoes_listas').delete().eq('id', id);
    setListasCustom(listasCustom.filter(l => l.id !== id));
    showToast('Opção removida.');
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (authMode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });
      if (error) setAuthError('E-mail ou senha incorretos. Verifique seus dados.');
    } else {
      const { error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
        options: {
          data: {
            nome: authNome,
            telefone: authTelefone,
            data_nascimento: authNascimento || null
          }
        }
      });
      if (error) setAuthError(error.message);
      else showToast('Conta criada com sucesso! Bem-vindo(a) à Casa Bendizer.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50 p-6">
        <div className="max-w-md bg-white rounded-2xl shadow-lg p-8 border border-amber-200 text-center">
          <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-stone-800 mb-2">Configuração Pendente</h1>
          <p className="text-sm text-stone-600">
            As chaves <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> ainda não foram configuradas.
          </p>
        </div>
      </div>
    );
  }

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <Sparkles className="w-10 h-10 text-emerald-700 animate-pulse mx-auto mb-2" />
          <p className="text-stone-600 font-medium">Abrindo os trabalhos da Casa Bendizer...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-stone-900 to-amber-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-emerald-900 p-8 text-center text-white">
            <div className="w-14 h-14 bg-amber-400/20 border border-amber-300/40 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-7 h-7 text-amber-300" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Casa Bendizer</h1>
            <p className="text-emerald-200 text-sm mt-1">Portal de Gestão e Corrente Mediúnica</p>
          </div>

          <div className="p-8">
            <div className="flex bg-stone-100 p-1 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setAuthError(''); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${authMode === 'login' ? 'bg-white text-emerald-900 shadow-sm' : 'text-stone-500'}`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('signup'); setAuthError(''); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${authMode === 'signup' ? 'bg-white text-emerald-900 shadow-sm' : 'text-stone-500'}`}
              >
                Primeiro Acesso
              </button>
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">Nome Completo</label>
                    <input
                      type="text"
                      required
                      value={authNome}
                      onChange={e => setAuthNome(e.target.value)}
                      placeholder="Seu nome completo"
                      className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">WhatsApp</label>
                      <input
                        type="text"
                        value={authTelefone}
                        onChange={e => setAuthTelefone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">Nascimento</label>
                      <input
                        type="date"
                        value={authNascimento}
                        onChange={e => setAuthNascimento(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">E-mail</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full pl-10 pr-3.5 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Senha</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-10 pr-3.5 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-xl text-sm transition shadow-md"
              >
                {authMode === 'login' ? 'Entrar na Plataforma' : 'Criar Minha Conta'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Permissões separadas por setor
  const role = currentUserProfile?.nivel_acesso || 'medium';
  const perms = currentUserProfile?.permissoes || [];
  const isAdmin = role === 'admin';
  const isSecretaria = role === 'secretaria';

  const canCadastros = isAdmin || isSecretaria || perms.includes('cadastros');
  const canCaixinha = isAdmin || isSecretaria || perms.includes('caixinha');
  const canBebidas = isAdmin || isSecretaria || perms.includes('bebidas');
  const canBiblioteca = isAdmin || isSecretaria || perms.includes('biblioteca');
  const canCurimba = isAdmin || isSecretaria || perms.includes('curimba');

  // Listas dinâmicas combinando padrão + cadastradas pelo Admin Geral
  const linhasCurimba = Array.from(new Set([
    ...LINHAS_CURIMBA_PADRAO,
    ...listasCustom.filter(l => l.tipo === 'linha_curimba').map(l => l.valor)
  ]));

  const linhasEntidade = Array.from(new Set([
    ...LINHAS_ENTIDADE_PADRAO,
    ...listasCustom.filter(l => l.tipo === 'linha_entidade').map(l => l.valor)
  ]));

  const categoriasBiblioteca = Array.from(new Set([
    ...CATEGORIAS_BIBLIOTECA_PADRAO,
    ...listasCustom.filter(l => l.tipo === 'categoria_biblioteca').map(l => l.valor)
  ]));

  const categoriasCaixinha = Array.from(new Set([
    ...CATEGORIAS_CAIXINHA_PADRAO,
    ...listasCustom.filter(l => l.tipo === 'categoria_caixinha').map(l => l.valor)
  ]));

  const navItems = [
    { id: 'home', label: 'Início', icon: Home },
    { id: 'mediums', label: canCadastros ? 'Médiuns' : 'Minha Ficha', icon: Users },
    ...(canBebidas ? [{ id: 'bebidas', label: 'Bebidas (R$ 10)', icon: Wine }] : []),
    ...(canCaixinha ? [{ id: 'financeiro', label: 'Livro Caixa', icon: DollarSign }] : []),
    { id: 'doacoes', label: 'Caixinha', icon: HeartHandshake },
    { id: 'curimba', label: 'Curimba', icon: Music },
    { id: 'biblioteca', label: 'Biblioteca', icon: BookOpen },
    { id: 'mensagens', label: 'Avisos', icon: Bell },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 text-amber-300" />
          {toast}
        </div>
      )}

      <header className="bg-emerald-950 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Casa Bendizer</h1>
              <p className="text-xs text-emerald-300">
                Olá, {currentUserProfile?.nome} •{' '}
                <span className="uppercase font-semibold text-amber-300">
                  {isAdmin ? 'Admin Geral' : isSecretaria ? 'Secretaria' : perms.length > 0 ? 'Médium / Equipe' : 'Médium'}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs bg-emerald-900 hover:bg-emerald-800 px-3 py-2 rounded-lg text-emerald-100 transition"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>

        <nav className="bg-emerald-900/80 border-t border-emerald-800/80 overflow-x-auto">
          <div className="max-w-7xl mx-auto px-4 flex gap-1 py-1.5">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    active
                      ? 'bg-amber-400 text-emerald-950 shadow-sm'
                      : 'text-emerald-100 hover:bg-emerald-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {activeTab === 'home' && (
          <HomeTab
            giras={giras}
            setGiras={setGiras}
            mediums={mediums}
            bebidas={bebidas}
            campanhas={campanhas}
            notificacoes={notificacoes}
            canCadastros={canCadastros}
            canBebidas={canBebidas}
            showToast={showToast}
          />
        )}
        {activeTab === 'mediums' && (
          <MediumsTab
            mediums={mediums}
            setMediums={setMediums}
            currentUser={currentUserProfile}
            setCurrentUser={setCurrentUserProfile}
            isAdmin={isAdmin}
            canCadastros={canCadastros}
            linhasEntidade={linhasEntidade}
            listasCustom={listasCustom}
            onAddLista={adicionarItemLista}
            onRemoveLista={removerItemLista}
            showToast={showToast}
          />
        )}
        {activeTab === 'bebidas' && canBebidas && (
          <BebidasTab
            mediums={mediums}
            bebidas={bebidas}
            setBebidas={setBebidas}
            financeiro={financeiro}
            setFinanceiro={setFinanceiro}
            currentUser={currentUserProfile}
            showToast={showToast}
          />
        )}
        {activeTab === 'financeiro' && canCaixinha && (
          <FinanceiroTab
            financeiro={financeiro}
            setFinanceiro={setFinanceiro}
            currentUser={currentUserProfile}
            showToast={showToast}
          />
        )}
        {activeTab === 'doacoes' && (
          <DoacoesTab
            campanhas={campanhas}
            setCampanhas={setCampanhas}
            financeiro={financeiro}
            setFinanceiro={setFinanceiro}
            currentUser={currentUserProfile}
            isAdmin={isAdmin}
            canCaixinha={canCaixinha}
            categoriasCaixinha={categoriasCaixinha}
            listasCustom={listasCustom}
            onAddLista={adicionarItemLista}
            onRemoveLista={removerItemLista}
            showToast={showToast}
          />
        )}
        {activeTab === 'curimba' && (
          <CurimbaTab
            pontos={pontos}
            setPontos={setPontos}
            currentUser={currentUserProfile}
            isAdmin={isAdmin}
            canCurimba={canCurimba}
            linhasCurimba={linhasCurimba}
            listasCustom={listasCustom}
            onAddLista={adicionarItemLista}
            onRemoveLista={removerItemLista}
            showToast={showToast}
          />
        )}
        {activeTab === 'biblioteca' && (
          <BibliotecaTab
            livros={livros}
            setLivros={setLivros}
            mediums={mediums}
            notificacoes={notificacoes}
            setNotificacoes={setNotificacoes}
            currentUser={currentUserProfile}
            isAdmin={isAdmin}
            canBiblioteca={canBiblioteca}
            categoriasBiblioteca={categoriasBiblioteca}
            listasCustom={listasCustom}
            onAddLista={adicionarItemLista}
            onRemoveLista={removerItemLista}
            showToast={showToast}
          />
        )}
        {activeTab === 'mensagens' && (
          <MensagensTab
            notificacoes={notificacoes}
            setNotificacoes={setNotificacoes}
            mediums={mediums}
            bebidas={bebidas}
            canCadastros={canCadastros}
            canBebidas={canBebidas}
            showToast={showToast}
          />
        )}
      </main>
    </div>
  );
}

/* ===================== COMPONENTE AUXILIAR: GERENCIAR OPÇÕES (ADMIN) ===================== */
function AdminListaManager({ titulo, tipo, listasCustom, onAddLista, onRemoveLista }) {
  const [novoValor, setNovoValor] = useState('');
  const itensCustom = listasCustom.filter(l => l.tipo === tipo);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!novoValor.trim()) return;
    onAddLista(tipo, novoValor);
    setNovoValor('');
  };

  return (
    <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
          <PlusCircle className="w-4 h-4 text-emerald-700" />
          {titulo} (Admin Geral)
        </p>
      </div>
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={novoValor}
          onChange={e => setNovoValor(e.target.value)}
          placeholder="Digite o nome da nova opção..."
          className="flex-1 px-3 py-1.5 border border-emerald-200 rounded-xl text-xs bg-white"
        />
        <button type="submit" className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-xl">
          + Criar Opção
        </button>
      </form>
      {itensCustom.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {itensCustom.map(item => (
            <span key={item.id} className="inline-flex items-center gap-1.5 bg-white border border-emerald-200 text-emerald-900 px-2.5 py-1 rounded-lg text-[11px] font-medium">
              {item.valor}
              <button type="button" onClick={() => onRemoveLista(item.id)} className="text-rose-500 hover:text-rose-700 font-bold">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===================== 1. ABA INÍCIO (HOME) ===================== */
function HomeTab({ giras, setGiras, mediums, bebidas, campanhas, notificacoes, canCadastros, canBebidas, showToast }) {
  const [novaGira, setNovaGira] = useState({ titulo: '', data_gira: '', horario: '19:30', tipo: 'Gira de Atendimento' });

  const aniversariantes = mediums.filter(m => {
    if (!m.data_nascimento) return false;
    const mes = parseInt(m.data_nascimento.split('-')[1], 10);
    return mes === MES_NUMERO;
  });

  const totalBebidasPagas = bebidas.filter(b => b.pago).length;
  const totalCaixinha = campanhas.reduce((acc, c) => acc + Number(c.arrecadado || 0), 0);

  const adicionarGira = async (e) => {
    e.preventDefault();
    if (!novaGira.titulo || !novaGira.data_gira) return;
    const { data, error } = await supabase.from('calendario_giras').insert([novaGira]).select().single();
    if (!error && data) {
      setGiras([...giras, data].sort((a, b) => a.data_gira.localeCompare(b.data_gira)));
      setNovaGira({ titulo: '', data_gira: '', horario: '19:30', tipo: 'Gira de Atendimento' });
      showToast('Gira adicionada ao calendário!');
    }
  };

  const removerGira = async (id) => {
    await supabase.from('calendario_giras').delete().eq('id', id);
    setGiras(giras.filter(g => g.id !== id));
    showToast('Evento removido.');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <p className="text-xs font-semibold text-stone-500 uppercase">Corrente Ativa</p>
          <p className="text-2xl font-bold text-emerald-900 mt-1">{mediums.length} Médiuns</p>
          <p className="text-xs text-stone-500 mt-1">Cadastrados na Casa Bendizer</p>
        </div>

        {canBebidas ? (
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
            <p className="text-xs font-semibold text-stone-500 uppercase">Caixinha Bebidas ({MES_ATUAL})</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{totalBebidasPagas} / {mediums.length} Pagos</p>
            <p className="text-xs text-stone-500 mt-1">Arrecadado: R$ {(totalBebidasPagas * 10).toFixed(2)}</p>
          </div>
        ) : (
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
            <p className="text-xs font-semibold text-stone-500 uppercase">Caixinha do Terreiro</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">R$ {totalCaixinha.toFixed(2)}</p>
            <p className="text-xs text-stone-500 mt-1">Total arrecadado nas campanhas</p>
          </div>
        )}

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <p className="text-xs font-semibold text-stone-500 uppercase">Próximos Trabalhos</p>
          <p className="text-2xl font-bold text-stone-800 mt-1">{giras.length} Agendados</p>
          <p className="text-xs text-stone-500 mt-1">Confira as datas abaixo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-stone-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-700" />
              Calendário de Giras & Eventos
            </h2>
          </div>

          {canCadastros && (
            <form onSubmit={adicionarGira} className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-5 bg-stone-50 p-3 rounded-xl border border-stone-200">
              <input
                type="text"
                placeholder="Ex: Gira de Caboclos"
                value={novaGira.titulo}
                onChange={e => setNovaGira({ ...novaGira, titulo: e.target.value })}
                className="sm:col-span-2 px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white"
                required
              />
              <input
                type="date"
                value={novaGira.data_gira}
                onChange={e => setNovaGira({ ...novaGira, data_gira: e.target.value })}
                className="px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white"
                required
              />
              <button type="submit" className="bg-emerald-800 text-white text-xs font-semibold rounded-lg px-3 py-2 hover:bg-emerald-900">
                + Agendar
              </button>
            </form>
          )}

          {giras.length === 0 ? (
            <p className="text-sm text-stone-500 py-6 text-center">Nenhuma gira cadastrada no calendário ainda.</p>
          ) : (
            <div className="space-y-3">
              {giras.map(g => (
                <div key={g.id} className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 border border-stone-200/80">
                  <div className="flex items-center gap-3.5">
                    <div className="bg-emerald-900 text-white rounded-xl px-3 py-2 text-center min-w-[56px]">
                      <span className="block text-xs uppercase text-amber-300 font-bold">
                        {new Date(g.data_gira + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
                      </span>
                      <span className="text-lg font-bold leading-none">
                        {g.data_gira.split('-')[2]}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-800 text-sm">{g.titulo}</h3>
                      <p className="text-xs text-stone-500">Horário: {g.horario} • {g.tipo}</p>
                    </div>
                  </div>
                  {canCadastros && (
                    <button onClick={() => removerGira(g.id)} className="text-stone-400 hover:text-red-600 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
            <h2 className="font-bold text-base text-stone-800 flex items-center gap-2 mb-4">
              <Cake className="w-5 h-5 text-amber-600" />
              Aniversariantes do Mês
            </h2>
            {aniversariantes.length === 0 ? (
              <p className="text-xs text-stone-500">Nenhum aniversariante neste mês.</p>
            ) : (
              <div className="space-y-2.5">
                {aniversariantes.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60">
                    <div>
                      <p className="text-sm font-semibold text-stone-800">{a.nome}</p>
                      <p className="text-xs text-amber-800">Dia {a.data_nascimento.split('-')[2]}</p>
                    </div>
                    <Cake className="w-4 h-4 text-amber-600" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
            <h2 className="font-bold text-base text-stone-800 flex items-center gap-2 mb-3">
              <Bell className="w-5 h-5 text-emerald-700" />
              Últimos Avisos
            </h2>
            {notificacoes.length === 0 ? (
              <p className="text-xs text-stone-500">Nenhum aviso publicado.</p>
            ) : (
              <div className="space-y-3">
                {notificacoes.slice(0, 3).map(n => (
                  <div key={n.id} className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                    <p className="font-bold text-stone-800">{n.titulo}</p>
                    <p className="text-stone-600 mt-1">{n.mensagem}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== 2. ABA MÉDIUNS (PESSOAL, SAÚDE COMPLETA, ESPIRITUAL & PERMISSÕES) ===================== */
function MediumsTab({
  mediums, setMediums, currentUser, setCurrentUser, isAdmin, canCadastros,
  linhasEntidade, listasCustom, onAddLista, onRemoveLista, showToast
}) {
  const [selectedId, setSelectedId] = useState(currentUser?.id);
  const [subTab, setSubTab] = useState('pessoal');
  const [novoRito, setNovoRito] = useState('');
  const [novaEntidade, setNovaEntidade] = useState({ linha: 'Caboclo(a)', nome: '' });

  const activeMedium = canCadastros
    ? (mediums.find(m => m.id === selectedId) || currentUser)
    : currentUser;

  const [form, setForm] = useState(activeMedium || {});

  useEffect(() => {
    if (activeMedium) setForm(activeMedium);
  }, [activeMedium?.id, mediums]);

  const isOwnProfile = form.id === currentUser?.id;
  const canEditEntidades = canCadastros || isOwnProfile;

  const togglePermissao = (modId) => {
    const atuais = form.permissoes || [];
    const atualizadas = atuais.includes(modId)
      ? atuais.filter(p => p !== modId)
      : [...atuais, modId];
    setForm({ ...form, permissoes: atualizadas });
  };

  const salvarFicha = async (e) => {
    e.preventDefault();
    const payload = {
      nome: form.nome,
      telefone: form.telefone,
      data_nascimento: form.data_nascimento || null,
      endereco: form.endereco,
      tipo_sanguineo: form.tipo_sanguineo,
      alergias: form.alergias,
      condicoes_medicas: form.condicoes_medicas,
      contato_emergencia: form.contato_emergencia,
      bebe: form.bebe || 'Não',
      fuma: form.fuma || 'Não',
      remedio_controlado: form.remedio_controlado || '',
      dispositivo_medico: form.dispositivo_medico || '',
      restricoes_fisicas: form.restricoes_fisicas || '',
      ...(canEditEntidades ? { entidades: form.entidades || [] } : {}),
      ...(canCadastros ? {
        cargo: form.cargo,
        ritos: form.ritos || [],
      } : {}),
      ...(isAdmin ? {
        nivel_acesso: form.nivel_acesso,
        permissoes: form.permissoes || []
      } : {})
    };

    const { data, error } = await supabase
      .from('mediums')
      .update(payload)
      .eq('id', form.id)
      .select()
      .single();

    if (!error && data) {
      setMediums(mediums.map(m => m.id === data.id ? data : m));
      if (data.id === currentUser?.id) setCurrentUser(data);
      showToast('Cadastro atualizado com sucesso!');
    }
  };

  const addRito = () => {
    if (!novoRito.trim()) return;
    const updated = [...(form.ritos || []), { nome: novoRito, data: new Date().toLocaleDateString('pt-BR') }];
    setForm({ ...form, ritos: updated });
    setNovoRito('');
  };

  const addEntidade = () => {
    if (!novaEntidade.nome.trim()) return;
    const updated = [...(form.entidades || []), novaEntidade];
    setForm({ ...form, entidades: updated });
    setNovaEntidade({ linha: linhasEntidade[0] || 'Caboclo(a)', nome: '' });
  };

  if (!form?.id) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {canCadastros && (
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm h-fit">
          <h3 className="font-bold text-sm text-stone-800 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-700" />
            Corrente ({mediums.length})
          </h3>
          <div className="space-y-1.5 max-h-[540px] overflow-y-auto">
            {mediums.map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition ${
                  form.id === m.id
                    ? 'bg-emerald-900 text-white font-semibold'
                    : 'hover:bg-stone-100 text-stone-700'
                }`}
              >
                <p className="truncate">{m.nome}</p>
                <p className={`text-[11px] ${form.id === m.id ? 'text-amber-300' : 'text-stone-400'}`}>
                  {m.cargo}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={`${canCadastros ? 'lg:col-span-3' : 'lg:col-span-4'} bg-white rounded-2xl border border-stone-200 p-6 shadow-sm`}>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-4 mb-5">
          <div>
            <h2 className="text-xl font-bold text-stone-800">{form.nome}</h2>
            <p className="text-xs text-stone-500">{form.email} • {form.cargo}</p>
          </div>

          <div className="flex bg-stone-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSubTab('pessoal')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                subTab === 'pessoal' ? 'bg-white text-emerald-900 shadow-sm' : 'text-stone-600'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5" /> Dados Pessoais & Saúde
            </button>
            <button
              type="button"
              onClick={() => setSubTab('espiritual')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                subTab === 'espiritual' ? 'bg-white text-emerald-900 shadow-sm' : 'text-stone-600'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Espiritual & Acessos
            </button>
          </div>
        </div>

        <form onSubmit={salvarFicha} className="space-y-5">
          {subTab === 'pessoal' ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={form.nome || ''}
                    onChange={e => setForm({ ...form, nome: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Data de Nascimento</label>
                  <input
                    type="date"
                    value={form.data_nascimento || ''}
                    onChange={e => setForm({ ...form, data_nascimento: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={form.telefone || ''}
                    onChange={e => setForm({ ...form, telefone: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Endereço Completo</label>
                  <input
                    type="text"
                    value={form.endereco || ''}
                    onChange={e => setForm({ ...form, endereco: e.target.value })}
                    placeholder="Rua, número, bairro, cidade"
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="bg-rose-50/60 border border-rose-200/80 rounded-2xl p-5 space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-rose-900 flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-rose-600" />
                    Ficha de Saúde, Hábitos & Segurança na Gira
                  </h3>
                  <p className="text-[11px] text-rose-800/80 mt-0.5">
                    Informações essenciais para cuidado com elementos (bebidas, fumo, ervas) e pronto atendimento durante os trabalhos.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Tipo Sanguíneo</label>
                    <input
                      type="text"
                      value={form.tipo_sanguineo || ''}
                      onChange={e => setForm({ ...form, tipo_sanguineo: e.target.value })}
                      placeholder="Ex: O+, A-, AB+"
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Consome bebida alcoólica?</label>
                    <select
                      value={form.bebe || 'Não'}
                      onChange={e => setForm({ ...form, bebe: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm bg-white"
                    >
                      <option value="Não">Não consome (Restrição total)</option>
                      <option value="Socialmente">Sim, socialmente / em trabalho</option>
                      <option value="Restrição médica">Não pode por motivo médico / remédio</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Fumante?</label>
                    <select
                      value={form.fuma || 'Não'}
                      onChange={e => setForm({ ...form, fuma: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm bg-white"
                    >
                      <option value="Não">Não fuma</option>
                      <option value="Apenas em trabalho">Apenas em trabalho espiritual</option>
                      <option value="Sim">Sim, fumante</option>
                      <option value="Alergia a fumaça">Sensibilidade / Alergia respiratória</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Toma remédio controlado ou uso contínuo?</label>
                    <input
                      type="text"
                      value={form.remedio_controlado || ''}
                      onChange={e => setForm({ ...form, remedio_controlado: e.target.value })}
                      placeholder="Ex: Não / Sim (nome do medicamento e horário)"
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Usa algum dispositivo médico?</label>
                    <input
                      type="text"
                      value={form.dispositivo_medico || ''}
                      onChange={e => setForm({ ...form, dispositivo_medico: e.target.value })}
                      placeholder="Ex: Não / Marca-passo, bomba de insulina, aparelho auditivo..."
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Alergias (Ervas, Alimentos, Medicamentos)</label>
                    <input
                      type="text"
                      value={form.alergias || ''}
                      onChange={e => setForm({ ...form, alergias: e.target.value })}
                      placeholder="Ex: Arruda, dendê, dipirona, picada de inseto..."
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Condições Médicas / Crônicas</label>
                    <input
                      type="text"
                      value={form.condicoes_medicas || ''}
                      onChange={e => setForm({ ...form, condicoes_medicas: e.target.value })}
                      placeholder="Ex: Hipertensão, diabetes, asma, epilepsia..."
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Restrições Físicas / Mobilidade / Gestação</label>
                    <input
                      type="text"
                      value={form.restricoes_fisicas || ''}
                      onChange={e => setForm({ ...form, restricoes_fisicas: e.target.value })}
                      placeholder="Ex: Problema no joelho/coluna, gestante, labirintite..."
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Contato de Emergência (Nome e Telefone)</label>
                    <input
                      type="text"
                      value={form.contato_emergencia || ''}
                      onChange={e => setForm({ ...form, contato_emergencia: e.target.value })}
                      placeholder="Ex: Maria (Mãe) - (11) 98888-7777"
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm bg-white"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-5">
              {/* Cargo e Níveis de Acesso Separados */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">Cargo na Casa Bendizer</label>
                    <input
                      type="text"
                      disabled={!canCadastros}
                      value={form.cargo || ''}
                      onChange={e => setForm({ ...form, cargo: e.target.value })}
                      placeholder="Ex: Médium de Corrente, Cambono, Ogã, Mãe Pequena"
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm bg-white disabled:bg-stone-100"
                    />
                  </div>
                  {isAdmin && (
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">Perfil Principal no Sistema</label>
                      <select
                        value={form.nivel_acesso || 'medium'}
                        onChange={e => setForm({ ...form, nivel_acesso: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm bg-white"
                      >
                        <option value="medium">Médium (Com permissões marcadas abaixo)</option>
                        <option value="secretaria">Secretaria (Acesso completo a todos os setores)</option>
                        <option value="admin">Administrador Geral (Total + Criar Opções)</option>
                      </select>
                    </div>
                  )}
                </div>

                {isAdmin && form.nivel_acesso === 'medium' && (
                  <div className="pt-3 border-t border-stone-200">
                    <p className="text-xs font-bold text-emerald-950 mb-2 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-emerald-700" />
                      Permissões Individuais por Setor (selecione exatamente o que este médium pode gerenciar):
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {MODULOS_PERMISSAO.map(mod => {
                        const checked = (form.permissoes || []).includes(mod.id);
                        return (
                          <label
                            key={mod.id}
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition ${
                              checked
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                                : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePermissao(mod.id)}
                              className="rounded text-emerald-700 focus:ring-emerald-600"
                            />
                            {mod.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Ritos e Obrigações */}
              <div className="border border-stone-200 rounded-xl p-4">
                <h4 className="font-bold text-sm text-stone-800 mb-3">Ritos e Obrigações Realizadas</h4>
                {canCadastros && (
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={novoRito}
                      onChange={e => setNovoRito(e.target.value)}
                      placeholder="Ex: Batismo, Amaci de Cabeça, Coroação..."
                      className="flex-1 px-3 py-2 border border-stone-200 rounded-xl text-xs"
                    />
                    <button type="button" onClick={addRito} className="px-3 py-2 bg-emerald-800 text-white rounded-xl text-xs font-semibold">
                      + Adicionar
                    </button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {(form.ritos || []).length === 0 && <p className="text-xs text-stone-400">Nenhum rito registrado.</p>}
                  {(form.ritos || []).map((r, i) => (
                    <span key={i} className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-900 px-3 py-1.5 rounded-lg text-xs font-medium">
                      {r.nome} ({r.data})
                      {canCadastros && (
                        <button type="button" onClick={() => setForm({ ...form, ritos: form.ritos.filter((_, idx) => idx !== i) })} className="text-red-500 font-bold">×</button>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              {/* Entidades de Trabalho */}
              <div className="border border-stone-200 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-sm text-stone-800">Entidades de Trabalho</h4>
                {canEditEntidades && (
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={novaEntidade.linha}
                      onChange={e => setNovaEntidade({ ...novaEntidade, linha: e.target.value })}
                      className="px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white"
                    >
                      {linhasEntidade.map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={novaEntidade.nome}
                      onChange={e => setNovaEntidade({ ...novaEntidade, nome: e.target.value })}
                      placeholder="Nome da Entidade"
                      className="flex-1 px-3 py-2 border border-stone-200 rounded-xl text-xs"
                    />
                    <button type="button" onClick={addEntidade} className="px-3 py-2 bg-emerald-800 text-white rounded-xl text-xs font-semibold">
                      + Adicionar
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(form.entidades || []).length === 0 && <p className="text-xs text-stone-400">Nenhuma entidade registrada.</p>}
                  {(form.entidades || []).map((ent, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs">
                      <div>
                        <span className="font-bold text-amber-900">{ent.linha}: </span>
                        <span className="text-stone-800">{ent.nome}</span>
                      </div>
                      {canEditEntidades && (
                        <button type="button" onClick={() => setForm({ ...form, entidades: form.entidades.filter((_, idx) => idx !== i) })} className="text-red-500 font-bold">×</button>
                      )}
                    </div>
                  ))}
                </div>

                {isAdmin && (
                  <AdminListaManager
                    titulo="Criar Nova Linha de Entidade"
                    tipo="linha_entidade"
                    listasCustom={listasCustom}
                    onAddLista={onAddLista}
                    onRemoveLista={onRemoveLista}
                  />
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button type="submit" className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-xl text-sm transition">
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ===================== 3. ABA BEBIDAS (PERMISSÃO INDEPENDENTE) ===================== */
function BebidasTab({ mediums, bebidas, setBebidas, financeiro, setFinanceiro, currentUser, showToast }) {
  const [compraDesc, setCompraDesc] = useState('');
  const [compraValor, setCompraValor] = useState('');

  const comprasBebidas = financeiro.filter(f => f.categoria === 'Compra Bebidas');
  const totalArrecadado = bebidas.filter(b => b.pago).length * 10;
  const totalGasto = comprasBebidas.reduce((acc, item) => acc + Number(item.valor), 0);

  const togglePagamento = async (mediumId) => {
    const existente = bebidas.find(b => b.medium_id === mediumId);
    if (existente) {
      const novoStatus = !existente.pago;
      const { data } = await supabase
        .from('caixinha_bebidas')
        .update({ pago: novoStatus, data_pagamento: novoStatus ? new Date().toISOString().slice(0, 10) : null })
        .eq('id', existente.id)
        .select()
        .single();
      if (data) {
        setBebidas(bebidas.map(b => b.id === data.id ? data : b));
        showToast(novoStatus ? 'Pagamento de R$ 10,00 confirmado!' : 'Status alterado para pendente.');
      }
    } else {
      const { data } = await supabase
        .from('caixinha_bebidas')
        .insert([{ medium_id: mediumId, mes_referencia: MES_ATUAL, valor: 10.00, pago: true, data_pagamento: new Date().toISOString().slice(0, 10) }])
        .select()
        .single();
      if (data) {
        setBebidas([...bebidas, data]);
        showToast('Pagamento de R$ 10,00 confirmado!');
      }
    }
  };

  const registrarCompra = async (e) => {
    e.preventDefault();
    if (!compraDesc || !compraValor) return;
    const { data } = await supabase
      .from('financeiro')
      .insert([{
        tipo: 'saida',
        categoria: 'Compra Bebidas',
        descricao: compraDesc,
        valor: parseFloat(compraValor),
        registrado_por: currentUser?.nome
      }])
      .select()
      .single();
    if (data) {
      setFinanceiro([data, ...financeiro]);
      setCompraDesc('');
      setCompraValor('');
      showToast('Compra de bebidas registrada!');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <p className="text-xs font-semibold text-stone-500 uppercase">Arrecadado ({MES_ATUAL})</p>
          <p className="text-2xl font-bold text-emerald-800 mt-1">R$ {totalArrecadado.toFixed(2)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <p className="text-xs font-semibold text-stone-500 uppercase">Gasto com Bebidas</p>
          <p className="text-2xl font-bold text-rose-700 mt-1">R$ {totalGasto.toFixed(2)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <p className="text-xs font-semibold text-stone-500 uppercase">Saldo das Bebidas</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">R$ {(totalArrecadado - totalGasto).toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <h2 className="font-bold text-base text-stone-800 mb-1 flex items-center gap-2">
            <Wine className="w-5 h-5 text-amber-600" />
            Contribuição Mensal (R$ 10,00 / Médium)
          </h2>
          <p className="text-xs text-stone-500 mb-4">Acesso exclusivo da Gestão de Bebidas • {MES_ATUAL}</p>

          <div className="space-y-2">
            {mediums.map(m => {
              const reg = bebidas.find(b => b.medium_id === m.id);
              const pago = Boolean(reg?.pago);
              return (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <div>
                    <p className="text-sm font-semibold text-stone-800">{m.nome}</p>
                    <p className="text-[11px] text-stone-500">{m.cargo}</p>
                  </div>
                  <button
                    onClick={() => togglePagamento(m.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer hover:opacity-80 ${
                      pago
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {pago ? '✓ Pago (R$ 10)' : 'Pendente'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <h2 className="font-bold text-base text-stone-800 mb-4">Prestação de Contas (Compras)</h2>

          <form onSubmit={registrarCompra} className="flex flex-wrap gap-2 mb-4 bg-stone-50 p-3 rounded-xl border border-stone-200">
            <input
              type="text"
              placeholder="Ex: Marafo, vinho tinto, guaraná..."
              value={compraDesc}
              onChange={e => setCompraDesc(e.target.value)}
              className="flex-1 px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white"
              required
            />
            <input
              type="number"
              step="0.01"
              placeholder="Valor R$"
              value={compraValor}
              onChange={e => setCompraValor(e.target.value)}
              className="w-24 px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white"
              required
            />
            <button type="submit" className="bg-emerald-800 text-white text-xs font-semibold px-3 py-2 rounded-lg">
              Lançar
            </button>
          </form>

          <div className="space-y-2">
            {comprasBebidas.length === 0 ? (
              <p className="text-xs text-stone-500 text-center py-6">Nenhuma compra registrada ainda.</p>
            ) : (
              comprasBebidas.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                  <div>
                    <p className="font-semibold text-stone-800">{c.descricao}</p>
                    <p className="text-stone-400">{c.data_movimento}</p>
                  </div>
                  <span className="font-bold text-rose-700">- R$ {Number(c.valor).toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== 4. ABA LIVRO CAIXA (FINANCEIRO) ===================== */
function FinanceiroTab({ financeiro, setFinanceiro, currentUser, showToast }) {
  const [form, setForm] = useState({ tipo: 'entrada', categoria: 'Mensalidade', descricao: '', valor: '' });

  const movsGerais = financeiro.filter(f => f.categoria !== 'Compra Bebidas');
  const entradas = movsGerais.filter(f => f.tipo === 'entrada').reduce((a, b) => a + Number(b.valor), 0);
  const saidas = movsGerais.filter(f => f.tipo === 'saida').reduce((a, b) => a + Number(b.valor), 0);

  const adicionarMovimento = async (e) => {
    e.preventDefault();
    if (!form.descricao || !form.valor) return;
    const { data } = await supabase
      .from('financeiro')
      .insert([{ ...form, valor: parseFloat(form.valor), registrado_por: currentUser?.nome }])
      .select()
      .single();
    if (data) {
      setFinanceiro([data, ...financeiro]);
      setForm({ tipo: 'entrada', categoria: 'Mensalidade', descricao: '', valor: '' });
      showToast('Lançamento financeiro registrado!');
    }
  };

  const excluirMovimento = async (id) => {
    await supabase.from('financeiro').delete().eq('id', id);
    setFinanceiro(financeiro.filter(f => f.id !== id));
    showToast('Lançamento excluído.');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <p className="text-xs font-semibold text-stone-500 uppercase">Total Entradas</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">R$ {entradas.toFixed(2)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <p className="text-xs font-semibold text-stone-500 uppercase">Total Saídas</p>
          <p className="text-2xl font-bold text-rose-700 mt-1">R$ {saidas.toFixed(2)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <p className="text-xs font-semibold text-stone-500 uppercase">Saldo em Caixa</p>
          <p className="text-2xl font-bold text-stone-800 mt-1">R$ {(entradas - saidas).toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
        <h2 className="font-bold text-base text-stone-800 mb-4">Livro Caixa da Casa Bendizer</h2>
        <form onSubmit={adicionarMovimento} className="grid grid-cols-1 sm:grid-cols-5 gap-2 mb-5 bg-stone-50 p-3 rounded-xl border border-stone-200">
          <select
            value={form.tipo}
            onChange={e => setForm({ ...form, tipo: e.target.value })}
            className="px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white"
          >
            <option value="entrada">Entrada (+)</option>
            <option value="saida">Saída (-)</option>
          </select>
          <input
            type="text"
            placeholder="Categoria (Ex: Luz, Velas, Mensalidade)"
            value={form.categoria}
            onChange={e => setForm({ ...form, categoria: e.target.value })}
            className="px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white"
            required
          />
          <input
            type="text"
            placeholder="Descrição detalhada"
            value={form.descricao}
            onChange={e => setForm({ ...form, descricao: e.target.value })}
            className="px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white"
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Valor R$"
            value={form.valor}
            onChange={e => setForm({ ...form, valor: e.target.value })}
            className="px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white"
            required
          />
          <button type="submit" className="bg-emerald-800 text-white text-xs font-semibold rounded-lg py-2">
            + Registrar
          </button>
        </form>

        <div className="space-y-2">
          {movsGerais.map(f => (
            <div key={f.id} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs">
              <div>
                <span className="font-bold text-stone-800">{f.descricao}</span>
                <span className="ml-2 px-2 py-0.5 bg-stone-200 rounded text-[10px]">{f.categoria}</span>
                <p className="text-stone-400 mt-0.5">{f.data_movimento} • {f.registrado_por}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-bold ${f.tipo === 'entrada' ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {f.tipo === 'entrada' ? '+' : '-'} R$ {Number(f.valor).toFixed(2)}
                </span>
                <button onClick={() => excluirMovimento(f.id)} className="text-stone-400 hover:text-rose-600" title="Excluir lançamento">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===================== 5. ABA CAIXINHA DO TERREIRO (EDITAR, MOVIMENTAR E EXCLUIR) ===================== */
function DoacoesTab({
  campanhas, setCampanhas, financeiro, setFinanceiro, currentUser,
  isAdmin, canCaixinha, categoriasCaixinha, listasCustom, onAddLista, onRemoveLista, showToast
}) {
  const [valorDoacao, setValorDoacao] = useState('');
  const [campanhaSelecionada, setCampanhaSelecionada] = useState('');
  const [novaCamp, setNovaCamp] = useState({ titulo: '', categoria: categoriasCaixinha[0] || 'Manutenção & Velas', descricao: '', meta: '' });

  // Estado para editar campanha
  const [editandoId, setEditandoId] = useState(null);
  const [editForm, setEditForm] = useState({ titulo: '', categoria: '', descricao: '', meta: '', arrecadado: '' });

  // Estado para movimentar saldo da caixinha (+ entrada / - saída)
  const [movCampId, setMovCampId] = useState(null);
  const [movForm, setMovForm] = useState({ tipo: 'saida', descricao: '', valor: '' });

  const totalArrecadadoGeral = campanhas.reduce((acc, c) => acc + Number(c.arrecadado || 0), 0);

  const criarCampanha = async (e) => {
    e.preventDefault();
    if (!novaCamp.titulo || !novaCamp.meta) return;
    const { data } = await supabase
      .from('campanhas_doacao')
      .insert([{
        titulo: novaCamp.titulo,
        categoria: novaCamp.categoria,
        descricao: novaCamp.descricao,
        meta: parseFloat(novaCamp.meta),
        arrecadado: 0,
        ativa: true
      }])
      .select()
      .single();
    if (data) {
      setCampanhas([data, ...campanhas]);
      setNovaCamp({ titulo: '', categoria: categoriasCaixinha[0] || 'Manutenção & Velas', descricao: '', meta: '' });
      showToast('Nova caixinha criada!');
    }
  };

  const abrirEdicao = (c) => {
    setEditandoId(c.id);
    setEditForm({
      titulo: c.titulo,
      categoria: c.categoria || 'Geral',
      descricao: c.descricao || '',
      meta: c.meta,
      arrecadado: c.arrecadado
    });
  };

  const salvarEdicao = async (e) => {
    e.preventDefault();
    const { data } = await supabase
      .from('campanhas_doacao')
      .update({
        titulo: editForm.titulo,
        categoria: editForm.categoria,
        descricao: editForm.descricao,
        meta: parseFloat(editForm.meta),
        arrecadado: parseFloat(editForm.arrecadado)
      })
      .eq('id', editandoId)
      .select()
      .single();

    if (data) {
      setCampanhas(campanhas.map(c => c.id === editandoId ? data : c));
      setEditandoId(null);
      showToast('Caixinha atualizada com sucesso!');
    }
  };

  const excluirCampanha = async (id) => {
    await supabase.from('campanhas_doacao').delete().eq('id', id);
    setCampanhas(campanhas.filter(c => c.id !== id));
    showToast('Caixinha excluída.');
  };

  const movimentarCampanha = async (e) => {
    e.preventDefault();
    const camp = campanhas.find(c => c.id === movCampId);
    const val = parseFloat(movForm.valor);
    if (!camp || !val || val <= 0) return;

    const novoSaldo = movForm.tipo === 'entrada'
      ? Number(camp.arrecadado) + val
      : Math.max(0, Number(camp.arrecadado) - val);

    const { data: campAtualizada } = await supabase
      .from('campanhas_doacao')
      .update({ arrecadado: novoSaldo })
      .eq('id', camp.id)
      .select()
      .single();

    if (campAtualizada) {
      setCampanhas(campanhas.map(c => c.id === camp.id ? campAtualizada : c));
    }

    const { data: fin } = await supabase
      .from('financeiro')
      .insert([{
        tipo: movForm.tipo,
        categoria: `Caixinha: ${camp.titulo}`,
        descricao: movForm.descricao || (movForm.tipo === 'entrada' ? 'Reforço de caixa' : 'Utilização de recurso da caixinha'),
        valor: val,
        registrado_por: currentUser?.nome
      }])
      .select()
      .single();

    if (fin) setFinanceiro([fin, ...financeiro]);
    setMovCampId(null);
    setMovForm({ tipo: 'saida', descricao: '', valor: '' });
    showToast('Movimentação registrada na caixinha!');
  };

  const registrarDoacao = async (e) => {
    e.preventDefault();
    const val = parseFloat(valorDoacao);
    if (!val || val <= 0) return;

    const camp = campanhas.find(c => c.id === campanhaSelecionada) || campanhas[0];
    if (camp) {
      const novoTotal = Number(camp.arrecadado) + val;
      const { data: campAtualizada } = await supabase
        .from('campanhas_doacao')
        .update({ arrecadado: novoTotal })
        .eq('id', camp.id)
        .select()
        .single();
      if (campAtualizada) {
        setCampanhas(campanhas.map(c => c.id === camp.id ? campAtualizada : c));
      }
    }

    const { data: fin } = await supabase
      .from('financeiro')
      .insert([{
        tipo: 'entrada',
        categoria: 'Doação',
        descricao: `Doação Caixinha (${currentUser?.nome})`,
        valor: val,
        registrado_por: currentUser?.nome
      }])
      .select()
      .single();

    if (fin) setFinanceiro([fin, ...financeiro]);
    setValorDoacao('');
    showToast('Gratidão! Sua doação foi registrada na Caixinha da Casa Bendizer.');
  };

  return (
    <div className="space-y-6">
      <div className="bg-emerald-950 text-white p-6 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-amber-300 font-bold">Transparência • Caixinha da Casa Bendizer</p>
          <h2 className="text-2xl font-bold mt-1">Saldo Atual nas Caixinhas: R$ {totalArrecadadoGeral.toFixed(2)}</h2>
          <p className="text-xs text-emerald-200 mt-1">Recursos destinados às velas, ervas, manutenção e trabalhos espirituais.</p>
        </div>
      </div>

      {isAdmin && (
        <AdminListaManager
          titulo="Criar Nova Categoria de Caixinha"
          tipo="categoria_caixinha"
          listasCustom={listasCustom}
          onAddLista={onAddLista}
          onRemoveLista={onRemoveLista}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {canCaixinha && (
            <form onSubmit={criarCampanha} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-stone-800">Criar Nova Caixinha / Campanha</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Título (Ex: Festa de Preto-Velho)"
                  value={novaCamp.titulo}
                  onChange={e => setNovaCamp({ ...novaCamp, titulo: e.target.value })}
                  className="sm:col-span-2 px-3 py-2 border border-stone-200 rounded-xl text-xs"
                />
                <select
                  value={novaCamp.categoria}
                  onChange={e => setNovaCamp({ ...novaCamp, categoria: e.target.value })}
                  className="px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white"
                >
                  {categoriasCaixinha.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Meta R$"
                  value={novaCamp.meta}
                  onChange={e => setNovaCamp({ ...novaCamp, meta: e.target.value })}
                  className="px-3 py-2 border border-stone-200 rounded-xl text-xs"
                />
              </div>
              <input
                type="text"
                placeholder="Descrição / Finalidade desta caixinha"
                value={novaCamp.descricao}
                onChange={e => setNovaCamp({ ...novaCamp, descricao: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs"
              />
              <button type="submit" className="px-4 py-2 bg-emerald-800 text-white text-xs font-semibold rounded-xl">
                + Criar Caixinha
              </button>
            </form>
          )}

          {campanhas.map(c => {
            const pct = Math.min(100, Math.round((Number(c.arrecadado) / Math.max(1, Number(c.meta))) * 100));
            return (
              <div key={c.id} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3">
                {editandoId === c.id ? (
                  <form onSubmit={salvarEdicao} className="space-y-3 bg-amber-50/60 p-4 rounded-xl border border-amber-200">
                    <p className="text-xs font-bold text-amber-950">Editando Caixinha</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        value={editForm.titulo}
                        onChange={e => setEditForm({ ...editForm, titulo: e.target.value })}
                        className="px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white"
                      />
                      <select
                        value={editForm.categoria}
                        onChange={e => setEditForm({ ...editForm, categoria: e.target.value })}
                        className="px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white"
                      >
                        {categoriasCaixinha.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-500">Saldo Atual (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={editForm.arrecadado}
                          onChange={e => setEditForm({ ...editForm, arrecadado: e.target.value })}
                          className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-500">Meta (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={editForm.meta}
                          onChange={e => setEditForm({ ...editForm, meta: e.target.value })}
                          className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white"
                        />
                      </div>
                    </div>
                    <input
                      type="text"
                      value={editForm.descricao}
                      onChange={e => setEditForm({ ...editForm, descricao: e.target.value })}
                      placeholder="Descrição"
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white"
                    />
                    <div className="flex gap-2">
                      <button type="submit" className="px-4 py-1.5 bg-emerald-800 text-white text-xs font-semibold rounded-lg">
                        Salvar Edição
                      </button>
                      <button type="button" onClick={() => setEditandoId(null)} className="px-3 py-1.5 bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg">
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider bg-stone-100 text-stone-600 px-2 py-0.5 rounded">
                          {c.categoria || 'Geral'}
                        </span>
                        <h3 className="font-bold text-stone-800 text-base mt-1">{c.titulo}</h3>
                        <p className="text-xs text-stone-500 mt-0.5">{c.descricao}</p>
                      </div>
                      <span className="text-xs font-bold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg">
                        {pct}% atingido
                      </span>
                    </div>

                    <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden">
                      <div className="bg-emerald-700 h-full transition-all" style={{ width: `${pct}%` }} />
                    </div>

                    <div className="flex justify-between text-xs font-semibold text-stone-600">
                      <span>Saldo / Arrecadado: R$ {Number(c.arrecadado).toFixed(2)}</span>
                      <span>Meta: R$ {Number(c.meta).toFixed(2)}</span>
                    </div>

                    {canCaixinha && (
                      <div className="pt-3 border-t border-stone-100 flex flex-wrap gap-2">
                        <button
                          onClick={() => { setMovCampId(movCampId === c.id ? null : c.id); setMovForm({ tipo: 'saida', descricao: '', valor: '' }); }}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1"
                        >
                          <ArrowUpDown className="w-3.5 h-3.5" /> Movimentar Valor
                        </button>
                        <button
                          onClick={() => abrirEdicao(c)}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold flex items-center gap-1"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Editar
                        </button>
                        <button
                          onClick={() => excluirCampanha(c.id)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1 ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Excluir
                        </button>
                      </div>
                    )}

                    {movCampId === c.id && canCaixinha && (
                      <form onSubmit={movimentarCampanha} className="mt-3 p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                        <p className="text-xs font-bold text-stone-800">Movimentar Saldo de "{c.titulo}"</p>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                          <select
                            value={movForm.tipo}
                            onChange={e => setMovForm({ ...movForm, tipo: e.target.value })}
                            className="px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs bg-white"
                          >
                            <option value="saida">Retirar / Usar (-)</option>
                            <option value="entrada">Adicionar (+)</option>
                          </select>
                          <input
                            type="text"
                            required
                            placeholder="Motivo (Ex: Compra de velas)"
                            value={movForm.descricao}
                            onChange={e => setMovForm({ ...movForm, descricao: e.target.value })}
                            className="sm:col-span-2 px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs bg-white"
                          />
                          <input
                            type="number"
                            step="0.01"
                            required
                            placeholder="Valor R$"
                            value={movForm.valor}
                            onChange={e => setMovForm({ ...movForm, valor: e.target.value })}
                            className="px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs bg-white"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button type="submit" className="px-3.5 py-1.5 bg-emerald-800 text-white text-xs font-semibold rounded-lg">
                            Confirmar Movimentação
                          </button>
                          <button type="button" onClick={() => setMovCampId(null)} className="px-3 py-1.5 bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg">
                            Cancelar
                          </button>
                        </div>
                      </form>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm h-fit">
          <h3 className="font-bold text-base text-stone-800 mb-2">Contribuir com a Caixinha</h3>
          <p className="text-xs text-stone-500 mb-4">
            Registre sua contribuição voluntária para ajudar nas velas, ervas e manutenção da casa.
          </p>

          <form onSubmit={registrarDoacao} className="space-y-3">
            {campanhas.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Caixinha / Destino</label>
                <select
                  value={campanhaSelecionada}
                  onChange={e => setCampanhaSelecionada(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white"
                >
                  {campanhas.map(c => (
                    <option key={c.id} value={c.id}>{c.titulo}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Valor da Doação (R$)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="Ex: 25.00"
                value={valorDoacao}
                onChange={e => setValorDoacao(e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm"
              />
            </div>

            <button type="submit" className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-xl text-xs transition">
              Registrar Minha Doação
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ===================== 6. ABA CURIMBA (LINHAS SEPARADAS + CRIAR NOVAS LINHAS) ===================== */
function CurimbaTab({
  pontos, setPontos, currentUser, isAdmin, canCurimba,
  linhasCurimba, listasCustom, onAddLista, onRemoveLista, showToast
}) {
  const [busca, setBusca] = useState('');
  const [filtroLinha, setFiltroLinha] = useState('Todas');
  const [novoPonto, setNovoPonto] = useState({
    titulo: '', linha: 'Caboclos', toque: 'Samba de Caboclo', letra: '', link_youtube: '', link_audio: ''
  });

  const cadastrarPonto = async (e) => {
    e.preventDefault();
    if (!novoPonto.titulo || !novoPonto.letra) return;

    const statusInicial = canCurimba ? 'aprovado' : 'pendente';
    const payload = {
      ...novoPonto,
      status: statusInicial,
      enviado_por: currentUser?.nome || 'Médium'
    };

    const { data } = await supabase.from('curimba_pontos').insert([payload]).select().single();
    if (data) {
      setPontos([data, ...pontos]);
      setNovoPonto({ titulo: '', linha: 'Caboclos', toque: 'Samba de Caboclo', letra: '', link_youtube: '', link_audio: '' });
      showToast(
        canCurimba
          ? 'Ponto cantado publicado no caderno da Curimba!'
          : 'Ponto enviado para análise da equipe da Curimba!'
      );
    }
  };

  const aprovarPonto = async (id) => {
    const { data } = await supabase
      .from('curimba_pontos')
      .update({ status: 'aprovado' })
      .eq('id', id)
      .select()
      .single();
    if (data) {
      setPontos(pontos.map(p => p.id === id ? data : p));
      showToast('Ponto aprovado e publicado para toda a corrente!');
    }
  };

  const recusarPonto = async (id) => {
    await supabase.from('curimba_pontos').delete().eq('id', id);
    setPontos(pontos.filter(p => p.id !== id));
    showToast('Ponto removido.');
  };

  const pontosPendentes = pontos.filter(p => p.status === 'pendente');
  const pontosAprovados = pontos.filter(p => (p.status || 'aprovado') === 'aprovado');

  const pontosFiltrados = pontosAprovados.filter(p => {
    const matchBusca = p.titulo.toLowerCase().includes(busca.toLowerCase()) || p.letra.toLowerCase().includes(busca.toLowerCase());
    const matchLinha = filtroLinha === 'Todas' || p.linha === filtroLinha;
    return matchBusca && matchLinha;
  });

  return (
    <div className="space-y-6">
      {isAdmin && (
        <AdminListaManager
          titulo="Criar Nova Linha de Ponto na Curimba"
          tipo="linha_curimba"
          listasCustom={listasCustom}
          onAddLista={onAddLista}
          onRemoveLista={onRemoveLista}
        />
      )}

      {canCurimba && pontosPendentes.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 p-5 rounded-2xl space-y-3">
          <h3 className="font-bold text-sm text-amber-950 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-700" />
            Pontos Aguardando Análise ({pontosPendentes.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pontosPendentes.map(p => (
              <div key={p.id} className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">{p.linha}</span>
                  <span className="text-[11px] text-stone-500">Enviado por: <strong>{p.enviado_por}</strong></span>
                </div>
                <h4 className="font-bold text-sm text-stone-800">{p.titulo}</h4>
                <pre className="whitespace-pre-wrap font-sans text-xs text-stone-600 bg-stone-50 p-2.5 rounded-lg">{p.letra}</pre>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => aprovarPonto(p.id)}
                    className="flex-1 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Aprovar Ponto
                  </button>
                  <button
                    onClick={() => recusarPonto(p.id)}
                    className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-semibold rounded-lg flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Recusar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <h2 className="font-bold text-base text-stone-800 mb-1 flex items-center gap-2">
          <Music className="w-5 h-5 text-emerald-700" />
          {canCurimba ? 'Cadastrar Novo Ponto na Curimba' : 'Sugerir / Enviar Ponto para Análise'}
        </h2>
        {!canCurimba && (
          <p className="text-xs text-stone-500 mb-3">
            Os pontos enviados por médiuns passam pela revisão da equipe de Curimba antes de ficarem visíveis para todos.
          </p>
        )}
        <form onSubmit={cadastrarPonto} className="space-y-3 mt-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              placeholder="Nome do Ponto"
              value={novoPonto.titulo}
              onChange={e => setNovoPonto({ ...novoPonto, titulo: e.target.value })}
              className="px-3 py-2 border border-stone-200 rounded-xl text-xs"
            />
            <select
              value={novoPonto.linha}
              onChange={e => setNovoPonto({ ...novoPonto, linha: e.target.value })}
              className="px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white"
            >
              {linhasCurimba.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Toque (Ex: Congo, Nagô, Ijexá)"
              value={novoPonto.toque}
              onChange={e => setNovoPonto({ ...novoPonto, toque: e.target.value })}
              className="px-3 py-2 border border-stone-200 rounded-xl text-xs"
            />
          </div>

          <textarea
            rows={3}
            required
            placeholder="Escreva a letra completa do ponto aqui..."
            value={novoPonto.letra}
            onChange={e => setNovoPonto({ ...novoPonto, letra: e.target.value })}
            className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="url"
              placeholder="Link do YouTube (opcional)"
              value={novoPonto.link_youtube}
              onChange={e => setNovoPonto({ ...novoPonto, link_youtube: e.target.value })}
              className="px-3 py-2 border border-stone-200 rounded-xl text-xs"
            />
            <input
              type="url"
              placeholder="Link de Áudio / SoundCloud / Drive (opcional)"
              value={novoPonto.link_audio}
              onChange={e => setNovoPonto({ ...novoPonto, link_audio: e.target.value })}
              className="px-3 py-2 border border-stone-200 rounded-xl text-xs"
            />
          </div>

          <button type="submit" className="px-5 py-2 bg-emerald-800 text-white text-xs font-semibold rounded-xl">
            {canCurimba ? '+ Publicar Ponto' : '+ Enviar para Análise'}
          </button>
        </form>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar por nome ou trecho da letra..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="flex-1 min-w-[220px] px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-xs"
        />
        <select
          value={filtroLinha}
          onChange={e => setFiltroLinha(e.target.value)}
          className="px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-xs"
        >
          <option value="Todas">Todas as Linhas</option>
          {linhasCurimba.map(l => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pontosFiltrados.length === 0 ? (
          <p className="text-sm text-stone-500 col-span-2 text-center py-8">Nenhum ponto aprovado nesta linha ainda.</p>
        ) : (
          pontosFiltrados.map(p => (
            <div key={p.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full">
                    {p.linha}
                  </span>
                  {p.toque && <span className="text-[11px] text-stone-400 font-medium">Toque: {p.toque}</span>}
                </div>
                <h3 className="font-bold text-base text-stone-800 mb-3">{p.titulo}</h3>
                <pre className="whitespace-pre-wrap font-sans text-xs text-stone-700 bg-stone-50 p-3.5 rounded-xl border border-stone-100 leading-relaxed">
                  {p.letra}
                </pre>
              </div>

              <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-stone-100">
                {p.link_youtube && (
                  <a
                    href={p.link_youtube}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Vídeo YouTube
                  </a>
                )}
                {p.link_audio && (
                  <a
                    href={p.link_audio}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold hover:bg-amber-100"
                  >
                    <Music className="w-3.5 h-3.5" /> Ouvir Áudio
                  </a>
                )}
                <button
                  onClick={() => { navigator.clipboard.writeText(`${p.titulo}

${p.letra}`); showToast('Letra copiada!'); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 text-stone-700 rounded-lg text-xs font-semibold hover:bg-stone-200 ml-auto"
                >
                  <Copy className="w-3.5 h-3.5" /> Copiar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ===================== 7. ABA BIBLIOTECA (CATEGORIAS PERSONALIZÁVEIS + 20 DIAS) ===================== */
function BibliotecaTab({
  livros, setLivros, mediums, notificacoes, setNotificacoes, currentUser,
  isAdmin, canBiblioteca, categoriasBiblioteca, listasCustom, onAddLista, onRemoveLista, showToast
}) {
  const [novoLivro, setNovoLivro] = useState({
    titulo: '', autor: '', categoria: categoriasBiblioteca[0] || 'Fundamentos', unidades: 1
  });

  const adicionarDias = (dias) => {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    return d.toISOString().slice(0, 10);
  };

  const hojeStr = new Date().toISOString().slice(0, 10);

  const adicionarLivro = async (e) => {
    e.preventDefault();
    if (!novoLivro.titulo) return;
    const payload = {
      titulo: novoLivro.titulo,
      autor: novoLivro.autor,
      categoria: novoLivro.categoria,
      unidades: parseInt(novoLivro.unidades, 10) || 1,
      status: 'Disponível',
      reservas: []
    };
    const { data } = await supabase.from('biblioteca').insert([payload]).select().single();
    if (data) {
      setLivros([...livros, data]);
      setNovoLivro({ titulo: '', autor: '', categoria: categoriasBiblioteca[0] || 'Fundamentos', unidades: 1 });
      showToast('Livro adicionado ao acervo da Casa Bendizer!');
    }
  };

  const pegarEmprestado = async (livro) => {
    const hoje = new Date().toISOString().slice(0, 10);
    const devolucao = adicionarDias(20);
    const reservasAtualizadas = (livro.reservas || []).filter(r => r.medium_id !== currentUser?.id);

    const { data } = await supabase
      .from('biblioteca')
      .update({
        status: 'Emprestado',
        emprestado_para: currentUser?.id,
        data_emprestimo: hoje,
        data_devolucao_prevista: devolucao,
        reservas: reservasAtualizadas
      })
      .eq('id', livro.id)
      .select()
      .single();

    if (data) {
      setLivros(livros.map(l => l.id === livro.id ? data : l));
      showToast(`Empréstimo registrado! Devolução prevista em 20 dias (${devolucao.split('-').reverse().join('/')}).`);
    }
  };

  const renovarEmprestimo = async (livro) => {
    const novaDevolucao = adicionarDias(20);
    const { data } = await supabase
      .from('biblioteca')
      .update({ data_devolucao_prevista: novaDevolucao })
      .eq('id', livro.id)
      .select()
      .single();

    if (data) {
      setLivros(livros.map(l => l.id === livro.id ? data : l));
      showToast(`Empréstimo renovado por mais 20 dias! Novo prazo: ${novaDevolucao.split('-').reverse().join('/')}.`);
    }
  };

  const devolverLivro = async (livro) => {
    const { data } = await supabase
      .from('biblioteca')
      .update({
        status: 'Disponível',
        emprestado_para: null,
        data_emprestimo: null,
        data_devolucao_prevista: null
      })
      .eq('id', livro.id)
      .select()
      .single();

    if (data) {
      setLivros(livros.map(l => l.id === livro.id ? data : l));
      showToast('Devolução registrada com sucesso!');
    }
  };

  const reservarLivro = async (livro) => {
    const atuais = livro.reservas || [];
    if (atuais.some(r => r.medium_id === currentUser?.id)) {
      showToast('Você já está na fila de reserva deste livro.');
      return;
    }
    const novasReservas = [...atuais, { medium_id: currentUser?.id, nome: currentUser?.nome, data: hojeStr }];
    const { data } = await supabase
      .from('biblioteca')
      .update({ reservas: novasReservas })
      .eq('id', livro.id)
      .select()
      .single();

    if (data) {
      setLivros(livros.map(l => l.id === livro.id ? data : l));
      showToast('Reserva registrada! Você será avisado(a) quando o livro voltar.');
    }
  };

  const notificarVencimento = async (livro, portador) => {
    const msg = `Olá, ${portador?.nome || 'Médium'}! O prazo de 20 dias do livro "${livro.titulo}" da Biblioteca da Casa Bendizer venceu em ${livro.data_devolucao_prevista?.split('-').reverse().join('/')}. Por favor, devolva ou renove na plataforma.`;

    const { data } = await supabase
      .from('notificacoes')
      .insert([{ titulo: `Devolução de Livro: ${livro.titulo}`, mensagem: msg, destinatario_id: portador?.id || null }])
      .select()
      .single();

    if (data) setNotificacoes([data, ...notificacoes]);

    if (portador?.telefone) {
      const num = portador.telefone.replace(/\D/g, '');
      window.open(`https://wa.me/55${num}?text=${encodeURIComponent(msg)}`, '_blank');
    }
    showToast('Notificação de vencimento enviada!');
  };

  const livrosVencidos = livros.filter(
    l => l.status === 'Emprestado' && l.data_devolucao_prevista && l.data_devolucao_prevista < hojeStr
  );

  return (
    <div className="space-y-6">
      {isAdmin && (
        <AdminListaManager
          titulo="Criar Nova Categoria de Livro na Biblioteca"
          tipo="categoria_biblioteca"
          listasCustom={listasCustom}
          onAddLista={onAddLista}
          onRemoveLista={onRemoveLista}
        />
      )}

      {livrosVencidos.length > 0 && (
        <div className="bg-rose-50 border border-rose-300 p-4 rounded-2xl space-y-2">
          <h3 className="font-bold text-sm text-rose-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            Empréstimos com Prazo de 20 Dias Vencido ({livrosVencidos.length})
          </h3>
          {livrosVencidos.map(l => {
            const portador = mediums.find(m => m.id === l.emprestado_para);
            return (
              <div key={l.id} className="flex flex-wrap items-center justify-between gap-2 bg-white p-3 rounded-xl border border-rose-200 text-xs">
                <span>
                  <strong>{l.titulo}</strong> está com <strong>{portador?.nome || 'Médium'}</strong> (venceu em {l.data_devolucao_prevista?.split('-').reverse().join('/')})
                </span>
                {(canBiblioteca || l.emprestado_para === currentUser?.id) && (
                  <button
                    onClick={() => notificarVencimento(l, portador)}
                    className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-semibold rounded-lg"
                  >
                    Enviar Notificação / WhatsApp
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {canBiblioteca && (
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <h2 className="font-bold text-base text-stone-800 mb-3">Cadastrar Livro na Biblioteca</h2>
          <form onSubmit={adicionarLivro} className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            <input
              type="text"
              required
              placeholder="Título da Obra"
              value={novoLivro.titulo}
              onChange={e => setNovoLivro({ ...novoLivro, titulo: e.target.value })}
              className="sm:col-span-2 px-3 py-2 border border-stone-200 rounded-xl text-xs"
            />
            <input
              type="text"
              required
              placeholder="Autor / Espírito"
              value={novoLivro.autor}
              onChange={e => setNovoLivro({ ...novoLivro, autor: e.target.value })}
              className="px-3 py-2 border border-stone-200 rounded-xl text-xs"
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                required
                title="Quantidade de unidades"
                placeholder="Qtd"
                value={novoLivro.unidades}
                onChange={e => setNovoLivro({ ...novoLivro, unidades: e.target.value })}
                className="w-16 px-2.5 py-2 border border-stone-200 rounded-xl text-xs"
              />
              <select
                value={novoLivro.categoria}
                onChange={e => setNovoLivro({ ...novoLivro, categoria: e.target.value })}
                className="flex-1 px-2.5 py-2 border border-stone-200 rounded-xl text-xs bg-white"
              >
                {categoriasBiblioteca.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="bg-emerald-800 text-white text-xs font-semibold rounded-xl py-2">
              + Cadastrar Livro
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {livros.length === 0 ? (
          <p className="text-sm text-stone-500 col-span-3 text-center py-8">Nenhum livro cadastrado na biblioteca ainda.</p>
        ) : (
          livros.map(l => {
            const portador = mediums.find(m => m.id === l.emprestado_para);
            const isMine = l.emprestado_para === currentUser?.id;
            const vencido = l.status === 'Emprestado' && l.data_devolucao_prevista && l.data_devolucao_prevista < hojeStr;
            const reservas = l.reservas || [];

            return (
              <div key={l.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-stone-400">
                    <span>{l.categoria || 'Acervo'}</span>
                    <span>{l.unidades || 1} unid.</span>
                  </div>
                  <h3 className="font-bold text-stone-800 text-sm mt-1">{l.titulo}</h3>
                  <p className="text-xs text-stone-500 mt-0.5">{l.autor}</p>

                  {l.status === 'Emprestado' && (
                    <div className={`mt-3 p-2.5 rounded-xl text-xs border ${vencido ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-amber-50 border-amber-200 text-amber-950'}`}>
                      <p><strong>Com:</strong> {portador?.nome || 'Médium'}</p>
                      {l.data_devolucao_prevista && (
                        <p className="mt-0.5">
                          <strong>Devolução (20 dias):</strong> {l.data_devolucao_prevista.split('-').reverse().join('/')}
                          {vencido && <span className="ml-1 font-bold text-rose-700">(VENCIDO)</span>}
                        </p>
                      )}
                    </div>
                  )}

                  {reservas.length > 0 && (
                    <p className="text-[11px] text-emerald-800 mt-2 font-medium">
                      Fila de reserva: {reservas.map(r => r.nome).join(', ')}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                  <span className={`text-xs font-bold ${l.status === 'Disponível' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {l.status === 'Disponível' ? '● Disponível' : '● Emprestado'}
                  </span>

                  <div className="flex flex-wrap gap-1.5">
                    {l.status === 'Disponível' && (
                      <button
                        onClick={() => pegarEmprestado(l)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-800 hover:bg-emerald-900 text-white"
                      >
                        Pegar (20 dias)
                      </button>
                    )}

                    {l.status === 'Emprestado' && (isMine || canBiblioteca) && (
                      <>
                        {reservas.length === 0 && (
                          <button
                            onClick={() => renovarEmprestimo(l)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-900 flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" /> Renovar
                          </button>
                        )}
                        <button
                          onClick={() => devolverLivro(l)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-stone-200 hover:bg-stone-300 text-stone-800"
                        >
                          Devolver
                        </button>
                      </>
                    )}

                    {l.status === 'Emprestado' && !isMine && (
                      <button
                        onClick={() => reservarLivro(l)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 border border-emerald-300 text-emerald-900 hover:bg-emerald-100 flex items-center gap-1"
                      >
                        <BookmarkPlus className="w-3 h-3" /> Reservar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ===================== 8. ABA AVISOS & LEMBRETES WHATSAPP ===================== */
function MensagensTab({ notificacoes, setNotificacoes, mediums, bebidas, canCadastros, canBebidas, showToast }) {
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');

  const publicarAviso = async (e) => {
    e.preventDefault();
    if (!titulo || !mensagem) return;
    const { data } = await supabase
      .from('notificacoes')
      .insert([{ titulo, mensagem, destinatario_id: null }])
      .select()
      .single();
    if (data) {
      setNotificacoes([data, ...notificacoes]);
      setTitulo('');
      setMensagem('');
      showToast('Aviso publicado para toda a corrente da Casa Bendizer!');
    }
  };

  const abrirWhatsApp = (telefone, texto) => {
    const num = (telefone || '').replace(/\D/g, '');
    const url = num
      ? `https://wa.me/55${num}?text=${encodeURIComponent(texto)}`
      : `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  const pendentesBebida = mediums.filter(m => !bebidas.some(b => b.medium_id === m.id && b.pago));
  const canPost = canCadastros || canBebidas;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {canPost && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <h2 className="font-bold text-base text-stone-800 mb-3 flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-700" />
              Enviar Aviso no Mural da Plataforma
            </h2>
            <form onSubmit={publicarAviso} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Título do Aviso (Ex: Banho de Ervas antes da Gira)"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs"
              />
              <textarea
                rows={3}
                required
                placeholder="Escreva a mensagem para os médiuns..."
                value={mensagem}
                onChange={e => setMensagem(e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs"
              />
              <button type="submit" className="px-4 py-2 bg-emerald-800 text-white text-xs font-semibold rounded-xl">
                Publicar Aviso
              </button>
            </form>
          </div>

          {canBebidas && (
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
              <h2 className="font-bold text-base text-stone-800 mb-2 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-green-600" />
                Lembretes Rápidos no WhatsApp (Bebidas)
              </h2>
              <p className="text-xs text-stone-500 mb-4">
                Médiuns pendentes na caixinha de bebidas ({MES_ATUAL}):
              </p>

              {pendentesBebida.length === 0 ? (
                <p className="text-xs text-emerald-700 font-semibold">Todos os médiuns já contribuíram este mês!</p>
              ) : (
                <div className="space-y-2">
                  {pendentesBebida.map(m => (
                    <div key={m.id} className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                      <span className="font-semibold text-stone-800">{m.nome}</span>
                      <button
                        onClick={() => abrirWhatsApp(
                          m.telefone,
                          `Axé, ${m.nome}! Passando para lembrar da contribuição mensal de R$ 10,00 da Caixinha de Bebidas da Casa Bendizer (${MES_ATUAL}).`
                        )}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" /> Cobrar no WhatsApp
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className={`${canPost ? '' : 'lg:col-span-2'} bg-white p-6 rounded-2xl border border-stone-200 shadow-sm`}>
        <h2 className="font-bold text-base text-stone-800 mb-4">Mural de Avisos da Casa Bendizer</h2>
        {notificacoes.length === 0 ? (
          <p className="text-xs text-stone-500 text-center py-8">Nenhum comunicado publicado ainda.</p>
        ) : (
          <div className="space-y-3">
            {notificacoes.map(n => (
              <div key={n.id} className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-sm text-emerald-950">{n.titulo}</h3>
                  <span className="text-[11px] text-stone-400">
                    {new Date(n.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <p className="text-xs text-stone-700 whitespace-pre-line">{n.mensagem}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
