
import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, Users, Network, BrainCircuit, Settings, LogOut, ShieldAlert, UserCog, ChevronLeft, ChevronRight, ShoppingBag
} from 'lucide-react';
import { ViewState, UserRole } from '../types';
import { dataService } from '../services/dataService';

interface SidebarProps {
  currentView: ViewState;
  role: UserRole;
  onNavigate: (view: ViewState) => void;
  onLogout: () => void;
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, role, onNavigate, onLogout, isCollapsed, toggleSidebar }) => {
  const [branding, setBranding] = useState({ name: 'SIE 3xxx', logo: '' });

  useEffect(() => {
      const loadBranding = async () => {
          const b = await dataService.getBranding();
          setBranding({ name: b.systemName, logo: b.logoUrl });
      };
      loadBranding();
  }, []);
  
  const navItemClass = (view: ViewState) => `
    flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer mb-1 group relative
    ${currentView === view ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
    ${isCollapsed ? 'justify-center px-2' : ''}
  `;

  return (
    <div className={`h-screen bg-slate-900 border-r border-slate-800 flex flex-col fixed left-0 top-0 z-50 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`p-4 border-b border-slate-800 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden animate-fade-in">
            <div className="w-8 h-8 bg-primary-600 rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden">
               {branding.logo ? <img src={branding.logo} className="w-full h-full object-cover"/> : <ShieldAlert size={20} className="text-white" />}
            </div>
            <div className="whitespace-nowrap overflow-hidden">
              <h1 className="text-sm font-bold text-white tracking-tight">{branding.name}</h1>
              <p className="text-[10px] text-slate-500 font-mono">v3.3.0</p>
            </div>
          </div>
        )}
        {isCollapsed && (
           <div className="w-8 h-8 bg-primary-600 rounded-md flex items-center justify-center flex-shrink-0">
               {branding.logo ? <img src={branding.logo} className="w-full h-full object-cover"/> : <ShieldAlert size={20} className="text-white" />}
           </div>
        )}
        <button onClick={toggleSidebar} className={`text-slate-500 hover:text-white transition-colors ${isCollapsed ? 'hidden' : 'block'}`}>
          <ChevronLeft size={20} />
        </button>
      </div>
      
      {isCollapsed && (
        <div className="flex justify-center py-2 border-b border-slate-800">
          <button onClick={toggleSidebar} className="text-slate-500 hover:text-white"><ChevronRight size={20} /></button>
        </div>
      )}

      <nav className="flex-1 p-3 overflow-y-auto">
        <div onClick={() => onNavigate(ViewState.DASHBOARD)} className={navItemClass(ViewState.DASHBOARD)}><LayoutDashboard size={20} /> {!isCollapsed && <span>Dashboard</span>}</div>
        <div onClick={() => onNavigate(ViewState.CANDIDATES)} className={navItemClass(ViewState.CANDIDATES)}><Users size={20} /> {!isCollapsed && <span>Candidatos</span>}</div>
        <div onClick={() => onNavigate(ViewState.NETWORK)} className={navItemClass(ViewState.NETWORK)}><Network size={20} /> {!isCollapsed && <span>Rede Política</span>}</div>

        {role === UserRole.ADMIN && (
          <>
            <div className="my-4 border-t border-slate-800"></div>
            <div onClick={() => onNavigate(ViewState.COMMERCE)} className={navItemClass(ViewState.COMMERCE)}><ShoppingBag size={20} /> {!isCollapsed && <span>Commerce & Planos</span>}</div>
            <div onClick={() => onNavigate(ViewState.USERS)} className={navItemClass(ViewState.USERS)}><UserCog size={20} /> {!isCollapsed && <span>Gestão Usuários</span>}</div>
            <div onClick={() => onNavigate(ViewState.AI_CORE)} className={navItemClass(ViewState.AI_CORE)}><BrainCircuit size={20} /> {!isCollapsed && <span>Núcleo Neural IA</span>}</div>
          </>
        )}
      </nav>

      <div className="p-3 border-t border-slate-800">
        <div onClick={() => onNavigate(ViewState.SETTINGS)} className={navItemClass(ViewState.SETTINGS)}><Settings size={20} /> {!isCollapsed && <span>Configurações</span>}</div>
        <button onClick={onLogout} className={`w-full mt-2 flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-950/30 transition-all ${isCollapsed ? 'justify-center px-2' : ''}`}>
          <LogOut size={20} /> {!isCollapsed && <span>Sair</span>}
        </button>
      </div>
    </div>
  );
};
