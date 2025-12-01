
import React, { useState, useEffect } from 'react';
import { Search, Brain, ChevronRight, AlertCircle, CheckCircle, Users, Trash2 } from 'lucide-react';
import { Candidate } from '../types';
import { analyzeCandidateProfile } from '../services/geminiService';
import { dataService } from '../services/dataService';

export const CandidateSearch: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
        const data = await dataService.getCandidates();
        setCandidates(data);
    } catch(e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const filtered = candidates.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleAnalysis = async (candidate: Candidate) => {
    setIsAnalyzing(true);
    setSelectedCandidate(candidate);
    setAiAnalysis(null);
    
    // Se o candidato já tem análise salva no DB, poderíamos usar aqui
    const context = `Partido: ${candidate.party}, Estado: ${candidate.state}.`;
    
    const result = await analyzeCandidateProfile(candidate.name, context);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(!confirm('Excluir candidato?')) return;
      await dataService.deleteCandidate(id);
      loadCandidates();
      if(selectedCandidate?.id === id) setSelectedCandidate(null);
  };

  return (
    <div className="p-8 h-screen flex flex-col">
      <h2 className="text-3xl font-bold text-white mb-6">Candidate Search & Scoring</h2>
      
      <div className="flex gap-6 h-full">
        {/* List Section */}
        <div className="w-1/3 flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-500" size={20} />
            <input 
              type="text" 
              placeholder="Buscar candidato no DB..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {loading && <p className="text-slate-500 text-center py-4">Carregando base de dados...</p>}
            
            {!loading && filtered.length === 0 && <p className="text-slate-500 text-center py-4">Nenhum candidato encontrado.</p>}

            {filtered.map(candidate => (
              <div 
                key={candidate.id}
                onClick={() => setSelectedCandidate(candidate)}
                className={`p-4 rounded-lg border cursor-pointer transition-all flex items-center gap-4 group relative
                  ${selectedCandidate?.id === candidate.id 
                    ? 'bg-slate-800 border-primary-500' 
                    : 'bg-slate-900 border-slate-800 hover:border-slate-600'}`}
              >
                <img src={candidate.photo || "https://i.pravatar.cc/150?u=def"} alt={candidate.name} className="w-12 h-12 rounded-full object-cover" />
                <div className="flex-1">
                  <h4 className="font-bold text-white">{candidate.name}</h4>
                  <p className="text-xs text-slate-400">{candidate.party} - {candidate.state}</p>
                </div>
                <div className={`text-sm font-bold ${
                  candidate.score > 80 ? 'text-green-400' : candidate.score > 50 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {candidate.score}
                </div>
                <button 
                    onClick={(e) => handleDelete(e, candidate.id)}
                    className="absolute right-2 top-2 p-1.5 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 rounded-full"
                >
                    <Trash2 size={14}/>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Detail Section */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-8 overflow-y-auto">
          {selectedCandidate ? (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <img src={selectedCandidate.photo || "https://i.pravatar.cc/150?u=def"} alt={selectedCandidate.name} className="w-24 h-24 rounded-lg object-cover" />
                  <div>
                    <h2 className="text-3xl font-bold text-white">{selectedCandidate.name}</h2>
                    <div className="flex gap-2 mt-2">
                      <span className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded border border-slate-700">{selectedCandidate.party}</span>
                      <span className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded border border-slate-700">{selectedCandidate.state}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleAnalysis(selectedCandidate)}
                  disabled={isAnalyzing}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Brain size={20} />
                  {isAnalyzing ? 'Analisando...' : 'Gerar Relatório IA'}
                </button>
              </div>

              {aiAnalysis && (
                <div className="space-y-6 animate-fade-in mt-6 border-t border-slate-800 pt-6">
                   <div className="grid grid-cols-3 gap-4">
                      <div className="bg-slate-950 p-4 rounded-lg text-center border border-slate-800">
                         <p className="text-slate-400 text-xs uppercase mb-1">Score Viabilidade</p>
                         <p className="text-4xl font-bold text-primary-400">{aiAnalysis.score}</p>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-lg text-center border border-slate-800">
                         <p className="text-slate-400 text-xs uppercase mb-1">Risco Político</p>
                         <p className={`text-2xl font-bold ${aiAnalysis.riskLevel === 'HIGH' ? 'text-red-500' : 'text-yellow-500'}`}>
                           {aiAnalysis.riskLevel}
                         </p>
                      </div>
                   </div>
                   <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                      <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                        <Brain size={18} className="text-primary-400"/> Análise Estratégica
                      </h4>
                      <p className="text-slate-300 leading-relaxed text-sm">
                        {aiAnalysis.analysis}
                      </p>
                   </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <Users size={48} className="mb-4 opacity-20" />
              <p>Selecione um candidato para visualizar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
