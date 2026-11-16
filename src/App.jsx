import React, { useState, useEffect } from 'react';
import {
  Home, Users, Wine, DollarSign, BookOpen, Music, HeartHandshake, Bell,
  LogOut, Plus, Check, Copy, ExternalLink, Calendar, Cake, Shield,
  HeartPulse, Sparkles, Search, Trash2, Edit3, Send, MessageCircle,
  AlertCircle, CheckCircle2, UserCheck, Lock, Mail
} from 'lucide-react';
import { supabase, isConfigured } from './supabaseClient';

const MES_ATUAL = new Date().toISOString().slice(0, 7); // Ex: '2026-11'
const MES_NUMERO = new Date().getMonth() + 1;

export default function App() {
  const [session, setSession] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authNome, setAuthNome] = useState('');
  const [authTelefone, setAuthTelefone] = useState('');
  const [authNascimento, setAuthNascimento] = useState('');
  const [authError, setAuthError] = useState('');

  // Perfil do usuário logado e dados gerais
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [toast, setToast] = useState('');

  // Tabelas do banco
  const [mediums, setMediums] = useState([]);
  const [bebidas, setBebidas] = useState([]);
  const [financeiro, setFinanceiro] = useState([]);
  const [campanhas, setCampanhas] = useState([]);
  const [livros, setLivros] = useState([]);
  const [pontos, setPontos] = useState([]);
  const [giras, setGiras] = useState([]);
  const [notificacoes, setNotificacoes] = useState([]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
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
        resMediums, resBebidas, resFin, resCamp, resLivros, resPontos, resGiras, resNotif
      ] = await Promise.all([
        supabase.from('mediums').select('*').order('nome'),
        supabase.from('caixinha_bebidas').select('*').eq('mes_referencia', MES_ATUAL),
        supabase.from('financeiro').select('*').order('data_movimento', { ascending: false }),
        supabase.from('campanhas_doacao').select('*').eq('ativa', true),
        supabase.from('biblioteca').select('*').order('titulo'),
        supabase.from('curimba_pontos').select('*').order('created_at', { ascending: false }),
        supabase.from('calendario_giras').select('*').order('data_gira'),
        supabase.from('notificacoes').select('*').order('created_at', { ascending: false }),
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

      // Encontrar ou criar perfil do usuário logado
      let myProfile = allMediums.find(m => m.user_id === user.id || m.email === user.email);
      if (!myProfile) {
        const isFirstUser = allMediums.length === 0;
        const newProfile = {
          user_id: user.id,
          nome: user.user_metadata?.nome || user.email.split('@')[0],
          email: user.email,
          telefone: user.user_metadata?.telefone || '',
          data_nascimento: user.user_metadata?.data_nascimento || null,
          cargo: isFirstUser ? 'Dirigente / Administração' : 'Médium de Corrente',
          nivel_acesso: isFirstUser ? 'admin' : 'medium',
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
            As chaves <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> ainda não foram adicionadas nas variáveis de ambiente da Vercel.
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

  // TELA DE LOGIN / CADASTRO
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

  const role = currentUserProfile?.nivel_acesso || 'medium';
  const isAdmin = role === 'admin';
  const isStaff = role === 'admin' || role === 'secretaria';

  const navItems = [
    { id: 'home', label: 'Início', icon: Home },
    { id: 'mediums', label: isStaff ? 'Médiuns' : 'Minha Ficha', icon: Users },
    { id: 'bebidas', label: 'Bebidas (R$ 10)', icon: Wine },
    ...(isStaff ? [{ id: 'financeiro', label: 'Financeiro', icon: DollarSign }] : []),
    { id: 'doacoes', label: 'Caixinha', icon: HeartHandshake },
    { id: 'curimba', label: 'Curimba', icon: Music },
    { id: 'biblioteca', label: 'Biblioteca', icon: BookOpen },
    { id: 'mensagens', label: 'Avisos', icon: Bell },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      {/* Toast flutuante */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 text-amber-300" />
          {toast}
        </div>
      )}

      {/* Cabeçalho */}
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
                  {role === 'admin' ? 'Admin Geral' : role === 'secretaria' ? 'Secretaria' : 'Médium'}
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

        {/* Navegação */}
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

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {activeTab === 'home' && (
          <HomeTab
            giras={giras}
            setGiras={setGiras}
            mediums={mediums}
            bebidas={bebidas}
            notificacoes={notificacoes}
            currentUser={currentUserProfile}
            isStaff={isStaff}
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
            isStaff={isStaff}
            showToast={showToast}
          />
        )}
        {activeTab === 'bebidas' && (
          <BebidasTab
            mediums={mediums}
            bebidas={bebidas}
            setBebidas={setBebidas}
            financeiro={financeiro}
            setFinanceiro={setFinanceiro}
            currentUser={currentUserProfile}
            isStaff={isStaff}
            showToast={showToast}
          />
        )}
        {activeTab === 'financeiro' && isStaff && (
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
            isStaff={isStaff}
            showToast={showToast}
          />
        )}
        {activeTab === 'curimba' && (
          <CurimbaTab
            pontos={pontos}
            setPontos={setPontos}
            isStaff={isStaff}
            showToast={showToast}
          />
        )}
        {activeTab === 'biblioteca' && (
          <BibliotecaTab
            livros={livros}
            setLivros={setLivros}
            mediums={mediums}
            currentUser={currentUserProfile}
            isStaff={isStaff}
            showToast={showToast}
          />
        )}
        {activeTab === 'mensagens' && (
          <MensagensTab
            notificacoes={notificacoes}
            setNotificacoes={setNotificacoes}
            mediums={mediums}
            bebidas={bebidas}
            giras={giras}
            currentUser={currentUserProfile}
            isStaff={isStaff}
            showToast={showToast}
          />
        )}
      </main>
    </div>
  );
}

/* ===================== 1. ABA INÍCIO (HOME) ===================== */
function HomeTab({ giras, setGiras, mediums, bebidas, notificacoes, currentUser, isStaff, showToast }) {
  const [novaGira, setNovaGira] = useState({ titulo: '', data_gira: '', horario: '19:30', tipo: 'Gira de Atendimento' });

  const aniversariantes = mediums.filter(m => {
    if (!m.data_nascimento) return false;
    const mes = parseInt(m.data_nascimento.split('-')[1], 10);
    return mes === MES_NUMERO;
  });

  const minhaBebidaPaga = bebidas.some(b => b.medium_id === currentUser?.id && b.pago);
  const totalBebidasPagas = bebidas.filter(b => b.pago).length;

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
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <p className="text-xs font-semibold text-stone-500 uppercase">Corrente Ativa</p>
          <p className="text-2xl font-bold text-emerald-900 mt-1">{mediums.length} Médiuns</p>
          <p className="text-xs text-stone-500 mt-1">Cadastrados na Casa Bendizer</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <p className="text-xs font-semibold text-stone-500 uppercase">Caixinha Bebidas ({MES_ATUAL})</p>
          {isStaff ? (
            <>
              <p className="text-2xl font-bold text-amber-700 mt-1">{totalBebidasPagas} / {mediums.length} Pagos</p>
              <p className="text-xs text-stone-500 mt-1">Arrecadado: R$ {(totalBebidasPagas * 10).toFixed(2)}</p>
            </>
          ) : (
            <>
              <p className={`text-xl font-bold mt-1 ${minhaBebidaPaga ? 'text-emerald-700' : 'text-amber-600'}`}>
                {minhaBebidaPaga ? 'Em dia (Pago)' : 'Pendente (R$ 10,00)'}
              </p>
              <p className="text-xs text-stone-500 mt-1">Contribuição mensal da corrente</p>
            </>
          )}
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <p className="text-xs font-semibold text-stone-500 uppercase">Próximos Trabalhos</p>
          <p className="text-2xl font-bold text-stone-800 mt-1">{giras.length} Agendados</p>
          <p className="text-xs text-stone-500 mt-1">Confira as datas abaixo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendário de Giras */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-stone-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-700" />
              Calendário de Giras & Eventos
            </h2>
          </div>

          {isStaff && (
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
                  {isStaff && (
                    <button onClick={() => removerGira(g.id)} className="text-stone-400 hover:text-red-600 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coluna Direita: Aniversariantes & Mural */}
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

/* ===================== 2. ABA MÉDIUNS (PESSOAL, SAÚDE & ESPIRITUAL) ===================== */
function MediumsTab({ mediums, setMediums, currentUser, setCurrentUser, isAdmin, isStaff, showToast }) {
  const [selectedId, setSelectedId] = useState(currentUser?.id);
  const [subTab, setSubTab] = useState('pessoal'); // 'pessoal' | 'espiritual'
  const [novoRito, setNovoRito] = useState('');
  const [novaEntidade, setNovaEntidade] = useState({ linha: 'Caboclo(a)', nome: '' });

  const activeMedium = isStaff
    ? (mediums.find(m => m.id === selectedId) || currentUser)
    : currentUser;

  const [form, setForm] = useState(activeMedium || {});

  useEffect(() => {
    if (activeMedium) setForm(activeMedium);
  }, [activeMedium?.id, mediums]);

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
      ...(isStaff ? {
        cargo: form.cargo,
        nivel_acesso: form.nivel_acesso,
        ritos: form.ritos || [],
        entidades: form.entidades || []
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
    setNovaEntidade({ linha: 'Caboclo(a)', nome: '' });
  };

  if (!form?.id) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Lista lateral (somente Admin e Secretaria veem todos os médiuns) */}
      {isStaff && (
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm h-fit">
          <h3 className="font-bold text-sm text-stone-800 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-700" />
            Corrente ({mediums.length})
          </h3>
          <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
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

      {/* Ficha Detalhada */}
      <div className={`${isStaff ? 'lg:col-span-3' : 'lg:col-span-4'} bg-white rounded-2xl border border-stone-200 p-6 shadow-sm`}>
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
              <Sparkles className="w-3.5 h-3.5" /> Dados Espirituais & Guias
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

              <div className="bg-rose-50/60 border border-rose-200/80 rounded-2xl p-4 space-y-4">
                <h3 className="font-bold text-sm text-rose-900 flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-rose-600" />
                  Ficha de Saúde & Emergência
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Tipo Sanguíneo</label>
                    <input
                      type="text"
                      value={form.tipo_sanguineo || ''}
                      onChange={e => setForm({ ...form, tipo_sanguineo: e.target.value })}
                      placeholder="Ex: O+, A-, etc."
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Contato de Emergência</label>
                    <input
                      type="text"
                      value={form.contato_emergencia || ''}
                      onChange={e => setForm({ ...form, contato_emergencia: e.target.value })}
                      placeholder="Nome e telefone de familiar"
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Alergias (Ervas, Alimentos, Remédios)</label>
                    <input
                      type="text"
                      value={form.alergias || ''}
                      onChange={e => setForm({ ...form, alergias: e.target.value })}
                      placeholder="Ex: Alergia a arruda, dipirona..."
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Condições Médicas / Uso de Remédios</label>
                    <input
                      type="text"
                      value={form.condicoes_medicas || ''}
                      onChange={e => setForm({ ...form, condicoes_medicas: e.target.value })}
                      placeholder="Ex: Hipertensão, asma..."
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm bg-white"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-5">
              {/* Cargo e Nível de Acesso */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Cargo na Casa Bendizer</label>
                  <input
                    type="text"
                    disabled={!isStaff}
                    value={form.cargo || ''}
                    onChange={e => setForm({ ...form, cargo: e.target.value })}
                    placeholder="Ex: Médium de Corrente, Cambono, Ogã, Mãe Pequena"
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm bg-white disabled:bg-stone-100"
                  />
                </div>
                {isAdmin && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">Permissão de Acesso no Sistema</label>
                    <select
                      value={form.nivel_acesso || 'medium'}
                      onChange={e => setForm({ ...form, nivel_acesso: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm bg-white"
                    >
                      <option value="medium">Médium (Acesso Restrito)</option>
                      <option value="secretaria">Secretaria / Liderança</option>
                      <option value="admin">Administrador Geral</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Ritos e Obrigações */}
              <div className="border border-stone-200 rounded-xl p-4">
                <h4 className="font-bold text-sm text-stone-800 mb-3">Ritos e Obrigações Realizadas</h4>
                {isStaff && (
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
                      {isStaff && (
                        <button type="button" onClick={() => setForm({ ...form, ritos: form.ritos.filter((_, idx) => idx !== i) })} className="text-red-500 font-bold">×</button>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              {/* Entidades de Trabalho */}
              <div className="border border-stone-200 rounded-xl p-4">
                <h4 className="font-bold text-sm text-stone-800 mb-3">Entidades de Trabalho</h4>
                {isStaff && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    <select
                      value={novaEntidade.linha}
                      onChange={e => setNovaEntidade({ ...novaEntidade, linha: e.target.value })}
                      className="px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white"
                    >
                      <option>Caboclo(a)</option>
                      <option>Preto(a)-Velho(a)</option>
                      <option>Erê / Criança</option>
                      <option>Exu</option>
                      <option>Pombagira</option>
                      <option>Boiadeiro</option>
                      <option>Marinheiro</option>
                      <option>Baiano(a)</option>
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
                      {isStaff && (
                        <button type="button" onClick={() => setForm({ ...form, entidades: form.entidades.filter((_, idx) => idx !== i) })} className="text-red-500 font-bold">×</button>
                      )}
                    </div>
                  ))}
                </div>
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

/* ===================== 3. ABA BEBIDAS (R$ 10/MÊS) ===================== */
function BebidasTab({ mediums, bebidas, setBebidas, financeiro, setFinanceiro, currentUser, isStaff, showToast }) {
  const [compraDesc, setCompraDesc] = useState('');
  const [compraValor, setCompraValor] = useState('');

  const comprasBebidas = financeiro.filter(f => f.categoria === 'Compra Bebidas');
  const totalArrecadado = bebidas.filter(b => b.pago).length * 10;
  const totalGasto = comprasBebidas.reduce((acc, item) => acc + Number(item.valor), 0);

  const togglePagamento = async (mediumId) => {
    if (!isStaff) return;
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
      showToast('Compra de bebidas registrada na prestação de contas!');
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
          <p className="text-xs font-semibold text-stone-500 uppercase">Saldo da Caixinha</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">R$ {(totalArrecadado - totalGasto).toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Contribuição Mensal */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <h2 className="font-bold text-base text-stone-800 mb-1 flex items-center gap-2">
            <Wine className="w-5 h-5 text-amber-600" />
            Contribuição Mensal (R$ 10,00 / Médium)
          </h2>
          <p className="text-xs text-stone-500 mb-4">Referência: {MES_ATUAL}</p>

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
                    disabled={!isStaff}
                    onClick={() => togglePagamento(m.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      pago
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    } ${isStaff ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                  >
                    {pago ? '✓ Pago (R$ 10)' : 'Pendente'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Prestação de Contas das Compras */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <h2 className="font-bold text-base text-stone-800 mb-4">Prestação de Contas (Compras)</h2>

          {isStaff && (
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
          )}

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

/* ===================== 4. ABA FINANCEIRO ===================== */
function FinanceiroTab({ financeiro, setFinanceiro, currentUser, showToast }) {
  const [form, setForm] = useState({ tipo: 'entrada', categoria: 'Mensalidade', descricao: '', valor: '' });

  const entradas = financeiro.filter(f => f.tipo === 'entrada').reduce((a, b) => a + Number(b.valor), 0);
  const saidas = financeiro.filter(f => f.tipo === 'saida').reduce((a, b) => a + Number(b.valor), 0);

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
          {financeiro.map(f => (
            <div key={f.id} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs">
              <div>
                <span className="font-bold text-stone-800">{f.descricao}</span>
                <span className="ml-2 px-2 py-0.5 bg-stone-200 rounded text-[10px]">{f.categoria}</span>
                <p className="text-stone-400 mt-0.5">{f.data_movimento}</p>
              </div>
              <span className={`font-bold ${f.tipo === 'entrada' ? 'text-emerald-700' : 'text-rose-700'}`}>
                {f.tipo === 'entrada' ? '+' : '-'} R$ {Number(f.valor).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===================== 5. ABA CAIXINHA DO TERREIRO (DOAÇÕES) ===================== */
function DoacoesTab({ campanhas, setCampanhas, financeiro, setFinanceiro, currentUser, isStaff, showToast }) {
  const [valorDoacao, setValorDoacao] = useState('');
  const [campanhaSelecionada, setCampanhaSelecionada] = useState('');

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <h2 className="font-bold text-lg text-stone-800 flex items-center gap-2">
          <HeartHandshake className="w-5 h-5 text-amber-600" />
          Campanhas & Metas da Casa Bendizer
        </h2>

        {campanhas.map(c => {
          const pct = Math.min(100, Math.round((Number(c.arrecadado) / Number(c.meta)) * 100));
          return (
            <div key={c.id} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-stone-800">{c.titulo}</h3>
                  <p className="text-xs text-stone-500 mt-0.5">{c.descricao}</p>
                </div>
                <span className="text-xs font-bold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg">
                  {pct}% atingido
                </span>
              </div>

              <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden my-3">
                <div className="bg-emerald-700 h-full transition-all" style={{ width: `${pct}%` }} />
              </div>

              <div className="flex justify-between text-xs font-semibold text-stone-600">
                <span>Arrecadado: R$ {Number(c.arrecadado).toFixed(2)}</span>
                <span>Meta: R$ {Number(c.meta).toFixed(2)}</span>
              </div>
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
              <label className="block text-xs font-semibold text-stone-600 mb-1">Campanha</label>
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
  );
}

/* ===================== 6. ABA CURIMBA (PONTOS, ÁUDIO & YOUTUBE) ===================== */
function CurimbaTab({ pontos, setPontos, isStaff, showToast }) {
  const [busca, setBusca] = useState('');
  const [filtroLinha, setFiltroLinha] = useState('Todas');
  const [novoPonto, setNovoPonto] = useState({
    titulo: '', linha: 'Caboclos', toque: 'Samba de Caboclo', letra: '', link_youtube: '', link_audio: ''
  });

  const cadastrarPonto = async (e) => {
    e.preventDefault();
    if (!novoPonto.titulo || !novoPonto.letra) return;
    const { data } = await supabase.from('curimba_pontos').insert([novoPonto]).select().single();
    if (data) {
      setPontos([data, ...pontos]);
      setNovoPonto({ titulo: '', linha: 'Caboclos', toque: 'Samba de Caboclo', letra: '', link_youtube: '', link_audio: '' });
      showToast('Ponto cantado salvo no caderno da Curimba!');
    }
  };

  const pontosFiltrados = pontos.filter(p => {
    const matchBusca = p.titulo.toLowerCase().includes(busca.toLowerCase()) || p.letra.toLowerCase().includes(busca.toLowerCase());
    const matchLinha = filtroLinha === 'Todas' || p.linha === filtroLinha;
    return matchBusca && matchLinha;
  });

  return (
    <div className="space-y-6">
      {isStaff && (
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <h2 className="font-bold text-base text-stone-800 mb-3 flex items-center gap-2">
            <Music className="w-5 h-5 text-emerald-700" />
            Cadastrar Novo Ponto na Curimba
          </h2>
          <form onSubmit={cadastrarPonto} className="space-y-3">
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
                <option>Abertura / Defumação</option>
                <option>Oxalá</option>
                <option>Caboclos</option>
                <option>Pretos-Velhos</option>
                <option>Erês / Crianças</option>
                <option>Exu e Pombagira</option>
                <option>Boiadeiros / Marinheiros</option>
                <option>Encerramento</option>
              </select>
              <input
                type="text"
                placeholder="Toque (Ex: Congo, Nagô, IJexá)"
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
              + Salvar Ponto
            </button>
          </form>
        </div>
      )}

      {/* Filtros */}
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
          <option>Abertura / Defumação</option>
          <option>Oxalá</option>
          <option>Caboclos</option>
          <option>Pretos-Velhos</option>
          <option>Erês / Crianças</option>
          <option>Exu e Pombagira</option>
          <option>Boiadeiros / Marinheiros</option>
          <option>Encerramento</option>
        </select>
      </div>

      {/* Lista de Pontos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pontosFiltrados.length === 0 ? (
          <p className="text-sm text-stone-500 col-span-2 text-center py-8">Nenhum ponto cadastrado nesta linha ainda.</p>
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
function BibliotecaTab({ livros, setLivros, mediums, currentUser, isStaff, showToast }) {
  const [novoLivro, setNovoLivro] = useState({ titulo: '', autor: '', categoria: 'Fundamentos' });

  const adicionarLivro = async (e) => {
    e.preventDefault();
    if (!novoLivro.titulo) return;
    const { data } = await supabase.from('biblioteca').insert([novoLivro]).select().single();
    if (data) {
      setLivros([...livros, data]);
      setNovoLivro({ titulo: '', autor: '', categoria: 'Fundamentos' });
      showToast('Livro adicionado ao acervo da Casa Bendizer!');
    }
  };

  const emprestarOuDevolver = async (livro) => {
    if (livro.status === 'Disponível') {
      const { data } = await supabase
        .from('biblioteca')
        .update({ status: 'Emprestado', emprestado_para: currentUser?.id })
        .eq('id', livro.id)
        .select()
        .single();
      if (data) {
        setLivros(livros.map(l => l.id === livro.id ? data : l));
        showToast('Livro reservado/emprestado para você!');
      }
    } else if (isStaff || livro.emprestado_para === currentUser?.id) {
      const { data } = await supabase
        .from('biblioteca')
        .update({ status: 'Disponível', emprestado_para: null })
        .eq('id', livro.id)
        .select()
        .single();
      if (data) {
        setLivros(livros.map(l => l.id === livro.id ? data : l));
        showToast('Devolução registrada com sucesso!');
      }
    }
  };

  return (
    <div className="space-y-6">
      {isStaff && (
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <h2 className="font-bold text-base text-stone-800 mb-3">Cadastrar Novo Livro / Apostila</h2>
          <form onSubmit={adicionarLivro} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input
              type="text"
              required
              placeholder="Título da Obra"
              value={novoLivro.titulo}
              onChange={e => setNovoLivro({ ...novoLivro, titulo: e.target.value })}
              className="px-3 py-2 border border-stone-200 rounded-xl text-xs"
            />
            <input
              type="text"
              placeholder="Autor / Espírito"
              value={novoLivro.autor}
              onChange={e => setNovoLivro({ ...novoLivro, autor: e.target.value })}
              className="px-3 py-2 border border-stone-200 rounded-xl text-xs"
            />
            <input
              type="text"
              placeholder="Categoria (Ex: Ervas, Orixás)"
              value={novoLivro.categoria}
              onChange={e => setNovoLivro({ ...novoLivro, categoria: e.target.value })}
              className="px-3 py-2 border border-stone-200 rounded-xl text-xs"
            />
            <button type="submit" className="bg-emerald-800 text-white text-xs font-semibold rounded-xl py-2">
              + Adicionar ao Acervo
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
            return (
              <div key={l.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">{l.categoria}</span>
                  <h3 className="font-bold text-stone-800 text-sm mt-1">{l.titulo}</h3>
                  <p className="text-xs text-stone-500 mt-0.5">{l.autor}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className={`text-xs font-bold ${l.status === 'Disponível' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {l.status === 'Disponível' ? '● Disponível' : `● Com ${portador?.nome || 'Médium'}`}
                  </span>

                  {(l.status === 'Disponível' || isStaff || l.emprestado_para === currentUser?.id) && (
                    <button
                      onClick={() => emprestarOuDevolver(l)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800"
                    >
                      {l.status === 'Disponível' ? 'Pegar Emprestado' : 'Devolver'}
                    </button>
                  )}
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
function MensagensTab({ notificacoes, setNotificacoes, mediums, bebidas, giras, currentUser, isStaff, showToast }) {
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {isStaff && (
        <div className="space-y-6">
          {/* Publicar no Mural Interno */}
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

          {/* Lembretes Rápidos via WhatsApp */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <h2 className="font-bold text-base text-stone-800 mb-2 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              Lembretes Rápidos no WhatsApp
            </h2>
            <p className="text-xs text-stone-500 mb-4">
              Clique para enviar lembrete direto no WhatsApp dos médiuns pendentes na caixinha de bebidas ({MES_ATUAL}):
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
        </div>
      )}

      {/* Mural de Avisos */}
      <div className={`${isStaff ? '' : 'lg:col-span-2'} bg-white p-6 rounded-2xl border border-stone-200 shadow-sm`}>
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
