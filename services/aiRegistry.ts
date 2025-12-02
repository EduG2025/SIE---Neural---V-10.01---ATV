
import { AIProvider, ActiveKeyResponse } from "../types";

const API_BASE = '/api';

/**
 * AI Registry Service
 * Gerencia a obtenção de chaves ativas do backend, reporta erros e lida com fallback.
 */
export const aiRegistry = {
  
  /**
   * Obtém a melhor chave disponível para o provedor solicitado (ou fallback).
   * OBSOLETO: Use getPrioritizedKeys para lógica de fallback completa no client.
   */
  getActiveKey: async (provider: AIProvider = AIProvider.GEMINI): Promise<ActiveKeyResponse> => {
    try {
      const response = await fetch(`${API_BASE}/keys/rotate?provider=${provider}`);
      if (!response.ok) {
         throw new Error('Nenhuma chave disponível');
      }
      return await response.json();
    } catch (error) {
      console.error("[AI_REGISTRY] Falha ao obter chave:", error);
      throw error;
    }
  },

  /**
   * Obtém lista de todas as chaves ativas ordenadas por prioridade (1 = Alta).
   * Usado para o loop de Fallback.
   */
  getPrioritizedKeys: async (): Promise<ActiveKeyResponse[]> => {
      try {
          // Busca todas as chaves ativas
          const res = await fetch(`${API_BASE}/keys?active_only=true`);
          if (!res.ok) throw new Error("Falha ao buscar chaves");
          const keys: any[] = await res.json();
          
          // Mapeia para formato ActiveKeyResponse e Ordena por prioridade (ASC: 1 é maior prioridade que 5)
          return keys
            .map(k => ({ key: k.key_value, provider: k.provider, id: k.id, priority: k.priority }))
            .sort((a, b) => a.priority - b.priority);
      } catch (e) {
          console.error("Erro ao buscar chaves prioritárias:", e);
          return [];
      }
  },

  /**
   * Reporta que uma chave falhou para que o backend penalize/desative.
   */
  reportError: async (keyId: number) => {
    try {
      await fetch(`${API_BASE}/keys/${keyId}/report_error`, { method: 'POST' });
    } catch (e) {
      console.error("Falha ao reportar erro de chave", e);
    }
  },

  /**
   * Lista todas as chaves (para o painel de administração).
   */
  listKeys: async () => {
    const res = await fetch(`${API_BASE}/keys`);
    return await res.json();
  },

  /**
   * Adiciona uma nova chave.
   */
  addKey: async (data: any) => {
    const res = await fetch(`${API_BASE}/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return await res.json();
  },

  /**
   * Atualiza uma chave existente.
   */
  updateKey: async (id: number, data: any) => {
    const res = await fetch(`${API_BASE}/keys/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return await res.json();
  },

  /**
   * Remove uma chave.
   */
  deleteKey: async (id: number) => {
    const res = await fetch(`${API_BASE}/keys/${id}`, { method: 'DELETE' });
    return await res.json();
  },

  /**
   * Teste simples de latência/validade.
   */
  testKeyConnection: async (provider: AIProvider, key: string): Promise<{valid: boolean, latency: number}> => {
     const start = Date.now();
     // Em produção, faria uma chamada leve à API real (ex: list models)
     await new Promise(r => setTimeout(r, 500)); // Simula network
     const valid = key.length > 5;
     return { valid, latency: Date.now() - start };
  }
};