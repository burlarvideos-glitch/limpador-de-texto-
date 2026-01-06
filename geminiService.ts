
import { GoogleGenAI } from "@google/genai";

export const smartCleanText = async (text: string, instructions: string, manualApiKey?: string): Promise<string> => {
  // Prioriza a chave manual salva no localStorage, depois a variável de ambiente
  const apiKey = manualApiKey || process.env.API_KEY || '';
  
  if (!apiKey) {
    throw new Error("Chave API não configurada. Por favor, insira sua chave no painel lateral.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Texto: "${text}"\n\nTarefa: ${instructions}\n\nRetorne apenas o texto limpo, sem comentários ou explicações adicionais.`,
      config: {
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
      }
    });
    
    return response.text?.trim() || text;
  } catch (error: any) {
    console.error("Erro no Gemini:", error);
    if (error.status === 401 || error.status === 403) {
      throw new Error("Chave API inválida ou sem permissão. Verifique sua chave do Google AI Studio.");
    }
    throw new Error("Falha ao processar texto com IA. Verifique sua conexão ou a validade da chave.");
  }
};
