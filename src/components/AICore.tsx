
import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, Cpu, Save, Folder, FileCode, Plus, 
  Code, Eye, Send, Server, RefreshCw, Play, AlertTriangle, 
  ShieldAlert, ShieldCheck, Box, Edit, Trash2, Power, DownloadCloud, Database, MessageSquare,
  ChevronRight, ChevronDown, File, Activity, GitCommit, FileDiff, RotateCcw, Check
} from 'lucide-react';
import { developSystemModule } from '../services/geminiService';
import { fileService } from '../services/fileService';
import { dataService } from '../services/dataService';
import { FileNode, ModuleMetrics, RiskAnalysis } from '../types';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

// --- SUB-COMPONENTS ---

const ModuleMonitor: React.FC = () => {
    const [metrics, setMetrics] = useState<ModuleMetrics[]>([]);

    useEffect(() => {
        const load = async () => {
            try {
               const res = await fetch('/api/modules/metrics');
               setMetrics(await res.json());
            } catch(e) {}
        };
        load();
        const i = setInterval(load, 5000);
        return () => clearInterval(i);
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {metrics.map(m => (
                <div key={m.name} className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
                    <div className="flex justify-between mb-2">
                        <span className="text-white font-bold">{m.name}</span>
                        <span className={`text-[10px] px-2 rounded ${m.status === 'ONLINE' ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                            {m.status}
                        </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-400">
                        <div>
                            <span className="block text-[10px] uppercase">Latency</span>
                            <span className={m.latencyMs > 200 ? 'text-yellow-400' : 'text-green-400'}>{m.latencyMs}ms</span>
                        </div>
                        <div>
                            <span className="block text-[10px] uppercase">CPU</span>
                            <span>{m.cpuUsage}%</span>
                        </div>
                        <div>
                            <span className="block text-[10px] uppercase">MEM</span>
                            <span>{m.memoryUsage}MB</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

const FileTreeItem: React.FC<{ 
  node: FileNode; 
  level: number; 
  onSelect: (path: string) => void;
  selectedPath: string | null;
}> = ({ node, level, onSelect, selectedPath }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isSelected = selectedPath === node.path;

  const handleClick = () => {
    if (node.type === 'DIRECTORY') {
      setIsOpen(!isOpen);
    } else {
      onSelect(node.path);
    }
  };

  return (
    <div>
      <div 
        onClick={handleClick}
        className={`flex items-center gap-2 py-1 px-2 cursor-pointer hover:bg-slate-800 transition-colors ${isSelected ? 'bg-primary-900/30 text-primary-400' : 'text-slate-400'}`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {node.type === 'DIRECTORY' ? (
          isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
        ) : (
          node.isProtected ? <ShieldAlert size={14} className="text-red-500" /> : <FileCode size={14} />
        )}
        <span className={`text-sm truncate ${node.isProtected ? 'font-bold text-red-400' : ''}`}>{node.name}</span>
      </div>
      {isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem 
              key={child.path} 
              node={child} 
              level={level + 1} 
              onSelect={onSelect}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const AICore: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ROOT' | 'ENGINEERING'>('ROOT');
  const [systemStats, setSystemStats] = useState<any>(null);
  const [modules, setModules] = useState<FileNode[]>([]);
  const [terminalOutput, setTerminalOutput] = useState<string>('');
  const [isBuilding, setIsBuilding] = useState(false);
  
  // IDE State
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>(''); // For Diff
  const [ideViewMode, setIdeViewMode] = useState<'CODE' | 'PREVIEW' | 'DIFF'>('CODE');
  
  // Risk & Diff Analysis
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null);
  const [showDiffModal, setShowDiffModal] = useState(false);

  // Chat State
  const [prompt, setPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'USER' | 'AI' | 'SYSTEM', text: string}[]>([]);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initSystemCheck();
    loadModules();
    loadFileTree();
    const interval = setInterval(loadSystemHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const initSystemCheck = async () => {
      try {
          setChatHistory([{ role: 'SYSTEM', text: 'Iniciando verificação de integridade...' }]);
          const res = await fetch('/api/health');
          const data = await res.json();
          setSystemStats(data);

          if (data.db === 'CONNECTED') {
             setChatHistory(prev => [...prev, { 
                 role: 'SYSTEM', 
                 text: `✅ CONEXÃO ESTABELECIDA.\nHost: VPS (Linux)\nDB: ${data.dbName} (MySQL - RW)\nFS: Writable (Root)\nStatus: SISTEMA OPERACIONAL` 
             }]);
          } else {
             setChatHistory(prev => [...prev, { 
                 role: 'SYSTEM', 
                 text: `❌ ERRO CRÍTICO.\nFalha na conexão com Banco de Dados.\nVerifique o arquivo .env e o serviço MySQL.` 
             }]);
          }
      } catch (e) {
          setChatHistory(prev => [...prev, { role: 'SYSTEM', text: '❌ FALHA NO BACKEND.\nO servidor Node.js parece estar offline.' }]);
      }
  };

  const loadSystemHealth = async () => {
    try {
      const res = await fetch('/api/health');
      setSystemStats(await res.json());
    } catch (e) { console.error("Health Check Failed"); }
  };

  const loadModules = async () => {
    try { setModules(await fileService.listModules()); } catch (e) { console.error(e); }
  };

  const loadFileTree = async () => {
    try {
        const components = await fileService.listFiles('src/components');
        const staging = await fileService.listFiles('src/staging_builds');
        const active = await fileService.listFiles('src/active_modules');
        const server = await fileService.listFiles('server');
        
        const tree: FileNode[] = [
            { name: 'staging_builds', path: 'src/staging_builds', type: 'DIRECTORY', children: staging },
            { name: 'active_modules', path: 'src/active_modules', type: 'DIRECTORY', children: active },
            { name: 'components', path: 'src/components', type: 'DIRECTORY', children: components },
            { name: 'server (PROTECTED)', path: 'server', type: 'DIRECTORY', children: server },
        ];
        setFileTree(tree);
    } catch (e) { console.error("File Tree Error", e); }
  };

  const handleFileSelect = async (path: string) => {
    try {
      setSelectedFile(path);
      const content = await fileService.readFile(path);
      setFileContent(content);
      setOriginalContent(content); // Guarda estado original para Diff
      setIdeViewMode('CODE');
    } catch (e) { alert('Erro ao ler arquivo: ' + e); }
  };

  const executeBuild = async () => {
    setIsBuilding(true);
    setTerminalOutput('> npm run build\nIniciando compilação (Aguarde, isso pode demorar)...');
    try {
        const res = await fileService.executeCommand('npm run build');
        setTerminalOutput(prev => prev + `\n${res.output}\nExit Code: ${res.exitCode}`);
        if(res.exitCode === 0) {
            setTerminalOutput(prev => prev + '\n✅ BUILD SUCESSO! Frontend atualizado.');
        } else {
            setTerminalOutput(prev => prev + `\n❌ ERRO NO BUILD:\n${res.error}`);
        }
    } catch (e) { setTerminalOutput(prev => prev + '\nErro Fatal: ' + e); } finally { setIsBuilding(false); }
  };

  const handleSendMessage = async () => {
    if (!prompt.trim()) return;
    const userMsg = prompt;
    setPrompt('');
    setChatHistory(prev => [...prev, { role: 'USER', text: userMsg }]);
    setIsAiProcessing(true);

    try {
      const context = selectedFile 
        ? `Arquivo: ${selectedFile}\nCódigo Original:\n${originalContent}`
        : "Nenhum arquivo aberto.";

      const response = await developSystemModule(userMsg, context);
      
      setChatHistory(prev => [...prev, { role: 'AI', text: response.message }]);

      if (response.riskAnalysis) setRiskAnalysis(response.riskAnalysis);

      if (response.files && response.files.length > 0) {
          // Em vez de salvar direto, propõe alterações
          const proposedFile = response.files[0];
          if(selectedFile && proposedFile.path === selectedFile) {
              setFileContent(proposedFile.content);
              setIdeViewMode('DIFF'); // Auto switch to Diff view
              setChatHistory(prev => [...prev, { role: 'SYSTEM', text: `⚠️ Alterações propostas em ${proposedFile.path}. Revise o DIFF.` }]);
          } else {
             // Novo arquivo
             setChatHistory(prev => [...prev, { role: 'SYSTEM', text: `📝 IA sugere criar: ${proposedFile.path}` }]);
             await fileService.saveFile(proposedFile.path, proposedFile.content);
             loadFileTree();
          }
      }

      if (response.shellCommand) {
          setChatHistory(prev => [...prev, { role: 'SYSTEM', text: `💻 Executando: ${response.shellCommand}` }]);
          const res = await fileService.executeCommand(response.shellCommand);
          setTerminalOutput(res.output);
      }
    } catch (error: any) {
      setChatHistory(prev => [...prev, { role: 'SYSTEM', text: `❌ Falha: ${error.message}` }]);
    } finally { setIsAiProcessing(false); }
  };

  const handleSaveWithRiskCheck = async () => {
      if(!selectedFile) return;
      
      // Feature 2: Proteção Visual/Escudo
      if(selectedFile.includes('server/') || selectedFile.includes('AICore')) {
          if(!confirm('⚠️ ARQUIVO CRÍTICO DO SISTEMA!\nAlterações aqui podem quebrar o painel.\nDeseja realmente continuar?')) return;
      }

      setShowDiffModal(true);
  };

  const confirmSave = async () => {
      if(!selectedFile) return;
      setShowDiffModal(false);
      
      // Salvar e atualizar o Original para refletir a nova versão
      const res = await fileService.saveFile(selectedFile, fileContent);
      if (res) {
          setOriginalContent(fileContent);
          setChatHistory(prev => [...prev, { role: 'SYSTEM', text: `✅ Arquivo salvo com sucesso! Snapshot criado em .backups/` }]);
      } else {
          setChatHistory(prev => [...prev, { role: 'SYSTEM', text: `❌ Erro ao salvar arquivo.` }]);
      }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-200">
      <div className="flex border-b border-slate-800 bg-slate-900">
        <button onClick={() => setActiveTab('ROOT')} className={`px-6 py-3 flex items-center gap-2 font-bold text-sm ${activeTab === 'ROOT' ? 'bg-slate-800 text-white border-b-2 border-primary-500' : 'text-slate-400'}`}>
          <ShieldAlert size={16} /> ROOT CONTROL
        </button>
        <button onClick={() => setActiveTab('ENGINEERING')} className={`px-6 py-3 flex items-center gap-2 font-bold text-sm ${activeTab === 'ENGINEERING' ? 'bg-slate-800 text-white border-b-2 border-primary-500' : 'text-slate-400'}`}>
          <Cpu size={16} /> ENGINEERING IDE
        </button>
        <div className="ml-auto px-4 flex items-center gap-4 text-xs font-mono text-slate-500">
             {riskAnalysis && <span className={`flex items-center gap-1 ${riskAnalysis.riskLevel === 'HIGH' ? 'text-red-500' : 'text-green-500'}`}>RISK: {riskAnalysis.riskLevel}</span>}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'ROOT' && (
          <div className="h-full p-8 overflow-y-auto">
             <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white"><Activity className="inline mr-2"/> Performance Monitor</h2>
                <span className="text-xs text-slate-500">Atualização em Tempo Real</span>
             </div>
             <ModuleMonitor /> {/* Feature 8 */}

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                   <h3 className="text-lg font-bold text-white mb-4"><Play size={20} className="inline mr-2"/> Build & Deploy</h3>
                   <button onClick={executeBuild} disabled={isBuilding} className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded font-bold transition-all disabled:opacity-50">
                     {isBuilding ? 'Compilando Frontend (Isso pode demorar)...' : 'Executar Build (npm run build)'}
                   </button>
                </div>
                <div className="bg-black border border-slate-800 p-4 rounded-xl font-mono text-xs text-green-400 overflow-y-auto max-h-48">
                   <pre>{terminalOutput || 'Terminal pronto para comandos...'}</pre>
                </div>
             </div>
             
             {/* Staging & Active Modules Visualization */}
             <div className="grid grid-cols-2 gap-8">
                 <div className="border border-slate-800 p-4 rounded-lg bg-slate-900/50">
                     <h4 className="text-yellow-400 font-bold mb-4 uppercase text-xs tracking-wider">Staging Builds (Rascunhos)</h4>
                     <p className="text-xs text-slate-500 mb-4">Módulos em desenvolvimento. Mova para Active para publicar.</p>
                     <button onClick={() => { setActiveTab('ENGINEERING'); setPrompt('Criar novo módulo em staging chamado...'); }} className="w-full border border-dashed border-slate-600 p-2 text-slate-400 hover:text-white rounded flex items-center justify-center gap-2">
                         <Plus size={14}/> Criar Novo Módulo
                     </button>
                 </div>
                 <div className="border border-slate-800 p-4 rounded-lg bg-slate-900/50">
                     <h4 className="text-green-400 font-bold mb-4 uppercase text-xs tracking-wider">Active Modules (Produção)</h4>
                     <div className="space-y-2">
                        {modules.map(m => (
                            <div key={m.name} className="flex justify-between items-center text-sm bg-slate-800 p-2 rounded">
                                <span>{m.name}</span>
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            </div>
                        ))}
                     </div>
                 </div>
             </div>
          </div>
        )}

        {activeTab === 'ENGINEERING' && (
           <div className="flex h-full">
              <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden">
                 <div className="p-3 border-b border-slate-800 text-xs font-bold text-slate-500 uppercase">Explorer</div>
                 <div className="flex-1 overflow-y-auto p-2">
                    {fileTree.map(node => <FileTreeItem key={node.path} node={node} level={0} onSelect={handleFileSelect} selectedPath={selectedFile}/>)}
                 </div>
              </div>

              <div className="flex-1 flex flex-col bg-slate-950">
                 <div className="h-10 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900">
                    <span className="text-sm text-slate-300 flex items-center gap-2">
                        {selectedFile?.includes('server') && <ShieldAlert size={14} className="text-red-500"/>}
                        {selectedFile || 'Selecione um arquivo'}
                    </span>
                    <div className="flex bg-slate-950 rounded p-0.5">
                       <button onClick={() => setIdeViewMode('CODE')} className={`px-3 py-1 text-xs rounded ${ideViewMode === 'CODE' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>Code</button>
                       <button onClick={() => setIdeViewMode('DIFF')} className={`px-3 py-1 text-xs rounded ${ideViewMode === 'DIFF' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>Diff</button>
                    </div>
                 </div>
                 
                 <div className="flex-1 overflow-hidden relative">
                    {ideViewMode === 'CODE' ? (
                       <textarea className="w-full h-full bg-[#0d1117] text-slate-300 font-mono text-sm p-4 resize-none focus:outline-none" value={fileContent} onChange={(e) => setFileContent(e.target.value)} spellCheck={false} />
                    ) : ideViewMode === 'DIFF' ? (
                        <div className="w-full h-full bg-[#0d1117] flex font-mono text-xs">
                            <div className="flex-1 border-r border-slate-800 bg-red-900/5 flex flex-col">
                                <div className="p-2 bg-slate-900 border-b border-slate-800 text-red-400 font-bold text-center">SERVIDOR (ATUAL)</div>
                                <pre className="p-4 overflow-auto flex-1 text-slate-400">{originalContent}</pre>
                            </div>
                            <div className="flex-1 bg-green-900/5 flex flex-col">
                                <div className="p-2 bg-slate-900 border-b border-slate-800 text-green-400 font-bold text-center">EDIÇÃO (NOVO)</div>
                                <pre className="p-4 overflow-auto flex-1 text-slate-200">{fileContent}</pre>
                            </div>
                        </div>
                    ) : null}
                 </div>
                 
                 {selectedFile && (
                    <div className="h-12 border-t border-slate-800 flex items-center justify-between px-4 bg-slate-900">
                       <div className="flex items-center gap-2 text-xs text-slate-500">
                           {fileContent !== originalContent ? (
                               <span className="text-yellow-400 flex items-center gap-1"><AlertTriangle size={12}/> Não salvo</span>
                           ) : (
                               <span className="text-green-500 flex items-center gap-1"><Check size={12}/> Sincronizado</span>
                           )}
                       </div>
                       <button onClick={handleSaveWithRiskCheck} className="text-xs bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded flex items-center gap-2 font-bold">
                          <Save size={14}/> Aplicar Alterações
                       </button>
                    </div>
                 )}
              </div>

              <div className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col">
                 <div className="p-3 border-b border-slate-800 text-xs font-bold text-slate-500 uppercase">Editor Neural</div>
                 <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatHistory.map((msg, i) => (
                       <div key={i} className={`text-sm p-3 rounded-lg ${msg.role === 'USER' ? 'bg-primary-900/50 ml-8' : 'bg-slate-800 mr-8'}`}>
                          {msg.role === 'SYSTEM' && <span className="text-yellow-500 font-bold block text-[10px] mb-1">SYSTEM</span>}
                          <div className="whitespace-pre-wrap">{msg.text}</div>
                       </div>
                    ))}
                    <div ref={chatEndRef} />
                 </div>
                 <div className="p-4 border-t border-slate-800">
                    <div className="relative">
                       <textarea className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm h-20" placeholder="Comando..." value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()} />
                       <button onClick={handleSendMessage} disabled={isAiProcessing} className="absolute right-2 bottom-2 bg-primary-600 p-2 rounded text-white"><Send size={16}/></button>
                    </div>
                 </div>
              </div>
           </div>
        )}
      </div>

      {/* MODAL DE DIFF / CONFIRMAÇÃO DE RISCO */}
      {showDiffModal && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8 backdrop-blur-sm">
              <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-5xl h-[80vh] flex flex-col shadow-2xl">
                  <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 rounded-t-xl">
                      <div>
                          <h3 className="text-xl font-bold text-white flex items-center gap-2">
                              <GitCommit className="text-primary-400" /> Revisão de Alterações
                          </h3>
                          <p className="text-xs text-slate-400 mt-1">Compare o código atual com o novo antes de aplicar na VPS.</p>
                      </div>
                      
                      {riskAnalysis && (
                          <div className={`px-4 py-2 rounded border font-bold text-sm ${riskAnalysis.riskLevel === 'HIGH' ? 'bg-red-900/50 border-red-500 text-red-400' : 'bg-green-900/50 border-green-500 text-green-400'}`}>
                              RISCO DETECTADO: {riskAnalysis.riskLevel}
                          </div>
                      )}
                  </div>
                  
                  <div className="flex-1 overflow-hidden flex flex-col">
                      {/* Risk Dashboard */}
                      {riskAnalysis && (
                          <div className="grid grid-cols-4 gap-4 p-4 bg-slate-900 border-b border-slate-800">
                              <div className="bg-slate-950 p-3 rounded border border-slate-800 text-center">
                                  <div className="text-[10px] text-slate-500 uppercase">Segurança</div>
                                  <div className="text-xl font-bold text-blue-400">{riskAnalysis.securityScore}/100</div>
                              </div>
                              <div className="bg-slate-950 p-3 rounded border border-slate-800 text-center">
                                  <div className="text-[10px] text-slate-500 uppercase">Performance</div>
                                  <div className="text-xl font-bold text-yellow-400">{riskAnalysis.performanceScore}/100</div>
                              </div>
                              <div className="bg-slate-950 p-3 rounded border border-slate-800 text-center">
                                  <div className="text-[10px] text-slate-500 uppercase">Integridade</div>
                                  <div className="text-xl font-bold text-green-400">{riskAnalysis.integrityScore}/100</div>
                              </div>
                              <div className="bg-slate-950 p-3 rounded border border-slate-800 text-xs text-slate-400 flex items-center">
                                  {riskAnalysis.analysis}
                              </div>
                          </div>
                      )}

                      {/* Side by Side Diff */}
                      <div className="flex-1 flex overflow-hidden border-t border-slate-800">
                            <div className="w-1/2 flex flex-col border-r border-slate-800 bg-red-900/5">
                                <div className="p-2 bg-slate-950 text-red-400 text-xs font-bold border-b border-slate-800 flex justify-between">
                                    <span>VERSÃO ATUAL (VPS)</span>
                                    <RotateCcw size={12}/>
                                </div>
                                <pre className="flex-1 p-4 overflow-auto font-mono text-xs text-slate-500 leading-relaxed">{originalContent}</pre>
                            </div>
                            <div className="w-1/2 flex flex-col bg-green-900/5">
                                <div className="p-2 bg-slate-950 text-green-400 text-xs font-bold border-b border-slate-800 flex justify-between">
                                    <span>NOVA VERSÃO (STAGED)</span>
                                    <FileDiff size={12}/>
                                </div>
                                <pre className="flex-1 p-4 overflow-auto font-mono text-xs text-slate-200 leading-relaxed">{fileContent}</pre>
                            </div>
                      </div>
                  </div>

                  <div className="p-6 border-t border-slate-800 bg-slate-950 rounded-b-xl flex justify-between items-center">
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                          <ShieldCheck size={14} className="text-green-500"/>
                          <span>Backup automático será criado em <strong>.backups/</strong></span>
                      </div>
                      <div className="flex gap-4">
                        <button onClick={() => setShowDiffModal(false)} className="px-6 py-2 text-slate-400 hover:text-white font-bold text-sm">Cancelar</button>
                        <button onClick={confirmSave} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)] flex items-center gap-2">
                            <Save size={18}/> Criar Snapshot & Salvar
                        </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
