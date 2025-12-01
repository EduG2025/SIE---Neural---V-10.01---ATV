
import { FileNode, TerminalResponse } from "../types";

const API_BASE = '/api';

export const fileService = {
  // Listar arquivos de um diretório
  listFiles: async (path: string = ''): Promise<FileNode[]> => {
    try {
      // Encode URI para lidar com caracteres especiais se houver
      const response = await fetch(`${API_BASE}/fs/list?path=${encodeURIComponent(path)}`);
      
      if (!response.ok) {
        // Tenta ler o corpo da resposta de erro (pode ser JSON ou texto)
        const errorText = await response.text();
        let errorMessage = `Erro ${response.status}: ${response.statusText}`;
        try {
            const errorJson = JSON.parse(errorText);
            if(errorJson.error) errorMessage = errorJson.error;
        } catch(e) {
            if(errorText) errorMessage = errorText;
        }
        throw new Error(errorMessage);
      }
      return await response.json();
    } catch (error: any) {
      console.error('Erro FS (listFiles):', error);
      throw new Error(error.message || 'Erro desconhecido ao listar arquivos');
    }
  },

  // Ler conteúdo de um arquivo
  readFile: async (path: string): Promise<string> => {
    try {
      const response = await fetch(`${API_BASE}/fs/read?path=${encodeURIComponent(path)}`);
      if (!response.ok) throw new Error('Falha ao ler arquivo');
      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Erro FS:', error);
      return '';
    }
  },

  // Salvar arquivo (Real disk write)
  saveFile: async (path: string, content: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/fs/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, content })
      });
      if (!response.ok) throw new Error('Falha ao salvar arquivo');
      return true;
    } catch (error) {
      console.error('Erro FS:', error);
      return false;
    }
  },

  // Executar comando no terminal do servidor
  executeCommand: async (command: string): Promise<TerminalResponse> => {
    try {
      const response = await fetch(`${API_BASE}/terminal/exec`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });
      return await response.json();
    } catch (error) {
      return { output: '', error: 'Erro de conexão com terminal', exitCode: 1 };
    }
  },

  // Helper para detectar módulos funcionais (pastas em components)
  listModules: async (): Promise<FileNode[]> => {
    try {
       const components = await fileService.listFiles('src/components');
       // Assume que cada arquivo .tsx na raiz de components é um módulo, ou subpastas
       return components.filter(f => f.name.endsWith('.tsx') && f.name !== 'index.tsx');
    } catch(e) {
       console.warn("Falha ao listar módulos", e);
       return [];
    }
  }
};
