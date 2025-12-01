
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { CandidateSearch } from './components/CandidateSearch';
import { PoliticalNetwork } from './components/PoliticalNetwork';
import { AICore } from './components/AICore';
import { UserManagement } from './components/UserManagement';
import { SystemSettings } from './components/SystemSettings';
import { CommerceManager } from './components/CommerceManager';
import { UserRole, ViewState } from './types';
import { Lock, ShieldCheck, ArrowRight, User, Copy, Check } from 'lucide-react';
import { dataService } from './services/dataService';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [branding, setBranding] = useState({ name: 'SIE 3xxx', logo: '' });
  
  // Auth State
  const [isRegistering, setIsRegistering] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(false);
  const [loginCredential, setLoginCredential] = useState('');
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  
  // New Credential Display (After Register)
  const [generatedCredential, setGeneratedCredential] = useState('');
  const [copied, setCopied] = useState(false);

  // Current User
  const [currentUser, setCurrentUser] = useState<{role: UserRole, name: string} | null>(null);

  useEffect(() => {
     const load = async () => {
         try {
             const settings = await dataService.getAuthSettings();
             setBranding({ name: settings.systemName, logo: settings.logoUrl });
             setAllowRegistration(settings.allowRegistration);
         } catch(e) {
             console.warn("API de configurações indisponível, usando padrões.", e);
             // Não setamos erro crítico aqui para permitir que a tela de login apareça
             // mesmo se o backend estiver acordando ou DB off.
         }
     };
     load();
  }, []);

  const handleLogin = async (e: React.FormEvent) => { 
      e.preventDefault(); 
      setAuthLoading(true);
      setAuthError('');
      
      try {
          const res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ credential: loginCredential })
          });
          
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
              const data = await res.json();
              if (data.success) {
                  setCurrentUser({ role: data.user.role, name: data.user.name });
                  setIsAuthenticated(true);
              } else {
                  setAuthError(data.error || 'Credencial inválida ou expirada');
              }
          } else {
              setAuthError('Erro de servidor: Resposta inválida.');
          }
      } catch(e) {
          setAuthError('Erro de conexão com o servidor.');
      } finally {
          setAuthLoading(false);
      }
  };

  const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      if(registerData.password !== registerData.confirmPassword) {
          setAuthError('As senhas não coincidem.');
          return;
      }
      setAuthLoading(true);
      setAuthError('');

      try {
          const res = await dataService.registerUser({
              name: registerData.name,
              email: registerData.email,
              password: registerData.password
          });
          
          if(res.success && res.credential) {
             setGeneratedCredential(res.credential);
             setRegisterData({ name: '', email: '', password: '', confirmPassword: '' });
          } else {
             setAuthError(res.error || 'Erro desconhecido');
          }
      } catch(e: any) {
          setAuthError(e.message);
      } finally {
          setAuthLoading(false);
      }
  };

  const copyToClipboard = () => {
      navigator.clipboard.writeText(generatedCredential);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const renderView = () => {
    switch (currentView) {
      case ViewState.DASHBOARD: return <Dashboard />;
      case ViewState.CANDIDATES: return <CandidateSearch />;
      case ViewState.NETWORK: return <PoliticalNetwork />;
      case ViewState.AI_CORE: return <AICore />;
      case ViewState.USERS: return <UserManagement />;
      case ViewState.COMMERCE: return <CommerceManager />;
      case ViewState.SETTINGS: return <SystemSettings />;
      default: return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary-600/20 rounded-full blur-[128px]"></div>
        </div>

        <div className="z-10 w-full max-w-md p-8 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl transition-all">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-800 rounded-xl mb-4 border border-slate-700 overflow-hidden shadow-lg">
               {branding.logo ? <img src={branding.logo} className="w-full h-full object-cover"/> : <ShieldCheck className="text-primary-500" size={40} />}
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{branding.name}</h1>
            <p className="text-slate-400 mt-2 text-sm uppercase tracking-widest">
                {isRegistering ? 'Solicitação de Acesso' : 'Identificação Necessária'}
            </p>
          </div>

          {authError && (
              <div className="mb-6 p-3 bg-red-900/30 border border-red-500/50 rounded text-red-200 text-sm text-center flex items-center justify-center gap-2 animate-fade-in">
                  <ShieldCheck size={16} /> {authError}
              </div>
          )}

          {/* SUCESSO NO REGISTRO - EXIBIR CREDENCIAL */}
          {generatedCredential ? (
              <div className="animate-fade-in text-center space-y-6">
                  <div className="bg-green-900/20 border border-green-500/50 p-4 rounded-lg">
                      <h3 className="text-green-400 font-bold mb-2">Conta Criada com Sucesso!</h3>
                      <p className="text-slate-400 text-xs mb-4">Esta é sua única chave de acesso. Salve-a em local seguro.</p>
                      
                      <div className="bg-black border border-slate-700 p-3 rounded flex items-center justify-between group">
                          <code className="text-primary-400 font-mono text-lg font-bold tracking-wider">{generatedCredential}</code>
                          <button onClick={copyToClipboard} className="text-slate-500 hover:text-white transition-colors">
                              {copied ? <Check size={20} className="text-green-500"/> : <Copy size={20}/>}
                          </button>
                      </div>
                  </div>
                  <button 
                    onClick={() => { setGeneratedCredential(''); setIsRegistering(false); setLoginCredential(generatedCredential); }}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-lg"
                  >
                      Ir para Login
                  </button>
              </div>
          ) : (
            <>
                {!isRegistering ? (
                    /* TELA DE LOGIN (APENAS CREDENCIAL) */
                    <form onSubmit={handleLogin} className="space-y-6 animate-fade-in">
                        <div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="text-slate-500 group-focus-within:text-primary-500 transition-colors" size={24} />
                                </div>
                                <input 
                                    type="password" 
                                    placeholder="Credencial de Acesso (Token)"
                                    required
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-4 pl-14 pr-4 text-white text-lg placeholder-slate-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-center tracking-widest font-mono"
                                    value={loginCredential} 
                                    onChange={e => setLoginCredential(e.target.value)}
                                />
                            </div>
                        </div>

                        <button type="submit" disabled={authLoading} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all flex items-center justify-center gap-2 uppercase tracking-wide text-sm">
                            {authLoading ? 'Autenticando...' : 'Acessar Sistema'}
                        </button>
                        
                        <div className="text-center space-y-2 pt-4">
                            <p className="text-[10px] text-slate-600 uppercase tracking-widest">Acesso restrito. Todas as atividades são monitoradas.</p>
                            <p className="text-[10px] text-slate-700 font-mono">IP: 72.61.217.128 • SERVER: ACTIVE</p>
                        </div>
                    </form>
                ) : (
                    /* TELA DE REGISTRO */
                    <form onSubmit={handleRegister} className="space-y-4 animate-fade-in">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                            <input 
                                type="text" required
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-primary-500"
                                value={registerData.name} onChange={e => setRegisterData({...registerData, name: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Corporativo</label>
                            <input 
                                type="email" required
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-primary-500"
                                value={registerData.email} onChange={e => setRegisterData({...registerData, email: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Senha (Pessoal)</label>
                                <input 
                                    type="password" required
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-primary-500"
                                    value={registerData.password} onChange={e => setRegisterData({...registerData, password: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirmar</label>
                                <input 
                                    type="password" required
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-primary-500"
                                    value={registerData.confirmPassword} onChange={e => setRegisterData({...registerData, confirmPassword: e.target.value})}
                                />
                            </div>
                        </div>

                        <button type="submit" disabled={authLoading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-lg">
                            {authLoading ? 'Gerando Credencial...' : 'CRIAR CONTA'}
                        </button>
                    </form>
                )}

                {/* BOTÃO ALTERNAR LOGIN/REGISTRO */}
                {allowRegistration && (
                    <div className="mt-6 text-center border-t border-slate-800 pt-4">
                        <button 
                            onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }}
                            className="text-primary-400 hover:text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 w-full"
                        >
                            {isRegistering ? (
                                <>Voltar para Login</>
                            ) : (
                                <>Solicitar Acesso / Criar Conta <ArrowRight size={14}/></>
                            )}
                        </button>
                    </div>
                )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex">
      <Sidebar 
        currentView={currentView} role={currentUser?.role || UserRole.USER} onNavigate={setCurrentView} onLogout={() => setIsAuthenticated(false)}
        isCollapsed={isSidebarCollapsed} toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <main className={`flex-1 transition-all duration-300 relative overflow-x-hidden ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        {renderView()}
      </main>
    </div>
  );
};

export default App;
