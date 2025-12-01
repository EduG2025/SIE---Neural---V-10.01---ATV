
import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell } from 'recharts';
import { dataService } from '../services/dataService';

const COLORS: Record<string, string> = {
  CORE: '#3b82f6',
  ALLY: '#22c55e',
  DONOR: '#eab308',
  RISK: '#ef4444',
  NEUTRAL: '#94a3b8',
  OPPOSITION: '#f97316'
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl">
        <p className="font-bold text-white">{data.name}</p>
        <p className="text-xs text-slate-400">Tipo: {data.type}</p>
        <p className="text-xs text-slate-400">Influência: {data.z}</p>
      </div>
    );
  }
  return null;
};

export const PoliticalNetwork: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNetwork = async () => {
        try {
            const nodes = await dataService.getPoliticalNetwork();
            setData(nodes);
        } catch(e) { console.error(e); } 
        finally { setLoading(false); }
    };
    loadNetwork();
  }, []);

  if(loading) return <div className="p-8 text-white">Carregando Rede Neural do DB...</div>;

  return (
    <div className="p-8 h-screen flex flex-col">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white">Rede Política (Live DB)</h2>
          <p className="text-slate-400 mt-2">Dados carregados da tabela `political_network`.</p>
        </div>
        <div className="flex gap-4 text-xs font-medium">
          {Object.keys(COLORS).map(type => (
            <div key={type} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[type] }}></span>
              <span className="text-slate-300">{type}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <XAxis type="number" dataKey="x" name="stature" hide domain={[0, 250]} />
                <YAxis type="number" dataKey="y" name="weight" hide domain={[0, 500]} />
                <ZAxis type="number" dataKey="z" range={[100, 1000]} name="influence" />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Nodes" data={data} fill="#8884d8">
                {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.type] || '#fff'} />
                ))}
                </Scatter>
            </ScatterChart>
            </ResponsiveContainer>
        ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
                Sem dados na rede. Adicione nós ao banco.
            </div>
        )}
      </div>
    </div>
  );
};
