
import React, { useState, useEffect } from 'react';
import { CreditCard, ShoppingBag, Plus, Trash2, CheckCircle, Clock, DollarSign, List, Shield, XCircle, Search, User } from 'lucide-react';
import { dataService } from '../services/dataService';
import { Plan, Payment, User as UserType } from '../types';

export const CommerceManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'PLANS' | 'PAYMENTS'>('PLANS');
    const [plans, setPlans] = useState<Plan[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);

    // Data for selectors
    const [availableModules, setAvailableModules] = useState<{id: string, name: string}[]>([]);
    const [users, setUsers] = useState<UserType[]>([]);

    // Form State for Plans
    const [showPlanForm, setShowPlanForm] = useState(false);
    const [newPlan, setNewPlan] = useState({
        name: '', price: 0, duration_days: 30, trial_days: 0, features: [] as string[]
    });
    
    // Form State for Payment
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [newPayment, setNewPayment] = useState({
        user_id: 0, plan_id: 0, amount: 0, method: 'MANUAL', transaction_id: ''
    });

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'PLANS') {
                setPlans(await dataService.getPlans());
                // Fetch modules for the checklist
                const modulesRes = await fetch('/api/modules/list');
                setAvailableModules(await modulesRes.json());
            } else {
                setPayments(await dataService.getPayments());
                setPlans(await dataService.getPlans());
                setUsers(await dataService.getUsers());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // --- PLANS LOGIC ---
    const toggleFeature = (featureId: string) => {
        if (newPlan.features.includes(featureId)) {
            setNewPlan({...newPlan, features: newPlan.features.filter(f => f !== featureId)});
        } else {
            setNewPlan({...newPlan, features: [...newPlan.features, featureId]});
        }
    };

    const handleCreatePlan = async () => {
        await dataService.createPlan(newPlan);
        setShowPlanForm(false);
        setNewPlan({ name: '', price: 0, duration_days: 30, trial_days: 0, features: [] });
        loadData();
    };

    const handleDeletePlan = async (id: number) => {
        if (confirm('Excluir plano?')) {
            await dataService.deletePlan(id);
            loadData();
        }
    };

    // --- PAYMENTS LOGIC ---
    const handleConfirmPayment = async (id: number) => {
        if (confirm('Confirmar recebimento deste pagamento?')) {
            await dataService.confirmPayment(id);
            loadData();
        }
    };

    const handleCreatePayment = async () => {
        if (newPayment.user_id === 0 || newPayment.plan_id === 0) {
            alert("Selecione usuário e plano");
            return;
        }
        await fetch('/api/payments', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(newPayment)
        });
        setShowPaymentForm(false);
        loadData();
    };

    // --- RENDER HELPERS ---
    const getFinancialSummary = () => {
        const total = payments.filter(p => p.status === 'COMPLETED').reduce((acc, p) => acc + parseFloat(String(p.amount)), 0);
        const pending = payments.filter(p => p.status === 'PENDING').reduce((acc, p) => acc + parseFloat(String(p.amount)), 0);
        return { total, pending };
    };

    return (
        <div className="p-8 h-screen flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                        <ShoppingBag className="text-green-500" /> Commerce & Planos
                    </h2>
                    <p className="text-slate-400">Gerencie assinaturas, módulos e financeiro.</p>
                </div>
                {activeTab === 'PAYMENTS' && (
                    <div className="flex gap-4">
                        <div className="bg-slate-900 border border-slate-700 px-4 py-2 rounded">
                            <span className="text-xs text-slate-500 uppercase block">Receita Total</span>
                            <span className="text-green-400 font-bold font-mono">R$ {getFinancialSummary().total.toFixed(2)}</span>
                        </div>
                        <div className="bg-slate-900 border border-slate-700 px-4 py-2 rounded">
                            <span className="text-xs text-slate-500 uppercase block">Pendente</span>
                            <span className="text-yellow-400 font-bold font-mono">R$ {getFinancialSummary().pending.toFixed(2)}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex gap-4 mb-6">
                <button onClick={() => setActiveTab('PLANS')} className={`px-6 py-2 rounded-lg font-bold transition-colors ${activeTab === 'PLANS' ? 'bg-primary-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    Planos & Features
                </button>
                <button onClick={() => setActiveTab('PAYMENTS')} className={`px-6 py-2 rounded-lg font-bold transition-colors ${activeTab === 'PAYMENTS' ? 'bg-primary-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    Financeiro
                </button>
            </div>

            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-6 overflow-y-auto shadow-2xl">
                {activeTab === 'PLANS' && (
                    <>
                        <div className="flex justify-end mb-4">
                            <button onClick={() => setShowPlanForm(!showPlanForm)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold flex items-center gap-2">
                                <Plus size={18} /> Criar Plano Inteligente
                            </button>
                        </div>

                        {showPlanForm && (
                            <div className="bg-slate-800 p-6 rounded-lg mb-6 border border-slate-700 animate-fade-in">
                                <h3 className="text-white font-bold mb-4">Novo Plano de Assinatura</h3>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="text-xs text-slate-400 uppercase">Nome do Plano</label>
                                        <input type="text" className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white mt-1" value={newPlan.name} onChange={e => setNewPlan({...newPlan, name: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 uppercase">Preço (R$)</label>
                                        <input type="number" className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white mt-1" value={newPlan.price} onChange={e => setNewPlan({...newPlan, price: parseFloat(e.target.value)})} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 uppercase">Duração (Dias)</label>
                                        <input type="number" className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white mt-1" value={newPlan.duration_days} onChange={e => setNewPlan({...newPlan, duration_days: parseInt(e.target.value)})} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 uppercase">Trial (Dias)</label>
                                        <input type="number" className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white mt-1" value={newPlan.trial_days} onChange={e => setNewPlan({...newPlan, trial_days: parseInt(e.target.value)})} />
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="text-xs text-slate-400 uppercase font-bold block mb-2">Módulos Inclusos (Features)</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {availableModules.map(mod => (
                                            <div 
                                                key={mod.id} 
                                                onClick={() => toggleFeature(mod.id)}
                                                className={`p-3 rounded border cursor-pointer transition-all flex items-center justify-between ${newPlan.features.includes(mod.id) ? 'bg-primary-900/40 border-primary-500 text-primary-200' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                                            >
                                                <span className="text-sm font-bold">{mod.name}</span>
                                                {newPlan.features.includes(mod.id) && <CheckCircle size={16} className="text-primary-400"/>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                     <button onClick={() => setShowPlanForm(false)} className="text-slate-400 hover:text-white px-4 py-2">Cancelar</button>
                                     <button onClick={handleCreatePlan} className="bg-primary-600 text-white px-6 py-2 rounded font-bold">Salvar Plano</button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {plans.map(plan => (
                                <div key={plan.id} className="bg-slate-950 border border-slate-800 rounded-xl p-6 relative group hover:border-primary-500 transition-colors">
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleDeletePlan(plan.id)} className="text-red-500 hover:text-red-400"><Trash2 size={18}/></button>
                                    </div>
                                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                                    <div className="text-3xl font-bold text-primary-400 my-2">
                                        R$ {plan.price} <span className="text-sm text-slate-500 font-normal">/ {plan.duration_days} dias</span>
                                    </div>
                                    <div className="mb-4">
                                       <div className="text-xs text-slate-500 uppercase mb-1">Módulos Ativos:</div>
                                       <div className="flex flex-wrap gap-1">
                                           {Array.isArray(plan.features_json) && plan.features_json.map((f, i) => (
                                               <span key={i} className="text-[10px] bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-slate-300">
                                                   {f}
                                               </span>
                                           ))}
                                       </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {activeTab === 'PAYMENTS' && (
                    <>
                        <div className="flex justify-end mb-4">
                            <button onClick={() => setShowPaymentForm(!showPaymentForm)} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded font-bold flex items-center gap-2">
                                <Plus size={18} /> Registrar Pagamento Manual
                            </button>
                        </div>

                        {showPaymentForm && (
                            <div className="bg-slate-800 p-6 rounded-lg mb-6 border border-slate-700 animate-fade-in">
                                <h3 className="text-white font-bold mb-4">Registrar Transação</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-400 uppercase">Usuário</label>
                                        <select className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white mt-1" value={newPayment.user_id} onChange={e => setNewPayment({...newPayment, user_id: parseInt(e.target.value)})}>
                                            <option value={0}>Selecione...</option>
                                            {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 uppercase">Plano Adquirido</label>
                                        <select className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white mt-1" value={newPayment.plan_id} onChange={e => {
                                            const pid = parseInt(e.target.value);
                                            const p = plans.find(pl => pl.id === pid);
                                            setNewPayment({...newPayment, plan_id: pid, amount: p ? p.price : 0 });
                                        }}>
                                            <option value={0}>Selecione...</option>
                                            {plans.map(p => <option key={p.id} value={p.id}>{p.name} - R${p.price}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 uppercase">Valor Pago (R$)</label>
                                        <input type="number" className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white mt-1" value={newPayment.amount} onChange={e => setNewPayment({...newPayment, amount: parseFloat(e.target.value)})} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 uppercase">ID Transação / Comprovante</label>
                                        <input type="text" className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white mt-1" value={newPayment.transaction_id} onChange={e => setNewPayment({...newPayment, transaction_id: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 uppercase">Método</label>
                                        <select className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white mt-1" value={newPayment.method} onChange={e => setNewPayment({...newPayment, method: e.target.value})}>
                                            <option value="MANUAL">Manual / Dinheiro</option>
                                            <option value="TRANSFER">Transferência Bancária</option>
                                            <option value="PIX">PIX</option>
                                            <option value="CARD">Cartão de Crédito</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end gap-2">
                                     <button onClick={() => setShowPaymentForm(false)} className="text-slate-400 hover:text-white px-4 py-2">Cancelar</button>
                                     <button onClick={handleCreatePayment} className="bg-green-600 text-white px-6 py-2 rounded font-bold">Registrar</button>
                                </div>
                            </div>
                        )}

                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950 text-slate-400 text-xs uppercase">
                                    <th className="p-4">ID</th>
                                    <th className="p-4">Usuário</th>
                                    <th className="p-4">Valor</th>
                                    <th className="p-4">Ref/Método</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Data</th>
                                    <th className="p-4">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {payments.map(pay => (
                                    <tr key={pay.id} className="text-slate-300 hover:bg-slate-800/30">
                                        <td className="p-4 font-mono text-xs text-slate-500">#{pay.id}</td>
                                        <td className="p-4 font-bold text-white">{pay.user_name || `User #${pay.user_id}`}</td>
                                        <td className="p-4 text-green-400 font-mono">R$ {pay.amount}</td>
                                        <td className="p-4">
                                            <div className="text-xs font-bold">{pay.payment_method}</div>
                                            <div className="text-[10px] text-slate-500 font-mono">{pay.transaction_id || '-'}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                pay.status === 'COMPLETED' ? 'bg-green-900/30 text-green-400' :
                                                pay.status === 'PENDING' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-red-900/30 text-red-400'
                                            }`}>
                                                {pay.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs text-slate-500">{new Date(pay.created_at).toLocaleDateString()}</td>
                                        <td className="p-4">
                                            {pay.status === 'PENDING' && (
                                                <button onClick={() => handleConfirmPayment(pay.id)} className="text-green-500 hover:text-green-400 text-xs border border-green-500/50 px-3 py-1.5 rounded hover:bg-green-900/20 font-bold transition-colors">
                                                    Confirmar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}
            </div>
        </div>
    );
};
