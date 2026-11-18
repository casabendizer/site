import React, { useState, useEffect } from 'react';
import {
  Home, Users, Wine, DollarSign, BookOpen, Music, HeartHandshake, Bell,
  LogOut, Copy, ExternalLink, Calendar, Cake, Shield,
  HeartPulse, Sparkles, Trash2, Send, MessageCircle,
  AlertCircle, CheckCircle2, Lock, Mail, Clock, RefreshCw, BookmarkPlus,
  Check, X, Pencil, PlusCircle, ArrowUpDown, Link2, Settings, Info,
  ChevronLeft, ChevronRight, Repeat
} from 'lucide-react';
import { supabase, isConfigured } from './supabaseClient';

const MES_ATUAL = new Date().toISOString().slice(0, 7);
const MES_NUMERO = new Date().getMonth() + 1;
const DIA_HOJE = new Date().getDate();
const HOJE_STR = new Date().toISOString().slice(0, 10);
const NOME_MES_ATUAL = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function deslocarMesStr(ym, delta) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatarMesAno(ym) {
  const [y, m] = ym.split('-').map(Number);
  return `${MESES_NOMES[m - 1]} de ${y}`;
}

const MODULOS_PERMISSAO = [
  { id: 'cadastros', label: 'Cadastros' },
  { id: 'caixinha', label: 'Caixinha' },
  { id: 'bebidas', label: 'Bebidas' },
  { id: 'biblioteca', label: 'Biblioteca' },
  { id: 'curimba', label: 'Curimba' },
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
  'Malandros',
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
  'Malandro(a)',
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

const CATEGORIAS_FINANCEIRO_PADRAO = [
  'Mensalidade',
  'Água',
  'Luz / Energia',
  'Internet / Telefone',
  'Aluguel',
  'Impostos / Taxas',
  'Itens de Limpeza',
  'Itens de Higiene',
  'Insumos para o Terreiro (Velas, Ervas, Pemba)',
  'Manutenção & Reformas',
  'Festas & Eventos',
  'Doação',
  'Outros'
];

const CARGOS_PADRAO = [
  'Médium de Corrente',
  'Cambono(a)',
  'Ogã / Curimbeiro(a)',
  'Mãe / Pai Pequeno(a)',
  'Secretaria',
  'Administração Geral'
];

const CONFIG_DEFAULT = {
  id: 1,
  nome_casa: 'Casa Bendizer',
  endereco_casa: '',
  horario_gira_padrao: '19:30',
  aviso_boas_vindas: '',
  chave_pix: '',
  favorecido_pix: '',
  valor_mensalidade_padrao: 50,
  valor_bebidas_padrao: 10,
  dia_vencimento: 10,
  prazo_biblioteca_dias: 20,
  permitir_auto_cadastro: true,
  email_admin_boletim: '',
  ultimo_boletim_enviado: '',
  assunto_boletim_padrao: '',
  mensagem_boletim_padrao: ''
};

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
  const [doacoesPendentes, setDoacoesPendentes] = useState([]);
  const [despesasFixas, setDespesasFixas] = useState([]);
  const [livros, setLivros] = useState([]);
  const [pontos, setPontos] = useState([]);
  const [giras, setGiras] = useState([]);
  const [notificacoes, setNotificacoes] = useState([]);
  const [listasCustom, setListasCustom] = useState([]);
  const [linksImportantes, setLinksImportantes] = useState([]);
  const [configCasa, setConfigCasa] = useState(CONFIG_DEFAULT);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3800);
  };

  useEffect(() => {
    if (!isConfigured) {
      setLoadingAuth(false);
      return;
    }

    supabase.from('configuracoes_casa').select('*').eq('id', 1).maybeSingle().then(({ data }) => {
      if (data) setConfigCasa({ ...CONFIG_DEFAULT, ...data });
    });

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
        resMediums, resBebidas, resFin, resCamp, resDoacoesPend, resDespFixas,
        resLivros, resPontos, resGiras, resNotif, resListas, resLinks, resConfig
      ] = await Promise.all([
        supabase.from('mediums').select('*').order('nome'),
        supabase.from('caixinha_bebidas').select('*'),
        supabase.from('financeiro').select('*').order('data_movimento', { ascending: false }),
        supabase.from('campanhas_doacao').select('*').eq('ativa', true),
        supabase.from('doacoes_pendentes').select('*').order('created_at', { ascending: false }),
        supabase.from('despesas_fixas').select('*').order('dia_vencimento'),
        supabase.from('biblioteca').select('*').order('titulo'),
        supabase.from('curimba_pontos').select('*').order('created_at', { ascending: false }),
        supabase.from('calendario_giras').select('*').order('data_gira'),
        supabase.from('notificacoes').select('*').order('created_at', { ascending: false }),
        supabase.from('configuracoes_listas').select('*').order('created_at'),
        supabase.from('links_importantes').select('*').order('created_at'),
        supabase.from('configuracoes_casa').select('*').eq('id', 1).maybeSingle(),
      ]);

      const allMediums = resMediums.data || [];
      setMediums(allMediums);
      setBebidas(resBebidas.data || []);
      setFinanceiro(resFin.data || []);
      setCampanhas(resCamp.data || []);
      setDoacoesPendentes(resDoacoesPend.data || []);
      setDespesasFixas(resDespFixas.data || []);
      setLivros(resLivros.data || []);
      setPontos(resPontos.data || []);
      setGiras(resGiras.data || []);
      setNotificacoes(resNotif.data || []);
      setListasCustom(resListas.data || []);
      setLinksImportantes(resLinks.data || []);
      if (resConfig.data) {
        setConfigCasa({ ...CONFIG_DEFAULT, ...resConfig.data });
      }

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
          status_medium: 'Ativo',
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

  const salvarConfigCasa = async (novasConfigs) => {
    const { data, error } = await supabase
      .from('configuracoes_casa')
      .upsert([{ id: 1, ...novasConfigs, updated_at: new Date().toISOString() }])
      .select()
      .single();

    if (!error && data) {
      setConfigCasa({ ...CONFIG_DEFAULT, ...data });
      showToast('Configurações salvas com sucesso!');
      return true;
    } else {
      showToast('Erro ao salvar configurações: ' + (error?.message || 'verifique o SQL no Supabase.'));
      return false;
    }
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
      if (configCasa.permitir_auto_cadastro === false) {
        setAuthError('Novos cadastros estão pausados pela Administração da casa.');
        return;
      }
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
            <h1 className="text-2xl font-bold tracking-tight">{configCasa.nome_casa || 'Casa Bendizer'}</h1>
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

  const role = currentUserProfile?.nivel_acesso || 'medium';
  const perms = currentUserProfile?.permissoes || [];
  const isAdmin = role === 'admin';
  const isSecretaria = role === 'secretaria';

  const canCadastros = isAdmin || isSecretaria || perms.includes('cadastros');
  const canCaixinha = isAdmin || isSecretaria || perms.includes('caixinha');
  const canBebidas = isAdmin || isSecretaria || perms.includes('bebidas');
  const canBiblioteca = isAdmin || isSecretaria || perms.includes('biblioteca');
  const canCurimba = isAdmin || isSecretaria || perms.includes('curimba');

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

  const cargosLista = Array.from(new Set([
    ...CARGOS_PADRAO,
    ...listasCustom.filter(l => l.tipo === 'cargo_casa').map(l => l.valor)
  ]));

  // Cálculos consolidados de saldos (Principal, Bebidas acumulado, Caixinhas)
  const valorBebidaUnitario = Number(configCasa.valor_bebidas_padrao || 10);
  const totalArrecadadoBebidasGeral = bebidas
    .filter(b => b.pago)
    .reduce((acc, b) => acc + Number(b.valor || valorBebidaUnitario), 0);
  const totalGastoBebidasGeral = financeiro
    .filter(f => f.categoria === 'Compra Bebidas' && (f.status_lancamento || 'efetivado') === 'efetivado')
    .reduce((acc, f) => acc + Number(f.valor || 0), 0);
  const saldoAcumuladoBebidas = totalArrecadadoBebidasGeral - totalGastoBebidasGeral;

  const saldoTotalCaixinhas = campanhas.reduce((acc, c) => acc + Number(c.arrecadado || 0), 0);

  const movsFinanceiroEfetivados = financeiro.filter(
    f => f.categoria !== 'Compra Bebidas' && (f.status_lancamento || 'efetivado') === 'efetivado'
  );
  const entradasPrincipal = movsFinanceiroEfetivados
    .filter(f => f.tipo === 'entrada')
    .reduce((a, b) => a + Number(b.valor || 0), 0);
  const saidasPrincipal = movsFinanceiroEfetivados
    .filter(f => f.tipo === 'saida')
    .reduce((a, b) => a + Number(b.valor || 0), 0);
  const saldoPrincipal = entradasPrincipal - saidasPrincipal;

  const boletimPendenteMes = isAdmin && configCasa.ultimo_boletim_enviado !== MES_ATUAL;
  const doacoesAguardandoCount = doacoesPendentes.filter(d => d.status === 'pendente').length;

  const navItems = [
    { id: 'home', label: 'Início', icon: Home },
    { id: 'mediums', label: canCadastros ? 'Médiuns' : 'Minha Ficha', icon: Users },
    ...(canBebidas ? [{ id: 'bebidas', label: 'Bebidas', icon: Wine }] : []),
    ...(canCaixinha ? [{ id: 'financeiro', label: 'Financeiro', icon: DollarSign }] : []),
    { id: 'doacoes', label: 'Caixinha', icon: HeartHandshake, badge: canCaixinha && doacoesAguardandoCount > 0 },
    { id: 'curimba', label: 'Curimba', icon: Music },
    { id: 'biblioteca', label: 'Biblioteca', icon: BookOpen },
    { id: 'mensagens', label: 'Avisos', icon: Bell },
    ...(isAdmin ? [{ id: 'configuracoes', label: 'Configurações', icon: Settings, badge: boletimPendenteMes }] : []),
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
              <h1 className="font-bold text-lg leading-tight">{configCasa.nome_casa || 'Casa Bendizer'}</h1>
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
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition relative ${
                    active
                      ? 'bg-amber-400 text-emerald-950 shadow-sm'
                      : 'text-emerald-100 hover:bg-emerald-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {item.badge && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  )}
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
            saldoAcumuladoBebidas={saldoAcumuladoBebidas}
            campanhas={campanhas}
            notificacoes={notificacoes}
            linksImportantes={linksImportantes}
            setLinksImportantes={setLinksImportantes}
            configCasa={configCasa}
            isAdmin={isAdmin}
            canCadastros={canCadastros}
            canBebidas={canBebidas}
            setActiveTab={setActiveTab}
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
            cargosLista={cargosLista}
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
            configCasa={configCasa}
            saldoAcumuladoTotal={saldoAcumuladoBebidas}
            showToast={showToast}
          />
        )}
        {activeTab === 'financeiro' && canCaixinha && (
          <FinanceiroTab
            mediums={mediums}
            financeiro={financeiro}
            setFinanceiro={setFinanceiro}
            despesasFixas={despesasFixas}
            setDespesasFixas={setDespesasFixas}
            saldoPrincipal={saldoPrincipal}
            saldoAcumuladoBebidas={saldoAcumuladoBebidas}
            saldoTotalCaixinhas={saldoTotalCaixinhas}
            campanhas={campanhas}
            currentUser={currentUserProfile}
            configCasa={configCasa}
            setActiveTab={setActiveTab}
            showToast={showToast}
          />
        )}
        {activeTab === 'doacoes' && (
          <DoacoesTab
            campanhas={campanhas}
            setCampanhas={setCampanhas}
            doacoesPendentes={doacoesPendentes}
            setDoacoesPendentes={setDoacoesPendentes}
            financeiro={financeiro}
            setFinanceiro={setFinanceiro}
            currentUser={currentUserProfile}
            canCaixinha={canCaixinha}
            categoriasCaixinha={categoriasCaixinha}
            configCasa={configCasa}
            showToast={showToast}
          />
        )}
        {activeTab === 'curimba' && (
          <CurimbaTab
            pontos={pontos}
            setPontos={setPontos}
            currentUser={currentUserProfile}
            canCurimba={canCurimba}
            linhasCurimba={linhasCurimba}
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
            canBiblioteca={canBiblioteca}
            categoriasBiblioteca={categoriasBiblioteca}
            prazoDias={Number(configCasa.prazo_biblioteca_dias) || 20}
            showToast={showToast}
          />
        )}
        {activeTab === 'mensagens' && (
          <MensagensTab
            notificacoes={notificacoes}
            setNotificacoes={setNotificacoes}
            mediums={mediums}
            bebidas={bebidas}
            configCasa={configCasa}
            canCadastros={canCadastros}
            canBebidas={canBebidas}
            showToast={showToast}
          />
        )}
        {activeTab === 'configuracoes' && isAdmin && (
          <ConfiguracoesTab
            configCasa={configCasa}
            salvarConfigCasa={salvarConfigCasa}
            mediums={mediums}
            setMediums={setMediums}
            giras={giras}
            listasCustom={listasCustom}
            onAddLista={adicionarItemLista}
            onRemoveLista={removerItemLista}
            currentUser={currentUserProfile}
            showToast={showToast}
          />
        )}
      </main>
    </div>
  );
}

/* ===================== COMPONENTE AUXILIAR: PIX DA CASA ===================== */
function PixBanner({ configCasa, showToast }) {
  if (!configCasa?.chave_pix) return null;
  return (
    <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-xs font-bold text-amber-950">Chave PIX Oficial • {configCasa.nome_casa || 'Casa Bendizer'}</p>
        <p className="text-xs text-amber-900 mt-0.5">
          <strong>Chave:</strong> {configCasa.chave_pix}
          {configCasa.favorecido_pix && <span> • <strong>Favorecido:</strong> {configCasa.favorecido_pix}</span>}
        </p>
      </div>
      <button
        type="button"
        onClick={() => { navigator.clipboard.writeText(configCasa.chave_pix); showToast('Chave PIX copiada!'); }}
        className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
      >
        <Copy className="w-3.5 h-3.5" /> Copiar Chave PIX
      </button>
    </div>
  );
}

/* ===================== 1. ABA INÍCIO (HOME) ===================== */
function HomeTab({
  giras, setGiras, mediums, bebidas, saldoAcumuladoBebidas, campanhas, notificacoes,
  linksImportantes, setLinksImportantes, configCasa, isAdmin, canCadastros, canBebidas, setActiveTab, showToast
}) {
  const [novaGira, setNovaGira] = useState({
    titulo: '', data_gira: '', horario: configCasa.horario_gira_padrao || '19:30', tipo: 'Gira de Atendimento'
  });
  const [novoLink, setNovoLink] = useState({ titulo: '', url: '', descricao: '' });

  // Navegação mensal independente para Aniversariantes e Calendário
  const [mesAniversario, setMesAniversario] = useState(MES_NUMERO);
  const [mesCalendario, setMesCalendario] = useState(MES_ATUAL);
  const [verTodasGiras, setVerTodasGiras] = useState(false);

  const avancarMesAniversario = (delta) => {
    let novo = mesAniversario + delta;
    if (novo < 1) novo = 12;
    if (novo > 12) novo = 1;
    setMesAniversario(novo);
  };

  const aniversariantes = mediums
    .filter(m => {
      if (!m.data_nascimento) return false;
      const mes = parseInt(m.data_nascimento.split('-')[1], 10);
      return mes === mesAniversario;
    })
    .sort((a, b) => a.data_nascimento.split('-')[2].localeCompare(b.data_nascimento.split('-')[2]));

  const girasExibidas = verTodasGiras
    ? giras
    : giras.filter(g => (g.data_gira || '').startsWith(mesCalendario));

  const mediumsAtivos = mediums.filter(m => (m.status_medium || 'Ativo') === 'Ativo');
  const totalBebidasPagasMes = bebidas.filter(b => b.mes_referencia === MES_ATUAL && b.pago).length;
  const totalCaixinha = campanhas.reduce((acc, c) => acc + Number(c.arrecadado || 0), 0);
  const boletimPendente = isAdmin && configCasa.ultimo_boletim_enviado !== MES_ATUAL;

  const adicionarGira = async (e) => {
    e.preventDefault();
    if (!novaGira.titulo || !novaGira.data_gira) return;
    const { data, error } = await supabase.from('calendario_giras').insert([novaGira]).select().single();
    if (!error && data) {
      setGiras([...giras, data].sort((a, b) => a.data_gira.localeCompare(b.data_gira)));
      setMesCalendario(data.data_gira.slice(0, 7));
      setNovaGira({ titulo: '', data_gira: '', horario: configCasa.horario_gira_padrao || '19:30', tipo: 'Gira de Atendimento' });
      showToast('Gira adicionada ao calendário!');
    }
  };

  const removerGira = async (id) => {
    await supabase.from('calendario_giras').delete().eq('id', id);
    setGiras(giras.filter(g => g.id !== id));
    showToast('Evento removido.');
  };

  const adicionarLink = async (e) => {
    e.preventDefault();
    if (!novoLink.titulo || !novoLink.url) return;
    const urlFormatada = novoLink.url.startsWith('http') ? novoLink.url : `https://${novoLink.url}`;
    const { data, error } = await supabase
      .from('links_importantes')
      .insert([{ titulo: novoLink.titulo, url: urlFormatada, descricao: novoLink.descricao }])
      .select()
      .single();
    if (!error && data) {
      setLinksImportantes([...linksImportantes, data]);
      setNovoLink({ titulo: '', url: '', descricao: '' });
      showToast('Link importante adicionado!');
    }
  };

  const removerLink = async (id) => {
    await supabase.from('links_importantes').delete().eq('id', id);
    setLinksImportantes(linksImportantes.filter(l => l.id !== id));
    showToast('Link removido.');
  };

  return (
    <div className="space-y-6">
      {boletimPendente && (
        <div className="bg-amber-50 border border-amber-300 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Mail className="w-5 h-5 text-amber-700 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-950">
                {DIA_HOJE === 1 ? 'Hoje é dia 1º! ' : ''}Boletim Mensal de {NOME_MES_ATUAL} pronto para envio
              </p>
              <p className="text-xs text-amber-800">
                Envie o e-mail com o calendário de giras e aniversariantes do mês para todos os médiuns e administração.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('configuracoes')}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-xl"
          >
            Abrir e Enviar Boletim
          </button>
        </div>
      )}

      {configCasa.aviso_boas_vindas && (
        <div className="bg-emerald-900 text-white p-4 rounded-2xl shadow-sm flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-bold text-amber-300 uppercase tracking-wider mb-0.5">Orientações da Casa</p>
            <p className="whitespace-pre-line">{configCasa.aviso_boas_vindas}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <p className="text-xs font-semibold text-stone-500 uppercase">Corrente Ativa</p>
          <p className="text-2xl font-bold text-emerald-900 mt-1">{mediumsAtivos.length} Médiuns</p>
          <p className="text-xs text-stone-500 mt-1">Total cadastrados: {mediums.length}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <p className="text-xs font-semibold text-stone-500 uppercase">Caixinha (Transparência)</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">R$ {totalCaixinha.toFixed(2)}</p>
          <p className="text-xs text-stone-500 mt-1">{campanhas.length} caixinha(s) ativa(s)</p>
        </div>

        {canBebidas ? (
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
            <p className="text-xs font-semibold text-stone-500 uppercase">Bebidas ({MES_ATUAL})</p>
            <p className="text-2xl font-bold text-stone-800 mt-1">{totalBebidasPagasMes} / {mediumsAtivos.length} Pagos</p>
            <p className="text-xs text-stone-500 mt-1">Saldo acumulado: R$ {saldoAcumuladoBebidas.toFixed(2)}</p>
          </div>
        ) : (
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
            <p className="text-xs font-semibold text-stone-500 uppercase">Giras no Calendário</p>
            <p className="text-2xl font-bold text-stone-800 mt-1">{giras.length} Agendadas</p>
            <p className="text-xs text-stone-500 mt-1">Navegue pelos meses abaixo</p>
          </div>
        )}
      </div>

      {/* Transparência da Caixinha na Página Inicial */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="font-bold text-base text-stone-800 flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-amber-600" />
              Transparência • Caixinha da {configCasa.nome_casa || 'Casa Bendizer'}
            </h2>
            <p className="text-xs text-stone-500">Acompanhe o saldo e o andamento das arrecadações da nossa casa</p>
          </div>
          <button
            onClick={() => setActiveTab('doacoes')}
            className="px-3.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 font-semibold rounded-xl text-xs transition"
          >
            Ver Caixinhas / Contribuir
          </button>
        </div>

        {campanhas.length === 0 ? (
          <p className="text-xs text-stone-500">Nenhuma caixinha ativa cadastrada no momento.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campanhas.map(c => {
              const pct = Math.min(100, Math.round((Number(c.arrecadado) / Math.max(1, Number(c.meta))) * 100));
              return (
                <div key={c.id} className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-sm text-stone-800">{c.titulo}</h3>
                    <span className="text-[11px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                      {pct}%
                    </span>
                  </div>
                  <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-700 h-full" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-[11px] font-semibold text-stone-600">
                    <span>Atual: R$ {Number(c.arrecadado).toFixed(2)}</span>
                    <span>Meta: R$ {Number(c.meta).toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Links Importantes na Página Inicial */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
        <h2 className="font-bold text-base text-stone-800 flex items-center gap-2 mb-3">
          <Link2 className="w-5 h-5 text-emerald-700" />
          Links Importantes
        </h2>

        {canCadastros && (
          <form onSubmit={adicionarLink} className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4 bg-stone-50 p-3 rounded-xl border border-stone-200">
            <input
              type="text"
              required
              placeholder="Título (Ex: Grupo WhatsApp, Drive)"
              value={novoLink.titulo}
              onChange={e => setNovoLink({ ...novoLink, titulo: e.target.value })}
              className="px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white"
            />
            <input
              type="text"
              required
              placeholder="Link / URL (https://...)"
              value={novoLink.url}
              onChange={e => setNovoLink({ ...novoLink, url: e.target.value })}
              className="px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white"
            />
            <input
              type="text"
              placeholder="Descrição curta (opcional)"
              value={novoLink.descricao}
              onChange={e => setNovoLink({ ...novoLink, descricao: e.target.value })}
              className="px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white"
            />
            <button type="submit" className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg px-3 py-2">
              + Adicionar Link
            </button>
          </form>
        )}

        {linksImportantes.length === 0 ? (
          <p className="text-xs text-stone-500">Nenhum link importante cadastrado ainda.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {linksImportantes.map(link => (
              <div key={link.id} className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 min-w-0 pr-2 group"
                >
                  <p className="font-bold text-sm text-emerald-950 group-hover:underline flex items-center gap-1.5 truncate">
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    {link.titulo}
                  </p>
                  {link.descricao && (
                    <p className="text-xs text-stone-600 mt-0.5 truncate">{link.descricao}</p>
                  )}
                </a>
                {canCadastros && (
                  <button onClick={() => removerLink(link.id)} className="text-stone-400 hover:text-rose-600 p-1" title="Remover link">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Calendário com Navegação Mensal + Aniversariantes com Navegação Mensal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="font-bold text-lg text-stone-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-700" />
              Calendário de Giras & Eventos
            </h2>

            <div className="flex items-center gap-1.5">
              {!verTodasGiras && (
                <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
                  <button
                    type="button"
                    onClick={() => setMesCalendario(deslocarMesStr(mesCalendario, -1))}
                    className="p-1.5 hover:bg-white rounded-lg text-stone-700 transition"
                    title="Mês anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 text-xs font-bold text-stone-800 min-w-[125px] text-center">
                    {formatarMesAno(mesCalendario)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMesCalendario(deslocarMesStr(mesCalendario, 1))}
                    className="p-1.5 hover:bg-white rounded-lg text-stone-700 transition"
                    title="Próximo mês"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setVerTodasGiras(!verTodasGiras)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  verTodasGiras
                    ? 'bg-emerald-900 text-white border-emerald-900'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                }`}
              >
                {verTodasGiras ? 'Filtrar por Mês' : 'Ver Todas'}
              </button>
            </div>
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

          {girasExibidas.length === 0 ? (
            <p className="text-sm text-stone-500 py-8 text-center">
              {verTodasGiras
                ? 'Nenhuma gira cadastrada no calendário ainda.'
                : `Nenhuma gira agendada para ${formatarMesAno(mesCalendario)}. Use as setas acima para navegar entre os meses.`}
            </p>
          ) : (
            <div className="space-y-3">
              {girasExibidas.map(g => (
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
                      <p className="text-xs text-stone-500">
                        {g.data_gira.split('-').reverse().join('/')} • Horário: {g.horario} • {g.tipo}
                      </p>
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
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="font-bold text-base text-stone-800 flex items-center gap-1.5">
                <Cake className="w-5 h-5 text-amber-600 shrink-0" />
                Aniversariantes
              </h2>
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
                <button
                  type="button"
                  onClick={() => avancarMesAniversario(-1)}
                  className="p-1 hover:bg-white rounded-lg text-stone-700 transition"
                  title="Mês anterior"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 text-xs font-bold text-stone-800 min-w-[78px] text-center">
                  {MESES_NOMES[mesAniversario - 1]}
                </span>
                <button
                  type="button"
                  onClick={() => avancarMesAniversario(1)}
                  className="p-1 hover:bg-white rounded-lg text-stone-700 transition"
                  title="Próximo mês"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {aniversariantes.length === 0 ? (
              <p className="text-xs text-stone-500 py-2">Nenhum aniversariante em {MESES_NOMES[mesAniversario - 1]}.</p>
            ) : (
              <div className="space-y-2.5">
                {aniversariantes.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60">
                    <div>
                      <p className="text-sm font-semibold text-stone-800">{a.nome}</p>
                      <p className="text-xs text-amber-800">Dia {a.data_nascimento.split('-')[2]} de {MESES_NOMES[mesAniversario - 1]}</p>
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

/* ===================== 2. ABA MÉDIUNS ===================== */
function MediumsTab({
  mediums, setMediums, currentUser, setCurrentUser, isAdmin, canCadastros,
  linhasEntidade, cargosLista, showToast
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
        status_medium: form.status_medium || 'Ativo',
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
    } else if (error) {
      showToast('Erro ao salvar: ' + error.message);
    }
  };

  const excluirMedium = async (mediumToDelete) => {
    if (mediumToDelete.id === currentUser?.id) {
      showToast('Você não pode excluir o seu próprio cadastro logado.');
      return;
    }
    if (!window.confirm(`Tem certeza que deseja excluir o cadastro de "${mediumToDelete.nome}"?`)) return;

    const { error } = await supabase.from('mediums').delete().eq('id', mediumToDelete.id);
    if (!error) {
      const restantes = mediums.filter(m => m.id !== mediumToDelete.id);
      setMediums(restantes);
      setSelectedId(currentUser?.id);
      showToast('Cadastro excluído com sucesso.');
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

  const badgeStatus = (st) => {
    const status = st || 'Ativo';
    if (status === 'Ativo') return 'bg-emerald-100 text-emerald-800';
    if (status === 'Afastado') return 'bg-amber-100 text-amber-800';
    return 'bg-rose-100 text-rose-800';
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
            {mediums.map(m => {
              const st = m.status_medium || 'Ativo';
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition ${
                    form.id === m.id
                      ? 'bg-emerald-900 text-white font-semibold'
                      : 'hover:bg-stone-100 text-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <p className="truncate">{m.nome}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${form.id === m.id ? 'bg-white/20 text-amber-200' : badgeStatus(st)}`}>
                      {st}
                    </span>
                  </div>
                  <p className={`text-[11px] mt-0.5 ${form.id === m.id ? 'text-amber-300' : 'text-stone-400'}`}>
                    {m.cargo}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className={`${canCadastros ? 'lg:col-span-3' : 'lg:col-span-4'} bg-white rounded-2xl border border-stone-200 p-6 shadow-sm`}>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-stone-800">{form.nome}</h2>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${badgeStatus(form.status_medium)}`}>
                {form.status_medium || 'Ativo'}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">{form.email} • {form.cargo}</p>
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

                {canCadastros && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">Situação na Corrente</label>
                    <select
                      value={form.status_medium || 'Ativo'}
                      onChange={e => setForm({ ...form, status_medium: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm bg-white"
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Afastado">Afastado</option>
                      <option value="Suspenso">Suspenso</option>
                    </select>
                  </div>
                )}
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
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">Cargo na Casa</label>
                    <input
                      list="lista-cargos"
                      disabled={!canCadastros}
                      value={form.cargo || ''}
                      onChange={e => setForm({ ...form, cargo: e.target.value })}
                      placeholder="Escolha ou digite o cargo"
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm bg-white disabled:bg-stone-100"
                    />
                    <datalist id="lista-cargos">
                      {cargosLista.map(c => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                  {canCadastros && (
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">Situação na Corrente</label>
                      <select
                        value={form.status_medium || 'Ativo'}
                        onChange={e => setForm({ ...form, status_medium: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm bg-white"
                      >
                        <option value="Ativo">Ativo</option>
                        <option value="Afastado">Afastado</option>
                        <option value="Suspenso">Suspenso</option>
                      </select>
                    </div>
                  )}
                  {isAdmin && (
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">Perfil Principal no Sistema</label>
                      <select
                        value={form.nivel_acesso || 'medium'}
                        onChange={e => setForm({ ...form, nivel_acesso: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm bg-white"
                      >
                        <option value="medium">Médium (Com permissões abaixo)</option>
                        <option value="secretaria">Secretaria (Acesso completo)</option>
                        <option value="admin">Administrador Geral (Total)</option>
                      </select>
                    </div>
                  )}
                </div>

                {isAdmin && form.nivel_acesso === 'medium' && (
                  <div className="pt-3 border-t border-stone-200">
                    <p className="text-xs font-bold text-emerald-950 mb-2 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-emerald-700" />
                      Permissões Individuais por Setor:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {MODULOS_PERMISSAO.map(mod => {
                        const checked = (form.permissoes || []).includes(mod.id);
                        return (
                          <label
                            key={mod.id}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer transition ${
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
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            {canCadastros && !isOwnProfile ? (
              <button
                type="button"
                onClick={() => excluirMedium(form)}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-4 h-4" /> Excluir Cadastro do Médium
              </button>
            ) : <div />}

            <button type="submit" className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-xl text-sm transition">
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ===================== 3. ABA BEBIDAS (NAVEGAÇÃO MENSAL + SALDO ACUMULADO) ===================== */
function BebidasTab({
  mediums, bebidas, setBebidas, financeiro, setFinanceiro,
  currentUser, configCasa, saldoAcumuladoTotal, showToast
}) {
  const [mesSelecionado, setMesSelecionado] = useState(MES_ATUAL);
  const [compraDesc, setCompraDesc] = useState('');
  const [compraValor, setCompraValor] = useState('');

  const valorUnitario = Number(configCasa.valor_bebidas_padrao || 10);

  // Movimentos do mês selecionado
  const bebidasMes = bebidas.filter(b => b.mes_referencia === mesSelecionado);
  const comprasBebidasMes = financeiro.filter(
    f => f.categoria === 'Compra Bebidas' && (f.data_movimento || '').startsWith(mesSelecionado)
  );

  const arrecadadoMes = bebidasMes
    .filter(b => b.pago)
    .reduce((acc, b) => acc + Number(b.valor || valorUnitario), 0);
  const gastoMes = comprasBebidasMes.reduce((acc, item) => acc + Number(item.valor || 0), 0);

  // Saldo acumulado de meses anteriores ao mês selecionado
  const arrecadadoAnteriores = bebidas
    .filter(b => b.pago && b.mes_referencia < mesSelecionado)
    .reduce((acc, b) => acc + Number(b.valor || valorUnitario), 0);
  const gastoAnteriores = financeiro
    .filter(f => f.categoria === 'Compra Bebidas' && (f.data_movimento || '').slice(0, 7) < mesSelecionado)
    .reduce((acc, f) => acc + Number(f.valor || 0), 0);
  const saldoAnterior = arrecadadoAnteriores - gastoAnteriores;
  const saldoFinalMes = saldoAnterior + arrecadadoMes - gastoMes;

  const togglePagamento = async (mediumId) => {
    const existente = bebidasMes.find(b => b.medium_id === mediumId);
    if (existente) {
      const novoStatus = !existente.pago;
      const { data } = await supabase
        .from('caixinha_bebidas')
        .update({
          pago: novoStatus,
          valor: valorUnitario,
          data_pagamento: novoStatus ? HOJE_STR : null
        })
        .eq('id', existente.id)
        .select()
        .single();
      if (data) {
        setBebidas(bebidas.map(b => b.id === data.id ? data : b));
        showToast(novoStatus ? `Pagamento de R$ ${valorUnitario.toFixed(2)} confirmado!` : 'Status alterado para pendente.');
      }
    } else {
      const { data } = await supabase
        .from('caixinha_bebidas')
        .insert([{
          medium_id: mediumId,
          mes_referencia: mesSelecionado,
          valor: valorUnitario,
          pago: true,
          data_pagamento: HOJE_STR
        }])
        .select()
        .single();
      if (data) {
        setBebidas([...bebidas, data]);
        showToast(`Pagamento de R$ ${valorUnitario.toFixed(2)} confirmado!`);
      }
    }
  };

  const registrarCompra = async (e) => {
    e.preventDefault();
    if (!compraDesc || !compraValor) return;
    const dataLanc = mesSelecionado === MES_ATUAL ? HOJE_STR : `${mesSelecionado}-01`;
    const { data } = await supabase
      .from('financeiro')
      .insert([{
        tipo: 'saida',
        categoria: 'Compra Bebidas',
        descricao: compraDesc,
        valor: parseFloat(compraValor),
        data_movimento: dataLanc,
        status_lancamento: 'efetivado',
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

  const excluirCompra = async (id) => {
    await supabase.from('financeiro').delete().eq('id', id);
    setFinanceiro(financeiro.filter(f => f.id !== id));
    showToast('Compra excluída.');
  };

  return (
    <div className="space-y-6">
      <PixBanner configCasa={configCasa} showToast={showToast} />

      {/* Navegador de Mês */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-base text-stone-800 flex items-center gap-2">
            <Wine className="w-5 h-5 text-amber-600" />
            Controle de Bebidas • Contribuição: R$ {valorUnitario.toFixed(2)}
          </h2>
          <p className="text-xs text-stone-500">O saldo positivo acumula automaticamente para os próximos meses</p>
        </div>

        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200">
          <button
            type="button"
            onClick={() => setMesSelecionado(deslocarMesStr(mesSelecionado, -1))}
            className="p-1.5 hover:bg-white rounded-lg text-stone-700"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 text-xs font-bold text-stone-800 min-w-[135px] text-center">
            {formatarMesAno(mesSelecionado)}
          </span>
          <button
            type="button"
            onClick={() => setMesSelecionado(deslocarMesStr(mesSelecionado, 1))}
            className="p-1.5 hover:bg-white rounded-lg text-stone-700"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cards de Resumo com Saldo Acumulado */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <p className="text-[11px] font-semibold text-stone-500 uppercase">Saldo Anterior Acumulado</p>
          <p className="text-xl font-bold text-stone-700 mt-1">R$ {saldoAnterior.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <p className="text-[11px] font-semibold text-stone-500 uppercase">Arrecadado no Mês</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">+ R$ {arrecadadoMes.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <p className="text-[11px] font-semibold text-stone-500 uppercase">Compras no Mês</p>
          <p className="text-xl font-bold text-rose-700 mt-1">- R$ {gastoMes.toFixed(2)}</p>
        </div>
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-300 shadow-sm">
          <p className="text-[11px] font-bold text-amber-900 uppercase">Saldo Acumulado Final</p>
          <p className="text-xl font-bold text-amber-950 mt-1">R$ {saldoFinalMes.toFixed(2)}</p>
          {mesSelecionado !== MES_ATUAL && (
            <p className="text-[10px] text-amber-800 mt-0.5">Saldo atual geral: R$ {saldoAcumuladoTotal.toFixed(2)}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <h3 className="font-bold text-base text-stone-800 mb-1">
            Pagamentos de {formatarMesAno(mesSelecionado)}
          </h3>
          <p className="text-xs text-stone-500 mb-4">Vencimento dia {configCasa.dia_vencimento || 10}</p>

          <div className="space-y-2">
            {mediums.map(m => {
              const reg = bebidasMes.find(b => b.medium_id === m.id);
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
                    {pago ? `✓ Pago (R$ ${Number(reg.valor || valorUnitario).toFixed(2)})` : 'Pendente'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <h3 className="font-bold text-base text-stone-800 mb-4">
            Compras de Bebidas ({formatarMesAno(mesSelecionado)})
          </h3>

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
            {comprasBebidasMes.length === 0 ? (
              <p className="text-xs text-stone-500 text-center py-6">Nenhuma compra registrada neste mês.</p>
            ) : (
              comprasBebidasMes.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                  <div>
                    <p className="font-semibold text-stone-800">{c.descricao}</p>
                    <p className="text-stone-400">{c.data_movimento}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-rose-700">- R$ {Number(c.valor).toFixed(2)}</span>
                    <button onClick={() => excluirCompra(c.id)} className="text-stone-400 hover:text-rose-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== 4. ABA FINANCEIRO (TODOS OS SALDOS, DESPESAS FIXAS, LANÇAMENTOS FUTUROS E MESES) ===================== */
function FinanceiroTab({
  mediums, financeiro, setFinanceiro, despesasFixas, setDespesasFixas,
  saldoPrincipal, saldoAcumuladoBebidas, saldoTotalCaixinhas, campanhas,
  currentUser, configCasa, setActiveTab, showToast
}) {
  const [mesSelecionado, setMesSelecionado] = useState(MES_ATUAL);
  const [valorMensalidadePadrao, setValorMensalidadePadrao] = useState(
    String(Number(configCasa.valor_mensalidade_padrao || 50).toFixed(2))
  );

  // Formulário de Lançamento (atual ou futuro)
  const [form, setForm] = useState({
    tipo: 'saida',
    categoria: 'Luz / Energia',
    descricao: '',
    valor: '',
    data_movimento: HOJE_STR,
    status_lancamento: 'efetivado'
  });

  // Formulário de Despesa Fixa Recorrente
  const [novaFixa, setNovaFixa] = useState({
    titulo: '',
    categoria: 'Aluguel',
    valor: '',
    dia_vencimento: 10
  });

  useEffect(() => {
    setValorMensalidadePadrao(String(Number(configCasa.valor_mensalidade_padrao || 50).toFixed(2)));
  }, [configCasa.valor_mensalidade_padrao]);

  const movsGerais = financeiro.filter(f => f.categoria !== 'Compra Bebidas');
  const movsDoMes = movsGerais.filter(f => (f.data_movimento || '').startsWith(mesSelecionado));

  const entradasMesEfetivadas = movsDoMes
    .filter(f => f.tipo === 'entrada' && (f.status_lancamento || 'efetivado') === 'efetivado')
    .reduce((a, b) => a + Number(b.valor || 0), 0);

  const saidasMesEfetivadas = movsDoMes
    .filter(f => f.tipo === 'saida' && (f.status_lancamento || 'efetivado') === 'efetivado')
    .reduce((a, b) => a + Number(b.valor || 0), 0);

  const lancamentosFuturosPendentes = movsGerais
    .filter(f => (f.status_lancamento || 'efetivado') === 'pendente')
    .sort((a, b) => (a.data_movimento || '').localeCompare(b.data_movimento || ''));

  const mensalidadesMes = movsDoMes.filter(f => f.categoria === 'Mensalidade');

  const toggleMensalidadeMedium = async (m) => {
    const registroExistente = mensalidadesMes.find(item => item.descricao === `Mensalidade (${mesSelecionado}) - ${m.nome}`);
    if (registroExistente) {
      await supabase.from('financeiro').delete().eq('id', registroExistente.id);
      setFinanceiro(financeiro.filter(f => f.id !== registroExistente.id));
      showToast(`Mensalidade de ${m.nome} marcada como pendente.`);
    } else {
      const val = parseFloat(valorMensalidadePadrao) || 50;
      const dataLanc = mesSelecionado === MES_ATUAL ? HOJE_STR : `${mesSelecionado}-10`;
      const { data } = await supabase
        .from('financeiro')
        .insert([{
          tipo: 'entrada',
          categoria: 'Mensalidade',
          descricao: `Mensalidade (${mesSelecionado}) - ${m.nome}`,
          valor: val,
          data_movimento: dataLanc,
          status_lancamento: 'efetivado',
          registrado_por: currentUser?.nome
        }])
        .select()
        .single();
      if (data) {
        setFinanceiro([data, ...financeiro]);
        showToast(`Mensalidade de ${m.nome} (R$ ${val.toFixed(2)}) registrada!`);
      }
    }
  };

  const adicionarMovimento = async (e) => {
    e.preventDefault();
    if (!form.descricao || !form.valor) return;

    const isDataFutura = form.data_movimento > HOJE_STR;
    const statusFinal = isDataFutura && form.status_lancamento === 'efetivado' ? 'pendente' : form.status_lancamento;

    const payload = {
      tipo: form.tipo,
      categoria: form.categoria,
      descricao: form.descricao,
      valor: parseFloat(form.valor),
      data_movimento: form.data_movimento || HOJE_STR,
      status_lancamento: statusFinal,
      registrado_por: currentUser?.nome
    };

    let res = await supabase.from('financeiro').insert([payload]).select().single();
    if (res.error) {
      // Fallback caso status_lancamento ainda não exista
      const { status_lancamento, ...semStatus } = payload;
      res = await supabase.from('financeiro').insert([semStatus]).select().single();
    }

    if (!res.error && res.data) {
      setFinanceiro([res.data, ...financeiro]);
      setMesSelecionado((res.data.data_movimento || MES_ATUAL).slice(0, 7));
      setForm({
        tipo: 'saida',
        categoria: 'Luz / Energia',
        descricao: '',
        valor: '',
        data_movimento: HOJE_STR,
        status_lancamento: 'efetivado'
      });
      showToast(statusFinal === 'pendente' ? 'Lançamento futuro agendado!' : 'Lançamento financeiro registrado!');
    }
  };

  const efetivarLancamentoFuturo = async (item) => {
    const { data } = await supabase
      .from('financeiro')
      .update({ status_lancamento: 'efetivado' })
      .eq('id', item.id)
      .select()
      .single();

    if (data) {
      setFinanceiro(financeiro.map(f => f.id === item.id ? data : f));
      showToast('Lançamento confirmado no saldo!');
    }
  };

  const excluirMovimento = async (id) => {
    await supabase.from('financeiro').delete().eq('id', id);
    setFinanceiro(financeiro.filter(f => f.id !== id));
    showToast('Lançamento excluído.');
  };

  // Despesas Fixas
  const criarDespesaFixa = async (e) => {
    e.preventDefault();
    if (!novaFixa.titulo || !novaFixa.valor) return;
    const { data, error } = await supabase
      .from('despesas_fixas')
      .insert([{
        titulo: novaFixa.titulo,
        categoria: novaFixa.categoria,
        valor: parseFloat(novaFixa.valor),
        dia_vencimento: parseInt(novaFixa.dia_vencimento, 10) || 10,
        ativa: true
      }])
      .select()
      .single();

    if (!error && data) {
      setDespesasFixas([...despesasFixas, data]);
      setNovaFixa({ titulo: '', categoria: 'Aluguel', valor: '', dia_vencimento: 10 });
      showToast('Despesa fixa cadastrada!');
    } else if (error) {
      showToast('Erro ao salvar despesa fixa. Rode o SQL atualizado no Supabase.');
    }
  };

  const lancarDespesaFixaNoMes = async (df, comoPendente = false) => {
    const diaStr = String(df.dia_vencimento || 10).padStart(2, '0');
    const dataVenc = `${mesSelecionado}-${diaStr}`;
    const { data } = await supabase
      .from('financeiro')
      .insert([{
        tipo: 'saida',
        categoria: df.categoria,
        descricao: `${df.titulo} (Despesa Fixa - ${mesSelecionado})`,
        valor: Number(df.valor),
        data_movimento: dataVenc,
        status_lancamento: comoPendente ? 'pendente' : 'efetivado',
        registrado_por: currentUser?.nome
      }])
      .select()
      .single();

    if (data) {
      setFinanceiro([data, ...financeiro]);
      showToast(comoPendente ? 'Agendada como previsão futura!' : 'Despesa fixa lançada no mês!');
    }
  };

  const excluirDespesaFixa = async (id) => {
    await supabase.from('despesas_fixas').delete().eq('id', id);
    setDespesasFixas(despesasFixas.filter(d => d.id !== id));
    showToast('Despesa fixa removida.');
  };

  const patrimonioTotal = saldoPrincipal + saldoAcumuladoBebidas + saldoTotalCaixinhas;

  return (
    <div className="space-y-6">
      <PixBanner configCasa={configCasa} showToast={showToast} />

      {/* VISÃO CONSOLIDADA DE TODOS OS SALDOS DA CASA */}
      <div className="bg-emerald-950 text-white p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-amber-300 font-bold">Gestão Centralizada de Saldos</p>
            <h2 className="text-xl font-bold mt-0.5">Visão Geral das Contas da {configCasa.nome_casa || 'Casa Bendizer'}</h2>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-emerald-300 uppercase">Soma Total (Todas as Contas)</p>
            <p className="text-2xl font-bold text-amber-300">R$ {patrimonioTotal.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="bg-emerald-900/80 border border-emerald-800 p-4 rounded-xl">
            <p className="text-[11px] uppercase text-emerald-300 font-semibold">1. Saldo Principal (Financeiro)</p>
            <p className="text-xl font-bold text-white mt-1">R$ {saldoPrincipal.toFixed(2)}</p>
            <p className="text-[11px] text-emerald-300/80 mt-0.5">Mensalidades, contas e despesas gerais</p>
          </div>

          <div
            onClick={() => setActiveTab('bebidas')}
            className="bg-emerald-900/80 border border-emerald-800 hover:border-amber-400/60 p-4 rounded-xl cursor-pointer transition"
          >
            <p className="text-[11px] uppercase text-emerald-300 font-semibold">2. Saldo Acumulado Bebidas</p>
            <p className="text-xl font-bold text-white mt-1">R$ {saldoAcumuladoBebidas.toFixed(2)}</p>
            <p className="text-[11px] text-amber-300 mt-0.5">Clique para abrir detalhes →</p>
          </div>

          <div
            onClick={() => setActiveTab('doacoes')}
            className="bg-emerald-900/80 border border-emerald-800 hover:border-amber-400/60 p-4 rounded-xl cursor-pointer transition"
          >
            <p className="text-[11px] uppercase text-emerald-300 font-semibold">3. Saldo Total das Caixinhas ({campanhas.length})</p>
            <p className="text-xl font-bold text-white mt-1">R$ {saldoTotalCaixinhas.toFixed(2)}</p>
            <p className="text-[11px] text-amber-300 mt-0.5">Clique para gerenciar caixinhas →</p>
          </div>
        </div>
      </div>

      {/* NAVEGAÇÃO ENTRE MESES */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-700" />
          <span className="font-bold text-sm text-stone-800">Período de Análise:</span>
        </div>

        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200">
          <button
            type="button"
            onClick={() => setMesSelecionado(deslocarMesStr(mesSelecionado, -1))}
            className="p-1.5 hover:bg-white rounded-lg text-stone-700"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 text-xs font-bold text-stone-800 min-w-[140px] text-center">
            {formatarMesAno(mesSelecionado)}
          </span>
          <button
            type="button"
            onClick={() => setMesSelecionado(deslocarMesStr(mesSelecionado, 1))}
            className="p-1.5 hover:bg-white rounded-lg text-stone-700"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-4 text-xs">
          <span className="font-semibold text-emerald-700">Entradas Mês: + R$ {entradasMesEfetivadas.toFixed(2)}</span>
          <span className="font-semibold text-rose-700">Saídas Mês: - R$ {saidasMesEfetivadas.toFixed(2)}</span>
        </div>
      </div>

      {/* DESPESAS FIXAS RECORRENTES */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
        <div>
          <h2 className="font-bold text-base text-stone-800 flex items-center gap-2">
            <Repeat className="w-5 h-5 text-emerald-700" />
            Despesas Fixas da Casa (Recorrentes)
          </h2>
          <p className="text-xs text-stone-500">
            Cadastre contas mensais fixas (Água, Luz, Internet, Aluguel, Impostos) e lance ou agende em {formatarMesAno(mesSelecionado)} com 1 clique.
          </p>
        </div>

        <form onSubmit={criarDespesaFixa} className="grid grid-cols-1 sm:grid-cols-5 gap-2 bg-stone-50 p-3 rounded-xl border border-stone-200">
          <input
            type="text"
            required
            placeholder="Nome (Ex: Conta de Luz Enel)"
            value={novaFixa.titulo}
            onChange={e => setNovaFixa({ ...novaFixa, titulo: e.target.value })}
            className="sm:col-span-2 px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white"
          />
          <select
            value={novaFixa.categoria}
            onChange={e => setNovaFixa({ ...novaFixa, categoria: e.target.value })}
            className="px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white"
          >
            {CATEGORIAS_FINANCEIRO_PADRAO.filter(c => c !== 'Mensalidade' && c !== 'Doação').map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <div className="flex gap-1.5">
            <input
              type="number"
              step="0.01"
              required
              placeholder="Valor R$"
              value={novaFixa.valor}
              onChange={e => setNovaFixa({ ...novaFixa, valor: e.target.value })}
              className="w-24 px-2.5 py-2 text-xs border border-stone-200 rounded-lg bg-white"
            />
            <input
              type="number"
              min={1}
              max={31}
              required
              title="Dia do vencimento"
              placeholder="Dia"
              value={novaFixa.dia_vencimento}
              onChange={e => setNovaFixa({ ...novaFixa, dia_vencimento: e.target.value })}
              className="w-16 px-2 py-2 text-xs border border-stone-200 rounded-lg bg-white"
            />
          </div>
          <button type="submit" className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg py-2">
            + Salvar Fixa
          </button>
        </form>

        {despesasFixas.length === 0 ? (
          <p className="text-xs text-stone-500">Nenhuma despesa fixa cadastrada ainda.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {despesasFixas.map(df => {
              const jaLancadaNoMes = movsDoMes.some(m => m.descricao === `${df.titulo} (Despesa Fixa - ${mesSelecionado})`);
              return (
                <div key={df.id} className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                  <div>
                    <p className="font-bold text-stone-800">{df.titulo}</p>
                    <p className="text-stone-500">
                      {df.categoria} • Vence dia {df.dia_vencimento} • <strong>R$ {Number(df.valor).toFixed(2)}</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {jaLancadaNoMes ? (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-bold">✓ Lançada</span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => lancarDespesaFixaNoMes(df, false)}
                          className="px-2.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-lg"
                        >
                          Pagar Mês
                        </button>
                        <button
                          type="button"
                          onClick={() => lancarDespesaFixaNoMes(df, true)}
                          className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 font-semibold rounded-lg"
                          title="Agendar como previsão futura"
                        >
                          Agendar
                        </button>
                      </>
                    )}
                    <button onClick={() => excluirDespesaFixa(df.id)} className="text-stone-400 hover:text-rose-600 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* LANÇAMENTOS FUTUROS / PREVISÕES PENDENTES */}
      {lancamentosFuturosPendentes.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-sm text-amber-950 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-700" />
            Lançamentos Futuros & Contas Agendadas ({lancamentosFuturosPendentes.length})
          </h3>
          <div className="space-y-2">
            {lancamentosFuturosPendentes.map(item => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 bg-white p-3 rounded-xl border border-amber-200 text-xs">
                <div>
                  <span className="font-bold text-stone-800">{item.descricao}</span>
                  <span className="ml-2 px-2 py-0.5 bg-stone-100 rounded text-[10px]">{item.categoria}</span>
                  <p className="text-stone-500 mt-0.5">
                    Data prevista: <strong>{item.data_movimento?.split('-').reverse().join('/')}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${item.tipo === 'entrada' ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {item.tipo === 'entrada' ? '+' : '-'} R$ {Number(item.valor).toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => efetivarLancamentoFuturo(item)}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg"
                  >
                    ✓ Confirmar Pagamento
                  </button>
                  <button onClick={() => excluirMovimento(item.id)} className="text-stone-400 hover:text-rose-600 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTROLE DE MENSALIDADES DO MÊS SELECIONADO */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-bold text-base text-stone-800">Controle de Mensalidades ({formatarMesAno(mesSelecionado)})</h2>
            <p className="text-xs text-stone-500">Vencimento dia {configCasa.dia_vencimento || 10} • Clique para confirmar o pagamento</p>
          </div>
          <div className="flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
            <span className="text-xs font-semibold text-stone-600">Valor padrão (R$):</span>
            <input
              type="number"
              step="0.01"
              value={valorMensalidadePadrao}
              onChange={e => setValorMensalidadePadrao(e.target.value)}
              className="w-20 px-2 py-1 text-xs border border-stone-200 rounded-lg bg-white font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {mediums.map(m => {
            const pagoReg = mensalidadesMes.find(item => item.descricao === `Mensalidade (${mesSelecionado}) - ${m.nome}`);
            const pago = Boolean(pagoReg);
            return (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200">
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-bold text-stone-800 truncate">{m.nome}</p>
                  <p className="text-[11px] text-stone-500 truncate">{m.status_medium || 'Ativo'} • {m.cargo}</p>
                </div>
                <button
                  onClick={() => toggleMensalidadeMedium(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer hover:opacity-80 ${
                    pago
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {pago ? `✓ Pago (R$ ${Number(pagoReg.valor).toFixed(0)})` : 'Pendente'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* NOVO LANÇAMENTO FINANCEIRO (COM CATEGORIAS E DATA) */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
        <h2 className="font-bold text-base text-stone-800 mb-4">
          Lançamentos de {formatarMesAno(mesSelecionado)} (Entradas, Despesas & Futuros)
        </h2>
        <form onSubmit={adicionarMovimento} className="grid grid-cols-1 sm:grid-cols-6 gap-2 mb-5 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
          <select
            value={form.tipo}
            onChange={e => setForm({ ...form, tipo: e.target.value })}
            className="px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white font-semibold"
          >
            <option value="saida">Saída (-)</option>
            <option value="entrada">Entrada (+)</option>
          </select>

          <select
            value={form.categoria}
            onChange={e => setForm({ ...form, categoria: e.target.value })}
            className="px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white"
          >
            {CATEGORIAS_FINANCEIRO_PADRAO.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Descrição (Ex: Papel higiênico, água, velas...)"
            value={form.descricao}
            onChange={e => setForm({ ...form, descricao: e.target.value })}
            className="sm:col-span-2 px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white"
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

          <input
            type="date"
            value={form.data_movimento}
            onChange={e => setForm({ ...form, data_movimento: e.target.value })}
            className="px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white"
            required
          />

          <div className="sm:col-span-4 flex items-center gap-4 pt-1">
            <label className="flex items-center gap-1.5 text-xs text-stone-700 cursor-pointer">
              <input
                type="radio"
                name="statusLanc"
                checked={form.status_lancamento === 'efetivado'}
                onChange={() => setForm({ ...form, status_lancamento: 'efetivado' })}
              />
              Já pago / efetivado
            </label>
            <label className="flex items-center gap-1.5 text-xs text-amber-900 font-medium cursor-pointer">
              <input
                type="radio"
                name="statusLanc"
                checked={form.status_lancamento === 'pendente'}
                onChange={() => setForm({ ...form, status_lancamento: 'pendente' })}
              />
              Lançamento futuro / a pagar
            </label>
          </div>

          <button type="submit" className="sm:col-span-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg py-2">
            + Registrar Lançamento
          </button>
        </form>

        <div className="space-y-2">
          {movsDoMes.length === 0 ? (
            <p className="text-xs text-stone-500 text-center py-6">Nenhuma movimentação registrada em {formatarMesAno(mesSelecionado)}.</p>
          ) : (
            movsDoMes.map(f => {
              const isPendente = (f.status_lancamento || 'efetivado') === 'pendente';
              return (
                <div key={f.id} className={`flex items-center justify-between p-3 rounded-xl border text-xs ${isPendente ? 'bg-amber-50/70 border-amber-200' : 'bg-stone-50 border-stone-200'}`}>
                  <div>
                    <span className="font-bold text-stone-800">{f.descricao}</span>
                    <span className="ml-2 px-2 py-0.5 bg-stone-200 rounded text-[10px]">{f.categoria}</span>
                    {isPendente && (
                      <span className="ml-2 px-2 py-0.5 bg-amber-200 text-amber-950 rounded text-[10px] font-bold">Futuro / Pendente</span>
                    )}
                    <p className="text-stone-400 mt-0.5">{f.data_movimento?.split('-').reverse().join('/')} • {f.registrado_por}</p>
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
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

/* ===================== 5. ABA CAIXINHA DO TERREIRO (COM APROVAÇÃO DE DOAÇÕES) ===================== */
function DoacoesTab({
  campanhas, setCampanhas, doacoesPendentes, setDoacoesPendentes,
  financeiro, setFinanceiro, currentUser,
  canCaixinha, categoriasCaixinha, configCasa, showToast
}) {
  const [valorDoacao, setValorDoacao] = useState('');
  const [obsDoacao, setObsDoacao] = useState('');
  const [campanhaSelecionada, setCampanhaSelecionada] = useState('');
  const [novaCamp, setNovaCamp] = useState({ titulo: '', categoria: categoriasCaixinha[0] || 'Manutenção & Velas', descricao: '', meta: '' });

  const [editandoId, setEditandoId] = useState(null);
  const [editForm, setEditForm] = useState({ titulo: '', categoria: '', descricao: '', meta: '', arrecadado: '' });

  const [movCampId, setMovCampId] = useState(null);
  const [movForm, setMovForm] = useState({ tipo: 'saida', descricao: '', valor: '' });

  const totalArrecadadoGeral = campanhas.reduce((acc, c) => acc + Number(c.arrecadado || 0), 0);
  const filaAprovacao = doacoesPendentes.filter(d => d.status === 'pendente');

  const criarCampanha = async (e) => {
    e.preventDefault();
    if (!novaCamp.titulo || !novaCamp.meta) return;

    const payloadComCategoria = {
      titulo: novaCamp.titulo,
      categoria: novaCamp.categoria,
      descricao: novaCamp.descricao,
      meta: parseFloat(novaCamp.meta),
      arrecadado: 0,
      ativa: true
    };

    let res = await supabase.from('campanhas_doacao').insert([payloadComCategoria]).select().single();

    if (res.error) {
      res = await supabase
        .from('campanhas_doacao')
        .insert([{
          titulo: novaCamp.titulo,
          descricao: novaCamp.descricao,
          meta: parseFloat(novaCamp.meta),
          arrecadado: 0,
          ativa: true
        }])
        .select()
        .single();
    }

    if (!res.error && res.data) {
      setCampanhas([res.data, ...campanhas]);
      setNovaCamp({ titulo: '', categoria: categoriasCaixinha[0] || 'Manutenção & Velas', descricao: '', meta: '' });
      showToast('Nova caixinha salva com sucesso!');
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
    const { data, error } = await supabase
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

    if (!error && data) {
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
        descricao: movForm.descricao || (movForm.tipo === 'entrada' ? 'Reforço na caixinha' : 'Uso de recurso da caixinha'),
        valor: val,
        status_lancamento: 'efetivado',
        registrado_por: currentUser?.nome
      }])
      .select()
      .single();

    if (fin) setFinanceiro([fin, ...financeiro]);
    setMovCampId(null);
    setMovForm({ tipo: 'saida', descricao: '', valor: '' });
    showToast('Movimentação registrada na caixinha!');
  };

  // Médium envia solicitação de doação -> vai para aprovação
  const solicitarRegistroDoacao = async (e) => {
    e.preventDefault();
    const val = parseFloat(valorDoacao);
    if (!val || val <= 0) return;

    const camp = campanhas.find(c => c.id === campanhaSelecionada) || campanhas[0];

    const { data, error } = await supabase
      .from('doacoes_pendentes')
      .insert([{
        campanha_id: camp?.id || null,
        campanha_titulo: camp?.titulo || 'Caixinha Geral',
        doador_nome: currentUser?.nome || 'Médium',
        valor: val,
        observacao: obsDoacao,
        status: 'pendente'
      }])
      .select()
      .single();

    if (!error && data) {
      setDoacoesPendentes([data, ...doacoesPendentes]);
      setValorDoacao('');
      setObsDoacao('');
      showToast('Solicitação enviada! Aguardando conferência e aprovação dos responsáveis da Caixinha.');
    } else if (error) {
      showToast('Erro ao enviar doação. Rode o SQL atualizado no Supabase.');
    }
  };

  const aprovarDoacao = async (sol) => {
    const camp = campanhas.find(c => c.id === sol.campanha_id) || campanhas.find(c => c.titulo === sol.campanha_titulo);
    if (camp) {
      const novoTotal = Number(camp.arrecadado) + Number(sol.valor);
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
        descricao: `Doação Caixinha (${sol.campanha_titulo}) - ${sol.doador_nome}`,
        valor: Number(sol.valor),
        status_lancamento: 'efetivado',
        registrado_por: currentUser?.nome
      }])
      .select()
      .single();

    if (fin) setFinanceiro([fin, ...financeiro]);

    const { data: solAtualizada } = await supabase
      .from('doacoes_pendentes')
      .update({ status: 'aprovado' })
      .eq('id', sol.id)
      .select()
      .single();

    if (solAtualizada) {
      setDoacoesPendentes(doacoesPendentes.map(d => d.id === sol.id ? solAtualizada : d));
    }
    showToast(`Doação de R$ ${Number(sol.valor).toFixed(2)} aprovada e somada na Caixinha!`);
  };

  const recusarDoacao = async (id) => {
    await supabase.from('doacoes_pendentes').delete().eq('id', id);
    setDoacoesPendentes(doacoesPendentes.filter(d => d.id !== id));
    showToast('Solicitação de doação recusada/removida.');
  };

  return (
    <div className="space-y-6">
      <div className="bg-emerald-950 text-white p-6 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-amber-300 font-bold">Transparência • Caixinha da {configCasa.nome_casa || 'Casa Bendizer'}</p>
          <h2 className="text-2xl font-bold mt-1">Saldo Atual nas Caixinhas: R$ {totalArrecadadoGeral.toFixed(2)}</h2>
          <p className="text-xs text-emerald-200 mt-1">Recursos destinados às velas, ervas, manutenção e trabalhos espirituais.</p>
        </div>
      </div>

      <PixBanner configCasa={configCasa} showToast={showToast} />

      {/* FILA DE APROVAÇÃO DE DOAÇÕES (PARA OS RESPONSÁVEIS) */}
      {canCaixinha && filaAprovacao.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 p-5 rounded-2xl space-y-3">
          <h3 className="font-bold text-sm text-amber-950 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-700" />
            Doações Aguardando Conferência e Aprovação ({filaAprovacao.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filaAprovacao.map(sol => (
              <div key={sol.id} className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs">
                  <p className="font-bold text-stone-800">{sol.doador_nome} • <span className="text-emerald-800">R$ {Number(sol.valor).toFixed(2)}</span></p>
                  <p className="text-stone-500">Destino: {sol.campanha_titulo}</p>
                  {sol.observacao && <p className="text-stone-400 italic mt-0.5">"{sol.observacao}"</p>}
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => aprovarDoacao(sol)}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Aprovar
                  </button>
                  <button
                    onClick={() => recusarDoacao(sol.id)}
                    className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-semibold rounded-lg flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Recusar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
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

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm h-fit space-y-4">
          <div>
            <h3 className="font-bold text-base text-stone-800 mb-1">Informar Doação para Caixinha</h3>
            <p className="text-xs text-stone-500">
              Após realizar o PIX ou entrega, registre aqui. O valor entra no saldo assim que os responsáveis confirmarem o recebimento.
            </p>
          </div>

          <form onSubmit={solicitarRegistroDoacao} className="space-y-3">
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
              <label className="block text-xs font-semibold text-stone-600 mb-1">Valor Doado (R$)</label>
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

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Observação / Comprovante (opcional)</label>
              <input
                type="text"
                placeholder="Ex: PIX feito hoje às 14h"
                value={obsDoacao}
                onChange={e => setObsDoacao(e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs"
              />
            </div>

            <button type="submit" className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-xl text-xs transition">
              Enviar para Aprovação
            </button>
          </form>

          {/* Minhas solicitações recentes */}
          {doacoesPendentes.filter(d => d.doador_nome === currentUser?.nome).length > 0 && (
            <div className="pt-3 border-t border-stone-100 space-y-1.5">
              <p className="text-[11px] font-bold text-stone-500 uppercase">Meus envios recentes:</p>
              {doacoesPendentes
                .filter(d => d.doador_nome === currentUser?.nome)
                .slice(0, 3)
                .map(d => (
                  <div key={d.id} className="flex justify-between items-center text-xs bg-stone-50 px-2.5 py-1.5 rounded-lg">
                    <span>R$ {Number(d.valor).toFixed(2)} ({d.campanha_titulo})</span>
                    <span className={`font-bold text-[10px] px-2 py-0.5 rounded ${d.status === 'aprovado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>
                      {d.status === 'aprovado' ? '✓ Aprovada' : 'Em análise'}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===================== 6. ABA CURIMBA ===================== */
function CurimbaTab({ pontos, setPontos, currentUser, canCurimba, linhasCurimba, showToast }) {
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
                  onClick={() => { navigator.clipboard.writeText(`${p.titulo}\n\n${p.letra}`); showToast('Letra copiada!'); }}
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

/* ===================== 7. ABA BIBLIOTECA ===================== */
function BibliotecaTab({
  livros, setLivros, mediums, notificacoes, setNotificacoes, currentUser,
  canBiblioteca, categoriasBiblioteca, prazoDias, showToast
}) {
  const [novoLivro, setNovoLivro] = useState({
    titulo: '', autor: '', categoria: categoriasBiblioteca[0] || 'Fundamentos', unidades: 1
  });

  const adicionarDias = (dias) => {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    return d.toISOString().slice(0, 10);
  };

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
    const devolucao = adicionarDias(prazoDias);
    const reservasAtualizadas = (livro.reservas || []).filter(r => r.medium_id !== currentUser?.id);

    const { data } = await supabase
      .from('biblioteca')
      .update({
        status: 'Emprestado',
        emprestado_para: currentUser?.id,
        data_emprestimo: HOJE_STR,
        data_devolucao_prevista: devolucao,
        reservas: reservasAtualizadas
      })
      .eq('id', livro.id)
      .select()
      .single();

    if (data) {
      setLivros(livros.map(l => l.id === livro.id ? data : l));
      showToast(`Empréstimo registrado! Devolução prevista em ${prazoDias} dias (${devolucao.split('-').reverse().join('/')}).`);
    }
  };

  const renovarEmprestimo = async (livro) => {
    const novaDevolucao = adicionarDias(prazoDias);
    const { data } = await supabase
      .from('biblioteca')
      .update({ data_devolucao_prevista: novaDevolucao })
      .eq('id', livro.id)
      .select()
      .single();

    if (data) {
      setLivros(livros.map(l => l.id === livro.id ? data : l));
      showToast(`Empréstimo renovado por mais ${prazoDias} dias! Novo prazo: ${novaDevolucao.split('-').reverse().join('/')}.`);
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
    const novasReservas = [...atuais, { medium_id: currentUser?.id, nome: currentUser?.nome, data: HOJE_STR }];
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
    const msg = `Olá, ${portador?.nome || 'Médium'}! O prazo de ${prazoDias} dias do livro "${livro.titulo}" da Biblioteca venceu em ${livro.data_devolucao_prevista?.split('-').reverse().join('/')}. Por favor, devolva ou renove na plataforma.`;

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
    l => l.status === 'Emprestado' && l.data_devolucao_prevista && l.data_devolucao_prevista < HOJE_STR
  );

  return (
    <div className="space-y-6">
      {livrosVencidos.length > 0 && (
        <div className="bg-rose-50 border border-rose-300 p-4 rounded-2xl space-y-2">
          <h3 className="font-bold text-sm text-rose-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            Empréstimos com Prazo Vencido ({livrosVencidos.length})
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
            const vencido = l.status === 'Emprestado' && l.data_devolucao_prevista && l.data_devolucao_prevista < HOJE_STR;
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
                          <strong>Devolução ({prazoDias} dias):</strong> {l.data_devolucao_prevista.split('-').reverse().join('/')}
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
                        Pegar ({prazoDias} dias)
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
function MensagensTab({ notificacoes, setNotificacoes, mediums, bebidas, configCasa, canCadastros, canBebidas, showToast }) {
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');

  const valorBebida = Number(configCasa.valor_bebidas_padrao || 10).toFixed(2);

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

  const pendentesBebida = mediums.filter(
    m => !bebidas.some(b => b.medium_id === m.id && b.mes_referencia === MES_ATUAL && b.pago)
  );
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
                          `Axé, ${m.nome}! Passando para lembrar da contribuição mensal de R$ ${valorBebida} da Caixinha de Bebidas da ${configCasa.nome_casa || 'Casa Bendizer'} (${MES_ATUAL}).`
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

/* ===================== 9. ABA CONFIGURAÇÕES (EXCLUSIVO ADMIN GERAL) ===================== */
function ConfiguracoesTab({
  configCasa, salvarConfigCasa, mediums, setMediums, giras,
  listasCustom, onAddLista, onRemoveLista, currentUser, showToast
}) {
  const [formConfig, setFormConfig] = useState({
    ...configCasa,
    email_admin_boletim: configCasa.email_admin_boletim || currentUser?.email || ''
  });
  const [tipoLista, setTipoLista] = useState('linha_curimba');
  const [valorLista, setValorLista] = useState('');

  useEffect(() => {
    setFormConfig({
      ...configCasa,
      email_admin_boletim: configCasa.email_admin_boletim || currentUser?.email || ''
    });
  }, [configCasa, currentUser?.email]);

  const obterDadosDoMes = () => {
    const girasDoMes = giras.filter(g => (g.data_gira || '').startsWith(MES_ATUAL));
    const aniversariantesDoMes = mediums.filter(m => {
      if (!m.data_nascimento) return false;
      return parseInt(m.data_nascimento.split('-')[1], 10) === MES_NUMERO;
    });

    const textoGiras = girasDoMes.length > 0
      ? girasDoMes.map(g => `• Dia ${g.data_gira.split('-')[2]}/${g.data_gira.split('-')[1]} às ${g.horario} — ${g.titulo}`).join('\n')
      : '• Nenhuma gira cadastrada no calendário para este mês ainda.';

    const textoAniversariantes = aniversariantesDoMes.length > 0
      ? aniversariantesDoMes.map(a => `• Dia ${a.data_nascimento.split('-')[2]}/${a.data_nascimento.split('-')[1]} — ${a.nome}`).join('\n')
      : '• Nenhum aniversariante cadastrado neste mês.';

    return { textoGiras, textoAniversariantes };
  };

  const aplicarVariaveisBoletim = (textoBase, nomeCasa) => {
    const { textoGiras, textoAniversariantes } = obterDadosDoMes();
    return textoBase
      .replace(/\{CASA\}/gi, nomeCasa || 'Casa Bendizer')
      .replace(/\{MES\}/gi, NOME_MES_ATUAL)
      .replace(/\{GIRAS\}/gi, textoGiras)
      .replace(/\{ANIVERSARIANTES\}/gi, textoAniversariantes);
  };

  const gerarTextoBoletimPadrao = (nomeCasa, cfg = configCasa) => {
    if (cfg.mensagem_boletim_padrao && cfg.mensagem_boletim_padrao.trim()) {
      return aplicarVariaveisBoletim(cfg.mensagem_boletim_padrao, nomeCasa);
    }
    const { textoGiras, textoAniversariantes } = obterDadosDoMes();
    return `Axé a todos da ${nomeCasa || 'Casa Bendizer'}!\n\nSegue o nosso informativo mensal de ${NOME_MES_ATUAL}:\n\n📅 CALENDÁRIO DE GIRAS DO MÊS:\n${textoGiras}\n\n🎂 ANIVERSARIANTES DO MÊS:\n${textoAniversariantes}\n\nQue Oxalá abençoe a caminhada de todos!`;
  };

  const gerarAssuntoBoletimPadrao = (nomeCasa, cfg = configCasa) => {
    if (cfg.assunto_boletim_padrao && cfg.assunto_boletim_padrao.trim()) {
      return aplicarVariaveisBoletim(cfg.assunto_boletim_padrao, nomeCasa);
    }
    return `Calendário de Giras & Aniversariantes — ${nomeCasa || 'Casa Bendizer'} (${NOME_MES_ATUAL})`;
  };

  const [assuntoBoletim, setAssuntoBoletim] = useState(() => {
    const salvoLocal = localStorage.getItem('cb_rascunho_boletim_assunto');
    return salvoLocal !== null ? salvoLocal : gerarAssuntoBoletimPadrao(configCasa.nome_casa, configCasa);
  });

  const [corpoBoletim, setCorpoBoletim] = useState(() => {
    const salvoLocal = localStorage.getItem('cb_rascunho_boletim_corpo');
    return salvoLocal !== null ? salvoLocal : gerarTextoBoletimPadrao(configCasa.nome_casa, configCasa);
  });

  useEffect(() => {
    const temRascunhoNaoSalvo = localStorage.getItem('cb_rascunho_boletim_modificado') === 'true';
    if (!temRascunhoNaoSalvo && (configCasa.assunto_boletim_padrao || configCasa.mensagem_boletim_padrao)) {
      const novoAssunto = gerarAssuntoBoletimPadrao(configCasa.nome_casa, configCasa);
      const novoCorpo = gerarTextoBoletimPadrao(configCasa.nome_casa, configCasa);
      setAssuntoBoletim(novoAssunto);
      setCorpoBoletim(novoCorpo);
      try {
        localStorage.setItem('cb_rascunho_boletim_assunto', novoAssunto);
        localStorage.setItem('cb_rascunho_boletim_corpo', novoCorpo);
      } catch (_) {}
    }
  }, [configCasa.assunto_boletim_padrao, configCasa.mensagem_boletim_padrao]);

  const [assuntoLivre, setAssuntoLivre] = useState(() => localStorage.getItem('cb_rascunho_livre_assunto') || '');
  const [corpoLivre, setCorpoLivre] = useState(() => localStorage.getItem('cb_rascunho_livre_corpo') || '');
  const [incluirAfastados, setIncluirAfastados] = useState(false);
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [salvandoPadrao, setSalvandoPadrao] = useState(false);

  const handleChangeAssuntoBoletim = (val) => {
    setAssuntoBoletim(val);
    try {
      localStorage.setItem('cb_rascunho_boletim_assunto', val);
      localStorage.setItem('cb_rascunho_boletim_modificado', 'true');
    } catch (_) {}
  };

  const handleChangeCorpoBoletim = (val) => {
    setCorpoBoletim(val);
    try {
      localStorage.setItem('cb_rascunho_boletim_corpo', val);
      localStorage.setItem('cb_rascunho_boletim_modificado', 'true');
    } catch (_) {}
  };

  const handleChangeAssuntoLivre = (val) => {
    setAssuntoLivre(val);
    try { localStorage.setItem('cb_rascunho_livre_assunto', val); } catch (_) {}
  };

  const handleChangeCorpoLivre = (val) => {
    setCorpoLivre(val);
    try { localStorage.setItem('cb_rascunho_livre_corpo', val); } catch (_) {}
  };

  const salvarComoModeloPadrao = async () => {
    setSalvandoPadrao(true);
    try {
      const novoConfig = {
        ...formConfig,
        assunto_boletim_padrao: assuntoBoletim,
        mensagem_boletim_padrao: corpoBoletim
      };
      const ok = await salvarConfigCasa(novoConfig);
      if (ok) {
        setFormConfig(novoConfig);
        try {
          localStorage.setItem('cb_rascunho_boletim_assunto', assuntoBoletim);
          localStorage.setItem('cb_rascunho_boletim_corpo', corpoBoletim);
          localStorage.setItem('cb_rascunho_boletim_modificado', 'false');
        } catch (_) {}
        showToast('Seu assunto e mensagem padrão foram salvos no banco!');
      }
    } finally {
      setSalvandoPadrao(false);
    }
  };

  const emailsDestinatarios = Array.from(new Set([
    ...mediums
      .filter(m => (incluirAfastados ? true : (m.status_medium || 'Ativo') === 'Ativo') && m.email)
      .map(m => m.email),
    ...(formConfig.email_admin_boletim ? [formConfig.email_admin_boletim] : [])
  ]));

  const dispararViaSupabase = async (assunto, mensagem, marcarBoletimMes = false) => {
    setEnviandoEmail(true);
    try {
      const assuntoFinal = aplicarVariaveisBoletim(assunto, formConfig.nome_casa);
      const mensagemFinal = aplicarVariaveisBoletim(mensagem, formConfig.nome_casa);

      const { data, error } = await supabase.functions.invoke('enviar-boletim', {
        body: { assunto: assuntoFinal, mensagem: mensagemFinal, incluirAfastados }
      });

      if (error || !data?.ok) {
        throw new Error(data?.error || error?.message || 'Verifique se a Edge Function enviar-boletim está ativa no Supabase.');
      }

      if (marcarBoletimMes) {
        await salvarConfigCasa({ ...formConfig, ultimo_boletim_enviado: MES_ATUAL });
      }
      showToast(`E-mail enviado automaticamente para ${data.enviados || emailsDestinatarios.length} destinatário(s)!`);
      return true;
    } catch (err) {
      showToast('Erro no envio automático: ' + err.message);
      return false;
    } finally {
      setEnviandoEmail(false);
    }
  };

  const dispararBoletimEmail = async () => {
    await dispararViaSupabase(assuntoBoletim, corpoBoletim, true);
  };

  const dispararComunicadoLivreEmail = async (e) => {
    e.preventDefault();
    if (!assuntoLivre.trim() || !corpoLivre.trim()) return;
    const ok = await dispararViaSupabase(assuntoLivre, corpoLivre, false);
    if (ok) {
      handleChangeAssuntoLivre('');
      handleChangeCorpoLivre('');
    }
  };

  const handleSalvarGeral = async (e) => {
    e.preventDefault();
    await salvarConfigCasa({
      ...formConfig,
      valor_mensalidade_padrao: parseFloat(formConfig.valor_mensalidade_padrao) || 50,
      valor_bebidas_padrao: parseFloat(formConfig.valor_bebidas_padrao) || 10,
      dia_vencimento: parseInt(formConfig.dia_vencimento, 10) || 10,
      prazo_biblioteca_dias: parseInt(formConfig.prazo_biblioteca_dias, 10) || 20,
    });
  };

  const handleAddOpcao = (e) => {
    e.preventDefault();
    if (!valorLista.trim()) return;
    onAddLista(tipoLista, valorLista);
    setValorLista('');
  };

  const togglePermissaoRapida = async (medium, modId) => {
    const atuais = medium.permissoes || [];
    const novas = atuais.includes(modId)
      ? atuais.filter(p => p !== modId)
      : [...atuais, modId];

    const { data } = await supabase
      .from('mediums')
      .update({ permissoes: novas })
      .eq('id', medium.id)
      .select()
      .single();

    if (data) {
      setMediums(mediums.map(m => m.id === medium.id ? data : m));
      showToast(`Permissões de ${medium.nome} atualizadas!`);
    }
  };

  const labelsTipos = {
    linha_curimba: 'Linha da Curimba',
    linha_entidade: 'Linha de Entidade',
    categoria_biblioteca: 'Categoria Biblioteca',
    categoria_caixinha: 'Categoria Caixinha',
    cargo_casa: 'Cargo da Casa'
  };

  return (
    <div className="space-y-6">
      {/* 1. BOLETIM MENSAL POR E-MAIL (DIA 1º) */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-bold text-base text-stone-800 flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-700" />
              Boletim Mensal por E-mail (Calendário de Giras & Aniversariantes)
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Disparo automático todo dia 1º às 08h pelo Supabase (e envio imediato abaixo) para {emailsDestinatarios.length} e-mail(s).
            </p>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
            formConfig.ultimo_boletim_enviado === MES_ATUAL
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-900'
          }`}>
            {formConfig.ultimo_boletim_enviado === MES_ATUAL
              ? `✓ Enviado em ${MES_ATUAL}`
              : `Pendente (${MES_ATUAL})`}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">E-mail da Administração (Recebimento / Cópia)</label>
            <input
              type="email"
              value={formConfig.email_admin_boletim || ''}
              onChange={e => setFormConfig({ ...formConfig, email_admin_boletim: e.target.value })}
              placeholder="administracao@casabendizer.com.br"
              className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs"
            />
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <button
              type="button"
              disabled={enviandoEmail}
              onClick={dispararBoletimEmail}
              className="flex-1 py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> {enviandoEmail ? 'Enviando...' : 'Disparar Boletim Agora'}
            </button>
            <button
              type="button"
              onClick={() => {
                const txt = aplicarVariaveisBoletim(corpoBoletim, formConfig.nome_casa);
                navigator.clipboard.writeText(txt);
                showToast('Texto do boletim copiado para WhatsApp!');
              }}
              className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded-xl text-xs flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" /> Copiar Texto
            </button>
          </div>
        </div>

        <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-bold text-stone-600 uppercase">Editar Assunto e Mensagem do Boletim ({NOME_MES_ATUAL}):</p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const cfgAtual = { ...configCasa, ...formConfig };
                  const a = gerarAssuntoBoletimPadrao(cfgAtual.nome_casa, cfgAtual);
                  const c = gerarTextoBoletimPadrao(cfgAtual.nome_casa, cfgAtual);
                  setAssuntoBoletim(a);
                  setCorpoBoletim(c);
                  try {
                    localStorage.setItem('cb_rascunho_boletim_assunto', a);
                    localStorage.setItem('cb_rascunho_boletim_corpo', c);
                    localStorage.setItem('cb_rascunho_boletim_modificado', 'false');
                  } catch (_) {}
                  showToast('Seu modelo padrão foi carregado com os dados deste mês!');
                }}
                className="text-[11px] font-semibold text-emerald-800 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Aplicar Meu Modelo Padrão
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-600 mb-1">Assunto do E-mail</label>
            <input
              type="text"
              value={assuntoBoletim}
              onChange={e => handleChangeAssuntoBoletim(e.target.value)}
              className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white font-medium"
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
              <label className="block text-[11px] font-semibold text-stone-600">
                Texto da Mensagem (salvo automaticamente como rascunho ao digitar)
              </label>
              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="text-stone-500">Inserir automático:</span>
                <button
                  type="button"
                  onClick={() => handleChangeCorpoBoletim(corpoBoletim + (corpoBoletim.endsWith('\n') || !corpoBoletim ? '' : '\n') + '{GIRAS}')}
                  className="px-2 py-0.5 bg-white border border-stone-300 rounded hover:bg-stone-100 font-semibold text-stone-700"
                >
                  + Giras do Mês
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeCorpoBoletim(corpoBoletim + (corpoBoletim.endsWith('\n') || !corpoBoletim ? '' : '\n') + '{ANIVERSARIANTES}')}
                  className="px-2 py-0.5 bg-white border border-stone-300 rounded hover:bg-stone-100 font-semibold text-stone-700"
                >
                  + Aniversariantes
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeCorpoBoletim(corpoBoletim + ' {MES}')}
                  className="px-2 py-0.5 bg-white border border-stone-300 rounded hover:bg-stone-100 font-semibold text-stone-700"
                >
                  + Mês
                </button>
              </div>
            </div>
            <textarea
              rows={7}
              value={corpoBoletim}
              onChange={e => handleChangeCorpoBoletim(e.target.value)}
              className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-xs bg-white leading-relaxed"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className="text-[11px] text-emerald-800 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Rascunho salvo automaticamente ao digitar
            </span>
            <button
              type="button"
              disabled={salvandoPadrao}
              onClick={salvarComoModeloPadrao}
              className="py-2 px-4 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-xl text-xs transition"
            >
              {salvandoPadrao ? 'Salvando...' : 'Salvar como Nova Mensagem Padrão'}
            </button>
          </div>
        </div>
      </div>

      {/* 1B. ENVIAR MENSAGEM / COMUNICADO LIVRE POR E-MAIL A TODOS */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-bold text-base text-stone-800 flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-700" />
              Enviar Comunicado Livre por E-mail a Todos
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Escreva qualquer recado, convocação ou aviso extraordinário para disparar por e-mail para toda a corrente ({emailsDestinatarios.length} destinatário(s)). Rascunho salvo automaticamente.
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs font-medium text-stone-600 cursor-pointer">
            <input
              type="checkbox"
              checked={incluirAfastados}
              onChange={e => setIncluirAfastados(e.target.checked)}
              className="rounded text-emerald-700"
            />
            Incluir afastados/suspensos
          </label>
        </div>

        <form onSubmit={dispararComunicadoLivreEmail} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">Assunto do E-mail</label>
            <input
              type="text"
              required
              value={assuntoLivre}
              onChange={e => handleChangeAssuntoLivre(e.target.value)}
              placeholder="Ex: Convocação para mutirão de limpeza / Aviso importante da gira"
              className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">Mensagem para a Corrente</label>
            <textarea
              rows={4}
              required
              value={corpoLivre}
              onChange={e => handleChangeCorpoLivre(e.target.value)}
              placeholder="Escreva aqui o comunicado completo que será enviado por e-mail a todos..."
              className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-xs leading-relaxed"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={enviandoEmail}
              className="py-2.5 px-5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" /> {enviandoEmail ? 'Enviando...' : `Enviar E-mail para Todos (${emailsDestinatarios.length})`}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!corpoLivre.trim()) return;
                navigator.clipboard.writeText(`${assuntoLivre ? `*${assuntoLivre}*\n\n` : ''}${corpoLivre}`);
                showToast('Mensagem copiada para colar no WhatsApp!');
              }}
              className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded-xl text-xs flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" /> Copiar para WhatsApp
            </button>
            {(assuntoLivre || corpoLivre) && (
              <button
                type="button"
                onClick={() => {
                  handleChangeAssuntoLivre('');
                  handleChangeCorpoLivre('');
                  showToast('Rascunho limpo.');
                }}
                className="py-2.5 px-3 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold ml-auto"
              >
                Limpar Rascunho
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 2. DADOS DA CASA, PIX, VALORES (MENSALIDADE & BEBIDAS) & PARÂMETROS */}
      <form onSubmit={handleSalvarGeral} className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-5">
        <h2 className="font-bold text-base text-stone-800 flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-700" />
          Parâmetros Gerais, Valores, PIX & Regras da Casa
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">Nome da Casa</label>
            <input
              type="text"
              value={formConfig.nome_casa || ''}
              onChange={e => setFormConfig({ ...formConfig, nome_casa: e.target.value })}
              className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">Horário Padrão das Giras</label>
            <input
              type="text"
              value={formConfig.horario_gira_padrao || ''}
              onChange={e => setFormConfig({ ...formConfig, horario_gira_padrao: e.target.value })}
              className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">Prazo Biblioteca (Dias)</label>
            <input
              type="number"
              min={1}
              value={formConfig.prazo_biblioteca_dias || 20}
              onChange={e => setFormConfig({ ...formConfig, prazo_biblioteca_dias: e.target.value })}
              className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-amber-50/60 p-4 rounded-xl border border-amber-200/80">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Chave PIX Oficial</label>
            <input
              type="text"
              value={formConfig.chave_pix || ''}
              onChange={e => setFormConfig({ ...formConfig, chave_pix: e.target.value })}
              placeholder="CPF, CNPJ, E-mail ou Celular"
              className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Favorecido PIX</label>
            <input
              type="text"
              value={formConfig.favorecido_pix || ''}
              onChange={e => setFormConfig({ ...formConfig, favorecido_pix: e.target.value })}
              placeholder="Nome no banco"
              className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Mensalidade (R$)</label>
            <input
              type="number"
              step="0.01"
              value={formConfig.valor_mensalidade_padrao || 50}
              onChange={e => setFormConfig({ ...formConfig, valor_mensalidade_padrao: e.target.value })}
              className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Contrib. Bebidas (R$)</label>
            <input
              type="number"
              step="0.01"
              value={formConfig.valor_bebidas_padrao || 10}
              onChange={e => setFormConfig({ ...formConfig, valor_bebidas_padrao: e.target.value })}
              className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Dia Vencimento</label>
            <input
              type="number"
              min={1}
              max={31}
              value={formConfig.dia_vencimento || 10}
              onChange={e => setFormConfig({ ...formConfig, dia_vencimento: e.target.value })}
              className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1">Aviso Fixo / Orientações na Página Inicial (opcional)</label>
          <textarea
            rows={2}
            value={formConfig.aviso_boas_vindas || ''}
            onChange={e => setFormConfig({ ...formConfig, aviso_boas_vindas: e.target.value })}
            placeholder="Ex: Chegar com 30 minutos de antecedência para banho de ervas e concentração..."
            className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
            <input
              type="checkbox"
              checked={formConfig.permitir_auto_cadastro !== false}
              onChange={e => setFormConfig({ ...formConfig, permitir_auto_cadastro: e.target.checked })}
              className="rounded text-emerald-700"
            />
            Permitir novos cadastros ("Primeiro Acesso") na tela de login
          </label>

          <button type="submit" className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-xl text-xs">
            Salvar Configurações
          </button>
        </div>
      </form>

      {/* 3. CENTRAL DE LINHAS, CATEGORIAS E CARGOS */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
        <h2 className="font-bold text-base text-stone-800 flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-emerald-700" />
          Criar Novas Linhas, Categorias e Cargos
        </h2>

        <form onSubmit={handleAddOpcao} className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-stone-50 p-3 rounded-xl border border-stone-200">
          <select
            value={tipoLista}
            onChange={e => setTipoLista(e.target.value)}
            className="px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white font-medium"
          >
            <option value="linha_curimba">Linha da Curimba</option>
            <option value="linha_entidade">Linha de Entidade (Guias)</option>
            <option value="categoria_biblioteca">Categoria da Biblioteca</option>
            <option value="categoria_caixinha">Categoria da Caixinha</option>
            <option value="cargo_casa">Cargo da Casa</option>
          </select>
          <input
            type="text"
            required
            value={valorLista}
            onChange={e => setValorLista(e.target.value)}
            placeholder="Nome da nova opção..."
            className="sm:col-span-2 px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white"
          />
          <button type="submit" className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-xl py-2">
            + Adicionar Opção
          </button>
        </form>

        {listasCustom.length === 0 ? (
          <p className="text-xs text-stone-500">Nenhuma opção personalizada criada além das padrões.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {listasCustom.map(item => (
              <span key={item.id} className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-950 px-3 py-1.5 rounded-xl text-xs">
                <span className="text-[10px] font-bold uppercase text-emerald-700">{labelsTipos[item.tipo] || item.tipo}:</span>
                <strong>{item.valor}</strong>
                <button type="button" onClick={() => onRemoveLista(item.id)} className="text-rose-600 font-bold">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 4. PAINEL RÁPIDO DE PERMISSÕES */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
        <div>
          <h2 className="font-bold text-base text-stone-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-700" />
            Painel Rápido de Permissões por Setor
          </h2>
          <p className="text-xs text-stone-500">Marque ou desmarque rapidamente o que cada médium pode gerenciar</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500">
                <th className="py-2.5 pr-4 font-semibold">Médium</th>
                <th className="py-2.5 px-2 font-semibold">Perfil</th>
                {MODULOS_PERMISSAO.map(mod => (
                  <th key={mod.id} className="py-2.5 px-2 font-semibold text-center">{mod.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {mediums.map(m => {
                const isTotal = m.nivel_acesso === 'admin' || m.nivel_acesso === 'secretaria';
                return (
                  <tr key={m.id} className="hover:bg-stone-50">
                    <td className="py-2.5 pr-4 font-semibold text-stone-800">{m.nome}</td>
                    <td className="py-2.5 px-2 text-stone-500 capitalize">{m.nivel_acesso || 'medium'}</td>
                    {MODULOS_PERMISSAO.map(mod => (
                      <td key={mod.id} className="py-2.5 px-2 text-center">
                        <input
                          type="checkbox"
                          disabled={isTotal}
                          checked={isTotal || (m.permissoes || []).includes(mod.id)}
                          onChange={() => togglePermissaoRapida(m, mod.id)}
                          className="rounded text-emerald-700 disabled:opacity-50"
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
