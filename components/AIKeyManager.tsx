
import React, { useState, useEffect } from 'react';
import { Key, Plus, Trash2, CheckCircle, XCircle, AlertTriangle, Activity, ExternalLink, RefreshCw } from 'lucide-react';
import { aiRegistry } from '../services/aiRegistry';
import { AIKey, AIProvider } from '../types';

export const AIKeyManager: React.FC = () => {
  const [keys, setKeys] = useState<AIKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [newKey, setNewKey] = useState({ provider: AIProvider.GEMINI, key_value: '', label: '', priority: 5 });
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    setLoading(true);
    try {
      const data = await aiRegistry.listKeys();
      setKeys(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddKey = async () => {
    if(!newKey.key_value) return;
    await aiRegistry.addKey(newKey);
    setNewKey({ provider: AIProvider.GEMINI, key_value: '', label: '', priority: 5 });
    setShowAdd(false);
    loadKeys();
  };

  const handleDelete = async (id: number) => {
    if(confirm('Remover chave?')) {
        await aiRegistry.deleteKey(id);
        loadKeys();
    }
  };

  const toggleStatus = async (key: AIKey) => {
      await aiRegistry.updateKey(key.id, { ...key, is_active: !key.is_active });
      loadKeys();
  };

  const getProviderLink = (provider: AIProvider) => {
      switch(provider) {
          case AIProvider.GEMINI: return "https://aistudio.google.com/app/apikey";
          case AIProvider.OPENROUTER: return "https://openrouter.ai/keys";
          case AIProvider.HUGGINGFACE: return "https://huggingface.co/settings/tokens";
          case AIProvider.DEEPSEEK: return "https://platform.deepseek.com/api_keys";
          default: return "#";
      }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-200 p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h3 className="text-xl font-bold text-white flex items-center gap-2">
             <Key className="text-yellow-500"/> Gestão de Chaves de IA
           </h3>
           <p className="text-slate-400 text-sm">Configure múltiplos provedores para fallback e balanceamento.</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded flex items-center gap-2 text-sm font-bold transition-colors"
        >
          {showAdd ? 'Cancelar' : <><Plus size={16}/> Adicionar Chave</>}
        </button>
      </div>

      {showAdd && (
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-6 animate-fade-in">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                 <label className="text-xs font-bold text-slate-400 uppercase">Provedor</label>
                 <select 
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white mt-1"
                    value={newKey.provider}
                    onChange={e => setNewKey({...newKey, provider: e.target.value as AIProvider})}
                 >
                    {Object.values(AIProvider).map(p => <option key={p} value={p}>{p}</option>)}
                 </select>
                 <a href={getProviderLink(newKey.provider)} target="_blank" rel="noreferrer" className="text-[10px] text-primary-400 flex items-center gap-1 mt-1 hover:underline">
                    <ExternalLink size={10} /> Obter chave oficial ({newKey.provider})
                 </a>
              </div>
              <div>
                 <label className="text-xs font-bold text-slate-400 uppercase">Prioridade (1 = Alta)</label>
                 <input 
                    type="number" min="1" max="10"
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white mt-1"
                    value={newKey.priority}
                    onChange={e => setNewKey({...newKey, priority: parseInt(e.target.value)})}
                 />
              </div>
              <div className="md:col-span-2">
                 <label className="text-xs font-bold text-slate-400 uppercase">API Key</label>
                 <input 
                    type="text" placeholder="sk-..."
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white mt-1 font-mono"
                    value={newKey.key_value}
                    onChange={e => setNewKey({...newKey, key_value: e.target.value})}
                 />
              </div>
              <div className="md:col-span-2">
                 <label className="text-xs font-bold text-slate-400 uppercase">Rótulo (Opcional)</label>
                 <input 
                    type="text" placeholder="Ex: Chave Principal Admin"
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white mt-1"
                    value={newKey.label}
                    onChange={e => setNewKey({...newKey, label: e.target.value})}
                 />
              </div>
           </div>
           <button onClick={handleAddKey} className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-bold">Salvar Chave</button>
        </div>
      )}

      <div className="space-y-3">
         {keys.map(key => (
            <div key={key.id} className={`p-4 rounded-lg border flex items-center justify-between ${key.is_active ? 'bg-slate-800 border-slate-700' : 'bg-slate-900/50 border-slate-800 opacity-60'}`}>
               <div className="flex items-center gap-4">
                  <div className={`w-2 h-12 rounded-full ${key.is_active ? (key.error_count > 5 ? 'bg-yellow-500' : 'bg-green-500') : 'bg-red-500'}`}></div>
                  <div>
                     <h4 className="font-bold text-white flex items-center gap-2">
                        {key.label}
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">{key.provider}</span>
                     </h4>
                     <p className="text-xs text-slate-500 font-mono mt-1">
                        {key.key_value ? `••••${key.key_value.slice(-4)}` : '••••••••'} 
                        <span className="mx-2">|</span>
                        Prio: {key.priority}
                        <span className="mx-2">|</span>
                        Uso: {key.usage_count}
                     </p>
                  </div>
               </div>
               
               <div className="flex items-center gap-6">
                  <div className="text-center">
                     <p className="text-[10px] text-slate-500 uppercase">Erros</p>
                     <p className={`text-sm font-bold ${key.error_count > 0 ? 'text-red-400' : 'text-slate-300'}`}>{key.error_count}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                     <button 
                       onClick={() => toggleStatus(key)}
                       className={`p-2 rounded hover:bg-slate-700 transition-colors ${key.is_active ? 'text-green-400' : 'text-slate-500'}`}
                       title={key.is_active ? "Desativar" : "Ativar"}
                     >
                        {key.is_active ? <CheckCircle size={18}/> : <XCircle size={18}/>}
                     </button>
                     <button 
                       onClick={() => handleDelete(key.id)}
                       className="p-2 rounded hover:bg-red-900/30 text-slate-500 hover:text-red-400 transition-colors"
                     >
                        <Trash2 size={18} />
                     </button>
                  </div>
               </div>
            </div>
         ))}
         
         {keys.length === 0 && !loading && (
            <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-lg">
               <AlertTriangle size={48} className="mx-auto mb-4 opacity-20"/>
               <p>Nenhuma chave de IA configurada.</p>
               <p className="text-sm">O sistema não funcionará sem pelo menos uma chave ativa.</p>
            </div>
         )}
      </div>
    </div>
  );
};
