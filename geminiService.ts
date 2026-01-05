
import { GoogleGenAI } from "@google/genai";

export const smartCleanText = async (text: string, instructions: string): Promise<string> => {
  // Criar instância aqui para garantir que pegue o process.env.API_KEY atualizado
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
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
    if (error.message?.includes("Requested entity was not found")) {
      // Caso a chave seja inválida ou o projeto não exista
      (window as any).aistudio?.openSelectKey();
      throw new Error("Erro de autenticação. Por favor, selecione uma API Key válida.");
    }
    throw new Error("Falha ao processar texto com IA. Verifique sua conexão ou API Key.");
  }
};
