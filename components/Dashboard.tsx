
import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';
import { Activity, Users, FileText, AlertTriangle, Database, CheckCircle, XCircle } from 'lucide-react';
import { dataService } from '../services/dataService';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>({ users: 0, candidates: 0, activeKeys: 0, networkNodes: 0 });
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
        try {
            const healthRes = await fetch('/api/health');
            const healthData = await healthRes.json();
            setHealth(healthData);

            const statsData = await dataService.getDashboardStats();
            setStats(statsData);
        } catch (e) {
            console.error("Dashboard Load Error", e);
        } finally {
            setLoading(false);
        }
    };
    loadData();
    const interval = setInterval(loadData, 30000); // Atualiza a cada 30s
    return () => clearInterval(interval);
  }, []);

  const Card: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl hover:border-primary-600/50 transition-colors">
        <div className="flex justify-between items-start mb-4">
        <div>
            <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-white">{value}</h3>
        </div>
        <div className="p-2 bg-slate-800 rounded-lg text-primary-400">
            {icon}
        </div>
        </div>
    </div>
  );

  if (loading && !health) {
      return <div className="p-8 text-white">Carregando dados reais do sistema...</div>;
  }

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white">Visão Geral Estratégica</h2>
        <div className="flex gap-2">
           <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-mono flex items-center gap-2">
             <Database size={12} />
             DB: {health?.dbName || 'Desconhecido'}
           </span>
           {health?.db === 'CONNECTED' ? (
               <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-mono flex items-center gap-2">
                 <CheckCircle size={12} />
                 SISTEMA OPERANTE
               </span>
           ) : (
               <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs font-mono flex items-center gap-2">
                 <XCircle size={12} />
                 DB ERROR
               </span>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card title="Candidatos na Base" value={stats.candidates} icon={<Users size={20} />} />
        <Card title="Chaves IA Ativas" value={stats.activeKeys} icon={<Activity size={20} />} />
        <Card title="Nós da Rede" value={stats.networkNodes} icon={<AlertTriangle size={20} />} />
        <Card title="Usuários do Sistema" value={stats.users} icon={<FileText size={20} />} />
      </div>

      {/* Gráficos Placeholder (Para serem populados com dados de histórico em futuras versões) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 opacity-50 pointer-events-none grayscale">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center justify-center h-64">
           <p className="text-slate-500">Histórico de Atividade (Requer mais dados no DB)</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center justify-center h-64">
            <p className="text-slate-500">Evolução de Riscos (Requer mais dados no DB)</p>
        </div>
      </div>
    </div>
  );
};
