
import React, { useState, useRef } from 'react';
import { Save, Shield, Globe, Database, Terminal, Lock, Server, Cpu, FolderOpen, Image, Upload, UserCog } from 'lucide-react';
import { AIKeyManager } from './AIKeyManager';
import { dataService } from '../services/dataService';

type TabType = 'SYSTEM' | 'IDENTITY' | 'SECURITY' | 'INTEGRATIONS' | 'LOGS';

export const SystemSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('SYSTEM');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [config, setConfig] = useState({
    systemName: 'SIE 3xxx',
    maintenanceMode: true,
    allowRegistration: false,
    maxLoginAttempts: 3,
    sessionTimeout: 60,
    logoUrl: '' 
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
        await dataService.updateConfig('SYSTEM_NAME', config.systemName);
        await dataService.updateConfig('MAINTENANCE_MODE', String(config.maintenanceMode));
        alert('Configurações salvas!');
    } catch(e) {
        alert('Erro ao salvar');
    } finally {
        setIsLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setIsLoading(true);
          try {
              const res = await dataService.uploadLogo(e.target.files[0]);
              setConfig({ ...config, logoUrl: res.url });
              alert('Logo atualizado!');
          } catch(e) {
              alert('Erro no upload');
          } finally {
              setIsLoading(false);
          }
      }
  };

  const renderTabButton = (id: TabType, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex flex-col items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all min-w-[120px]
        ${activeTab === id 
          ? 'border-primary-500 text-white bg-slate-800' 
          : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="p-8 h-screen flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h2 className="text-3xl font-bold text-white">Configurações do Sistema</h2>
           <p className="text-slate-400 mt-1">Painel de Controle Administrativo (Root)</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isLoading}
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all font-bold shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:opacity-50"
        >
          {isLoading ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"/> : <Save size={20} />}
          {isLoading ? 'Aplicando...' : 'Salvar Tudo'}
        </button>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex-1 flex flex-col shadow-xl">
        <div className="flex border-b border-slate-800 bg-slate-900">
          {renderTabButton('SYSTEM', 'Sistema', <Server size={20} />)}
          {renderTabButton('IDENTITY', 'Identidade', <Image size={20} />)}
          {renderTabButton('SECURITY', 'Segurança', <Shield size={20} />)}
          {renderTabButton('INTEGRATIONS', 'Inteligência', <Cpu size={20} />)}
          {renderTabButton('LOGS', 'Dados & Logs', <Database size={20} />)}
        </div>

        <div className="p-8 flex-1 overflow-y-auto bg-slate-900/50">
          
          {activeTab === 'SYSTEM' && (
            <div className="space-y-8 max-w-2xl animate-fade-in">
                <div className="bg-slate-900 p-6 rounded-lg border border-slate-800">
                   <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Server size={18} className="text-blue-400"/> Status Operacional</h3>
                   <div className="space-y-4">
                       <div>
                           <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Modo de Manutenção</label>
                           <div className="flex items-center gap-3 bg-slate-950 border border-slate-700 p-3 rounded h-[60px]">
                              <div 
                                className={`w-14 h-7 rounded-full p-1 cursor-pointer transition-colors ${config.maintenanceMode ? 'bg-yellow-600' : 'bg-slate-700'}`}
                                onClick={() => setConfig({...config, maintenanceMode: !config.maintenanceMode})}
                              >
                                 <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${config.maintenanceMode ? 'translate-x-7' : 'translate-x-0'}`} />
                              </div>
                              <div>
                                  <span className={`block text-sm font-bold ${config.maintenanceMode ? 'text-yellow-400' : 'text-slate-300'}`}>
                                      {config.maintenanceMode ? 'ATIVO (Build/Cache Mode)' : 'DESATIVADO (Produção Real)'}
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                      {config.maintenanceMode ? 'Usa pasta /credenciais para login de emergência.' : 'Exige DB MySQL para todo acesso.'}
                                  </span>
                              </div>
                           </div>
                       </div>
                   </div>
                </div>
            </div>
          )}

          {activeTab === 'IDENTITY' && (
              <div className="space-y-8 max-w-2xl animate-fade-in">
                  <div className="bg-slate-900 p-6 rounded-lg border border-slate-800">
                      <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Globe size={18} className="text-green-400"/> Branding & Visual</h3>
                      <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nome do Sistema</label>
                            <input 
                                type="text" 
                                value={config.systemName}
                                onChange={(e) => setConfig({...config, systemName: e.target.value})}
                                className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white focus:border-primary-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Logotipo</label>
                            <div className="flex items-center gap-6">
                                <div className="w-32 h-32 bg-slate-950 border border-slate-700 rounded-lg flex items-center justify-center overflow-hidden p-2">
                                    {config.logoUrl ? <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain" /> : <span className="text-slate-600 text-xs">Sem Logo</span>}
                                </div>
                                <div>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                    <button onClick={() => fileInputRef.current?.click()} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded flex items-center gap-2 border border-slate-700">
                                        <Upload size={16}/> Carregar Nova Imagem
                                    </button>
                                    <p className="text-xs text-slate-500 mt-2 max-w-[200px]">Recomendado: PNG Transparente. Será salvo em /media na VPS.</p>
                                </div>
                            </div>
                        </div>
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'SECURITY' && (
              <div className="space-y-6 max-w-2xl animate-fade-in">
                  <div className="bg-slate-900 p-6 rounded-lg border border-slate-800">
                      <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Lock size={18} className="text-red-400"/> Controle de Acesso</h3>
                      <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded">
                              <div>
                                  <div className="text-sm font-bold text-white">Registro Público</div>
                                  <div className="text-xs text-slate-500">Permitir que novos usuários se cadastrem livremente.</div>
                              </div>
                              <div 
                                className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${config.allowRegistration ? 'bg-green-600' : 'bg-slate-700'}`}
                                onClick={() => setConfig({...config, allowRegistration: !config.allowRegistration})}
                              >
                                 <div className={`bg-white w-4 h-4 rounded-full shadow transition-transform ${config.allowRegistration ? 'translate-x-5' : 'translate-x-0'}`} />
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'INTEGRATIONS' && (
             <div className="space-y-8 animate-fade-in h-full">
                {/* Embedded Key Manager */}
                <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden h-full">
                    <AIKeyManager />
                </div>
             </div>
          )}
          
          {activeTab === 'LOGS' && (
              <div className="flex flex-col h-full items-center justify-center text-slate-500">
                  <Terminal size={48} className="mb-4 opacity-20"/>
                  <p>Logs do sistema são armazenados em /var/log/sie3xxx na VPS.</p>
                  <p className="text-xs">Use o Terminal no Núcleo Neural para auditar.</p>
              </div>
          )}

        </div>
      </div>
    </div>
  );
};
