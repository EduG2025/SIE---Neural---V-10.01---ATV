
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Mail, CheckCircle, XCircle, Save, X } from 'lucide-react';
import { User, UserRole } from '../types';
import { dataService } from '../services/dataService';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: UserRole.USER, plan: 'BASIC', status: 'ACTIVE' });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
      setLoading(true);
      try {
          const data = await dataService.getUsers();
          setUsers(data);
      } catch(e) { console.error(e); } 
      finally { setLoading(false); }
  };

  const handleOpenModal = (user?: User) => {
      if (user) {
          setEditingUser(user);
          setFormData({ 
              name: user.name, 
              email: user.email, 
              password: '', 
              role: user.role, 
              plan: user.plan, 
              status: user.status 
            });
      } else {
          setEditingUser(null);
          setFormData({ name: '', email: '', password: '', role: UserRole.USER, plan: 'BASIC', status: 'ACTIVE' });
      }
      setIsModalOpen(true);
  };

  const handleSave = async () => {
      try {
          if (editingUser && editingUser.id) {
              await dataService.updateUser(editingUser.id, formData);
          } else {
              await dataService.createUser(formData);
          }
          setIsModalOpen(false);
          loadUsers();
      } catch (e) {
          alert('Erro ao salvar usuário.');
      }
  };

  const handleDelete = async (id: string) => {
      if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
      try {
          await dataService.deleteUser(id);
          loadUsers();
      } catch (e) {
          alert('Erro ao excluir.');
      }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 h-screen flex flex-col relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-white">Gestão de Usuários (Real DB)</h2>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} /> Novo Usuário
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col flex-1 shadow-xl">
        <div className="p-4 border-b border-slate-800">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou email..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-auto flex-1">
          {loading ? <div className="p-4 text-white">Carregando usuários...</div> : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 text-slate-400 text-xs uppercase font-semibold">
                <th className="p-4 border-b border-slate-800">Usuário</th>
                <th className="p-4 border-b border-slate-800">Role & Plano</th>
                <th className="p-4 border-b border-slate-800">Status</th>
                <th className="p-4 border-b border-slate-800">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={user.avatar || 'https://i.pravatar.cc/150'} alt={user.name} className="w-10 h-10 rounded-full border border-slate-700" />
                      <div>
                        <div className="font-medium text-white">{user.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <Mail size={10} /> {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded w-fit font-bold ${
                        user.role === UserRole.ADMIN ? 'bg-purple-900/30 text-purple-400' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {user.role}
                      </span>
                      <span className="text-xs text-slate-500">{user.plan}</span>
                    </div>
                  </td>
                  <td className="p-4">
                     <span className={`text-sm ${user.status === 'ACTIVE' ? 'text-green-400' : 'text-slate-400'}`}>{user.status}</span>
                  </td>
                  <td className="p-4 flex gap-2">
                      <button onClick={() => handleOpenModal(user)} className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white"><Edit2 size={16}/></button>
                      <button onClick={() => handleDelete(user.id)} className="p-2 hover:bg-red-900/30 rounded text-slate-400 hover:text-red-400"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {/* Modal Criar/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl animate-fade-in">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X size={24}/></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nome Completo</label>
                        <input type="text" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email</label>
                        <input type="email" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    {!editingUser && (
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Senha Inicial</label>
                            <input type="password" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Permissão (Role)</label>
                            <select className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})}>
                                <option value="USER">USER</option>
                                <option value="ADMIN">ADMIN</option>
                                <option value="GUEST">GUEST</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Plano</label>
                            <select className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" value={formData.plan} onChange={e => setFormData({...formData, plan: e.target.value as any})}>
                                <option value="BASIC">BASIC</option>
                                <option value="PRO">PRO</option>
                                <option value="ENTERPRISE">ENTERPRISE</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Status</label>
                        <select className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                            <option value="ACTIVE">Ativo</option>
                            <option value="INACTIVE">Inativo</option>
                            <option value="PENDING">Pendente</option>
                        </select>
                    </div>
                </div>
                <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
                    <button onClick={handleSave} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded flex items-center gap-2 font-bold">
                        <Save size={18}/> Salvar
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
