
import { GoogleGenAI } from "@google/genai";
import { AIActionResponse, AIProvider } from "../types";
import { aiRegistry } from "./aiRegistry";

// Configuração do Modelo Base
const MODEL_SMART = 'gemini-2.5-flash';

// System Prompt Expandido (Risk Analysis + Staging)
const SYSTEM_PROMPT = `
Você é o NÚCLEO NEURAL IA do SIE 3xxx rodando na VPS de Produção.
Permissões: ROOT (FS + DB).

### ESTRUTURA DE DESENVOLVIMENTO (Ciclo de Vida):
1. **Novos Módulos:** Devem ser criados em 'src/staging_builds/'.
2. **Módulos Ativos:** Residem em 'src/components/' ou 'src/active_modules/'.
3. **Ativação:** O Admin move de Staging para Active manualmente.

### ANÁLISE DE RISCO (Obrigatória em UPDATES):
Sempre que for solicitado uma alteração de código, analise:
1. **Segurança:** Exposição de credenciais, SQL Injection.
2. **Performance:** Loops infinitos, queries pesadas.
3. **Integridade:** Quebra de dependências.

### FORMATO DE SAÍDA JSON:
{
  "actionType": "CREATE" | "UPDATE" | "DELETE" | "EXPLAIN" | "SHELL" | "SQL_QUERY" | "ANALYZE_RISK",
  "message": "Explicação concisa",
  "files": [ { "path": "src/staging_builds/...", "content": "..." } ],
  "shellCommand": "npm install ...",
  "sqlQuery": "...",
  "riskAnalysis": {
     "securityScore": 90,
     "performanceScore": 85,
     "integrityScore": 100,
     "riskLevel": "LOW",
     "analysis": "Explicação dos riscos..."
  }
}
`;

/**
 * Executa requisição com Lógica de Fallback em Cascata (Chain of Responsibility).
 */
const executeWithFallback = async (promptContent: string): Promise<string> => {
    // 1. Obtém todas as chaves ordenadas por prioridade
    const keys = await aiRegistry.getPrioritizedKeys();
    
    if (keys.length === 0) {
        throw new Error("Nenhuma chave de IA configurada no sistema.");
    }

    let lastError = null;

    // 2. Loop de Tentativa (Waterfall)
    for (const keyConfig of keys) {
        try {
            console.log(`[AI_CORE] Tentando provedor: ${keyConfig.provider} (Prioridade: ${keyConfig.priority})`);
            
            // TODO: Adaptar para outros SDKs (OpenAI/Anthropic) se o provider mudar.
            // Por enquanto, assumimos interface compatível ou apenas Gemini.
            if (keyConfig.provider !== AIProvider.GEMINI) {
                // Mock de suporte a outros provedores para este exemplo
                // Em prod, aqui entraria switch(keyConfig.provider)
                throw new Error("Provedor não implementado no driver atual, pulando..."); 
            }

            const ai = new GoogleGenAI({ apiKey: keyConfig.key });
            const response = await ai.models.generateContent({
                model: MODEL_SMART,
                contents: promptContent,
                config: { responseMimeType: "application/json" }
            });

            return response.text || "{}"; // Sucesso! Retorna imediatamente.

        } catch (error: any) {
            console.warn(`[AI_CORE] Falha com chave ID ${keyConfig.id}:`, error.message);
            await aiRegistry.reportError(keyConfig.id); // Penaliza a chave
            lastError = error;
            // Continua para a próxima chave no loop...
        }
    }

    throw new Error(`Todas as chaves falharam. Último erro: ${lastError?.message}`);
};

export const analyzeCandidateProfile = async (candidateName: string, contextData: string) => {
  try {
    const prompt = `Analise perfil de ${candidateName}. Ctx: ${contextData}. JSON output.`;
    const jsonText = await executeWithFallback(prompt);
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Erro AI Analysis (Fallback esgotado):", error);
    return { score: 0, riskLevel: 'HIGH', analysis: "Falha Geral de IA (Todos provedores indisponíveis)", keyStrengths: [], keyWeaknesses: [] };
  }
};

export const developSystemModule = async (prompt: string, currentContext: string): Promise<AIActionResponse> => {
  try {
    const fullPrompt = `${SYSTEM_PROMPT}
      CONTEXTO TÉCNICO (Arquivo Atual): ${currentContext}
      SOLICITAÇÃO DO ADMIN: "${prompt}"`;
    
    const jsonText = await executeWithFallback(fullPrompt);
    return JSON.parse(jsonText);

  } catch (error) {
    console.error("Erro AI Core (Fallback esgotado):", error);
    return {
      actionType: "EXPLAIN",
      message: `CRITICAL FAILURE: Todos os provedores de IA falharam. Verifique o AI Key Manager.`,
    };
  }
};