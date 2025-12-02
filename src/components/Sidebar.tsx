
import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, Users, Network, BrainCircuit, Settings, LogOut, ShieldAlert, UserCog, ChevronLeft, ChevronRight, ShoppingBag, Menu
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
    flex items-center gap-3 px-3 py-3 rounded-lg transition-all cursor-pointer mb-1 group relative overflow-hidden whitespace-nowrap
    ${currentView === view ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
    ${isCollapsed ? 'justify-center' : ''}
  `;

  return (
    <div className={`h-screen bg-slate-900 border-r border-slate-800 flex flex-col fixed left-0 top-0 z-50 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
      
      {/* HEADER */}
      <div className="h-20 flex items-center justify-between px-4 border-b border-slate-800 relative">
        <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-full justify-center' : 'w-full'}`}>
            <div className="w-10 h-10 bg-primary-600/20 border border-primary-500/30 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
               {branding.logo ? <img src={branding.logo} className="w-full h-full object-cover"/> : <ShieldAlert size={20} className="text-primary-400" />}
            </div>
            
            <div className={`flex flex-col overflow-hidden transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
              <h1 className="text-sm font-bold text-white tracking-tight truncate">{branding.name}</h1>
              <p className="text-[10px] text-slate-500 font-mono">SYSTEM ACTIVE</p>
            </div>
        </div>

        {/* Toggle Button (Desktop) */}
        <button 
            onClick={toggleSidebar} 
            className={`absolute -right-3 top-8 bg-slate-800 text-slate-400 hover:text-white border border-slate-700 rounded-full p-1 shadow-lg transition-transform duration-300 hover:scale-110 z-50 ${isCollapsed ? 'rotate-180' : ''}`}
        >
            <ChevronLeft size={14} />
        </button>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 p-3 overflow-y-auto overflow-x-hidden scrollbar-thin">
        <div onClick={() => onNavigate(ViewState.DASHBOARD)} className={navItemClass(ViewState.DASHBOARD)} title={isCollapsed ? "Dashboard" : ""}>
            <LayoutDashboard size={20} className="flex-shrink-0" /> 
            <span className={`transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>Dashboard</span>
        </div>
        <div onClick={() => onNavigate(ViewState.CANDIDATES)} className={navItemClass(ViewState.CANDIDATES)} title={isCollapsed ? "Candidatos" : ""}>
            <Users size={20} className="flex-shrink-0" /> 
            <span className={`transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>Candidatos</span>
        </div>
        <div onClick={() => onNavigate(ViewState.NETWORK)} className={navItemClass(ViewState.NETWORK)} title={isCollapsed ? "Rede Política" : ""}>
            <Network size={20} className="flex-shrink-0" /> 
            <span className={`transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>Rede Política</span>
        </div>

        {role === UserRole.ADMIN && (
          <>
            <div className={`my-4 border-t border-slate-800 transition-all duration-300 ${isCollapsed ? 'mx-2' : 'mx-4'}`}></div>
            
            <div className={`px-4 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider transition-opacity duration-200 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>
                Administração
            </div>

            <div onClick={() => onNavigate(ViewState.COMMERCE)} className={navItemClass(ViewState.COMMERCE)} title={isCollapsed ? "Commerce & Planos" : ""}>
                <ShoppingBag size={20} className="flex-shrink-0" /> 
                <span className={`transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>Commerce</span>
            </div>
            <div onClick={() => onNavigate(ViewState.USERS)} className={navItemClass(ViewState.USERS)} title={isCollapsed ? "Gestão Usuários" : ""}>
                <UserCog size={20} className="flex-shrink-0" /> 
                <span className={`transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>Usuários</span>
            </div>
            <div onClick={() => onNavigate(ViewState.AI_CORE)} className={navItemClass(ViewState.AI_CORE)} title={isCollapsed ? "Núcleo Neural IA" : ""}>
                <BrainCircuit size={20} className="flex-shrink-0 text-primary-400" /> 
                <span className={`transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>Núcleo Neural</span>
            </div>
          </>
        )}
      </nav>

      {/* FOOTER */}
      <div className="p-3 border-t border-slate-800 bg-slate-900">
        <div onClick={() => onNavigate(ViewState.SETTINGS)} className={navItemClass(ViewState.SETTINGS)} title={isCollapsed ? "Configurações" : ""}>
            <Settings size={20} className="flex-shrink-0" /> 
            <span className={`transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>Configurações</span>
        </div>
        <button onClick={onLogout} className={`w-full mt-2 flex items-center gap-3 px-3 py-3 rounded-lg text-red-400 hover:bg-red-950/30 transition-all whitespace-nowrap overflow-hidden ${isCollapsed ? 'justify-center' : ''}`} title={isCollapsed ? "Sair" : ""}>
          <LogOut size={20} className="flex-shrink-0" /> 
          <span className={`transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>Encerrar Sessão</span>
        </button>
      </div>
    </div>
  );
};
