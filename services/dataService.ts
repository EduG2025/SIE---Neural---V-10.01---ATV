
import { Candidate, User, BrandingConfig, Plan, Payment } from "../types";

const API_BASE = '/api';

const handleResponse = async (res: Response, errorMessage: string) => {
    const contentType = res.headers.get("content-type");
    
    if (!res.ok) {
        let finalError = errorMessage;
        if (contentType && contentType.includes("application/json")) {
            try {
                const json = await res.json();
                if (json.error) finalError = json.error;
            } catch(e) {}
        } else {
            // If it's HTML or text (e.g. 404 or 500 HTML page), don't parse as JSON
            finalError = `${errorMessage} (Status: ${res.status})`;
        }
        throw new Error(finalError);
    }

    if (contentType && contentType.includes("application/json")) {
        return res.json();
    }
    
    // Return null or text if successful but not JSON (rare for this API but safe)
    return null;
};

export const dataService = {
    getDashboardStats: async () => {
        const res = await fetch(`${API_BASE}/dashboard/stats`);
        return handleResponse(res, 'Falha ao carregar estatísticas');
    },

    getUsers: async (): Promise<User[]> => {
        const res = await fetch(`${API_BASE}/users`);
        return handleResponse(res, 'Falha ao carregar usuários');
    },

    createUser: async (userData: any) => {
        const res = await fetch(`${API_BASE}/users`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(userData)
        });
        return handleResponse(res, 'Erro ao criar usuário');
    },

    updateUser: async (id: string, userData: any) => {
        const res = await fetch(`${API_BASE}/users/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(userData)
        });
        return handleResponse(res, 'Erro ao atualizar usuário');
    },

    deleteUser: async (id: string) => {
        const res = await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
        return handleResponse(res, 'Erro ao excluir usuário');
    },

    getCandidates: async (): Promise<Candidate[]> => {
        const res = await fetch(`${API_BASE}/candidates`);
        return handleResponse(res, 'Falha ao carregar candidatos');
    },

    createCandidate: async (data: any) => {
        const res = await fetch(`${API_BASE}/candidates`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        return handleResponse(res, 'Erro ao criar candidato');
    },

    deleteCandidate: async (id: string) => {
        const res = await fetch(`${API_BASE}/candidates/${id}`, { method: 'DELETE' });
        return handleResponse(res, 'Erro ao excluir candidato');
    },

    getPoliticalNetwork: async () => {
        const res = await fetch(`${API_BASE}/network`);
        if (!res.ok) return [];
        return res.json();
    },

    getConfigs: async () => {
        const res = await fetch(`${API_BASE}/configs`);
        return handleResponse(res, 'Falha ao carregar configurações');
    },

    updateConfig: async (key: string, value: string) => {
        const res = await fetch(`${API_BASE}/configs/${key}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ value })
        });
        return handleResponse(res, 'Erro ao atualizar configuração');
    },

    // --- COMMERCE: PLANS ---
    getPlans: async (): Promise<Plan[]> => {
        const res = await fetch(`${API_BASE}/plans`);
        return handleResponse(res, 'Falha ao carregar planos');
    },

    createPlan: async (planData: any) => {
        const res = await fetch(`${API_BASE}/plans`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(planData)
        });
        return handleResponse(res, 'Erro ao criar plano');
    },

    deletePlan: async (id: number) => {
        const res = await fetch(`${API_BASE}/plans/${id}`, { method: 'DELETE' });
        return handleResponse(res, 'Erro ao excluir plano');
    },

    // --- COMMERCE: PAYMENTS ---
    getPayments: async (): Promise<Payment[]> => {
        const res = await fetch(`${API_BASE}/payments`);
        return handleResponse(res, 'Falha ao carregar pagamentos');
    },

    confirmPayment: async (id: number) => {
        const res = await fetch(`${API_BASE}/payments/${id}/confirm`, { method: 'PUT' });
        return handleResponse(res, 'Erro ao confirmar pagamento');
    },

    // --- BRANDING ---
    uploadLogo: async (file: File) => {
        const formData = new FormData();
        formData.append('logo', file);
        const res = await fetch(`${API_BASE}/upload/logo`, {
            method: 'POST',
            body: formData
        });
        return handleResponse(res, 'Erro ao enviar logo');
    },
    
    getBranding: async (): Promise<BrandingConfig> => {
        try {
            // Em vez de getConfigs (que pode ser bloqueado), usar o public endpoint
            const res = await fetch(`${API_BASE}/auth/settings`);
            if (!res.ok) throw new Error('Falha settings');
            return await res.json();
        } catch(e) {
            return { systemName: 'SIE 3xxx', logoUrl: '' };
        }
    },

    // --- PUBLIC AUTH ---
    getAuthSettings: async () => {
        const res = await fetch(`${API_BASE}/auth/settings`);
        return handleResponse(res, 'Erro config');
    },

    registerUser: async (data: any) => {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        return handleResponse(res, 'Falha no registro');
    }
};
