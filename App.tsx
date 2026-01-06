
import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import { CleanMode, HistoryItem } from './types';
import { smartCleanText } from './geminiService';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [charsToRemove, setCharsToRemove] = useState('');
  const [resultText, setResultText] = useState('');
  const [mode, setMode] = useState<CleanMode>(CleanMode.INDIVIDUAL_CHARS);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInstructions, setAiInstructions] = useState('');
  
  // Estados para Gerenciamento Manual da API Key
  const [manualApiKey, setManualApiKey] = useState('');
  const [isKeySaved, setIsKeySaved] = useState(false);

  // Carrega a chave do localStorage ao iniciar
  useEffect(() => {
    const savedKey = localStorage.getItem('GEMINI_API_KEY');
    if (savedKey && savedKey.length > 5) {
      setManualApiKey(savedKey);
      setIsKeySaved(true);
    }
  }, []);

  const saveApiKey = () => {
    if (!manualApiKey.trim() || manualApiKey.trim().length < 10) {
      alert("Por favor, insira uma chave API válida do Google AI Studio.");
      return;
    }
    localStorage.setItem('GEMINI_API_KEY', manualApiKey.trim());
    setIsKeySaved(true);
    alert("Chave API configurada com sucesso! O aplicativo está liberado.");
  };

  const removeApiKey = () => {
    if (window.confirm("Deseja realmente remover a chave API? O aplicativo será bloqueado novamente.")) {
      localStorage.removeItem('GEMINI_API_KEY');
      setManualApiKey('');
      setIsKeySaved(false);
      setResultText('');
    }
  };

  const handleClean = useCallback(() => {
    if (!isKeySaved || !inputText) return;

    let cleaned = inputText;
    
    if (mode === CleanMode.INDIVIDUAL_CHARS) {
      const charArray = Array.from(charsToRemove);
      charArray.forEach((char: string) => {
        const escaped = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'g');
        cleaned = cleaned.replace(regex, '');
      });
    } else if (mode === CleanMode.LITERAL_STRING) {
      if (charsToRemove) {
        cleaned = cleaned.split(charsToRemove).join('');
      }
    } else if (mode === CleanMode.REGEX) {
      try {
        const regex = new RegExp(charsToRemove, 'g');
        cleaned = cleaned.replace(regex, '');
      } catch (e) {
        alert("Erro: Expressão Regular (Regex) inválida.");
        return;
      }
    }

    setResultText(cleaned);
    
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      original: inputText,
      cleaned: cleaned,
      timestamp: Date.now(),
      removedChars: charsToRemove || 'Limpeza Manual'
    };
    setHistory(prev => [newItem, ...prev].slice(0, 5));
  }, [inputText, charsToRemove, mode, isKeySaved]);

  const handleAiClean = async () => {
    if (!isKeySaved || !inputText || !aiInstructions) return;
    
    const keyToUse = localStorage.getItem('GEMINI_API_KEY') || '';
    setIsAiLoading(true);
    try {
      const cleaned = await smartCleanText(inputText, aiInstructions, keyToUse);
      setResultText(cleaned);
      
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        original: inputText,
        cleaned: cleaned,
        timestamp: Date.now(),
        removedChars: `IA: ${aiInstructions}`
      };
      setHistory(prev => [newItem, ...prev].slice(0, 5));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro desconhecido na limpeza com IA.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getModeLabel = (m: CleanMode) => {
    switch(m) {
      case CleanMode.INDIVIDUAL_CHARS: return 'Letras';
      case CleanMode.LITERAL_STRING: return 'Texto';
      case CleanMode.REGEX: return 'Regex';
      default: return m;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <Header />
      
      <main className="max-w-5xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LADO ESQUERDO: EDITOR E FERRAMENTAS */}
        <section className={`lg:col-span-2 space-y-6 transition-all duration-500 ${!isKeySaved ? 'opacity-40 grayscale pointer-events-none select-none' : 'opacity-100'}`}>
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
            {!isKeySaved && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/10 backdrop-blur-[1px]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="font-bold text-slate-500 text-sm uppercase">Acesso Bloqueado</p>
              </div>
            )}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h2 className="font-semibold text-slate-700 uppercase text-xs tracking-widest">Texto de Origem</h2>
              <button 
                onClick={() => setInputText('')} 
                className="text-xs font-bold text-red-500 hover:text-red-700 uppercase"
              >
                Limpar Campo
              </button>
            </div>
            <textarea
              className="w-full h-48 p-6 text-slate-700 bg-white focus:outline-none resize-none text-lg leading-relaxed"
              placeholder="Insira o texto que deseja limpar aqui..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Remoção Manual */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center space-x-2 text-sm uppercase">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>Limpeza Direta</span>
              </h3>
              <input
                type="text"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="O que remover? Ex: x, y, abc..."
                value={charsToRemove}
                onChange={(e) => setCharsToRemove(e.target.value)}
              />
              <div className="flex gap-2">
                {Object.values(CleanMode).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 py-2 text-[10px] font-bold rounded-lg border uppercase transition-colors ${
                      mode === m ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {getModeLabel(m)}
                  </button>
                ))}
              </div>
              <button
                onClick={handleClean}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all"
              >
                Remover Caracteres
              </button>
            </div>

            {/* Remoção Inteligente */}
            <div className="bg-indigo-50 p-6 rounded-2xl shadow-sm border border-indigo-100 space-y-4">
              <h3 className="font-bold text-indigo-900 flex items-center space-x-2 text-sm uppercase">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <span>Assistente de IA</span>
              </h3>
              <textarea
                className="w-full px-4 py-2 bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:outline-none text-sm resize-none"
                rows={2}
                placeholder="Instrução: 'Remova links', 'Remova números'..."
                value={aiInstructions}
                onChange={(e) => setAiInstructions(e.target.value)}
              />
              <button
                onClick={handleAiClean}
                disabled={isAiLoading}
                className="w-full py-4 bg-indigo-900 hover:bg-indigo-950 text-white font-bold rounded-xl shadow-lg flex justify-center items-center"
              >
                {isAiLoading ? <span className="animate-pulse">Processando...</span> : <span>Limpar com IA</span>}
              </button>
            </div>
          </div>

          {/* Resultado */}
          {resultText && (
            <div className="bg-white rounded-3xl shadow-2xl border-4 border-indigo-600 overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="px-6 py-4 bg-indigo-600 text-white flex justify-between items-center">
                <h2 className="font-bold text-sm uppercase tracking-widest">Texto Processado</h2>
                <button 
                  onClick={() => copyToClipboard(resultText)} 
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copiar Texto
                </button>
              </div>
              <div className="p-8 text-slate-800 text-xl leading-relaxed whitespace-pre-wrap min-h-[12rem] bg-indigo-50/20">
                {resultText}
              </div>
            </div>
          )}
        </section>

        {/* LADO DIREITO: CONFIGURAÇÃO (SEMPRE ATIVO) E HISTÓRICO */}
        <aside className="space-y-6">
          
          {/* PAINEL DE CONFIGURAÇÃO - FUNDAMENTAL */}
          <div className={`bg-white p-6 rounded-2xl shadow-sm border transition-all duration-300 ${!isKeySaved ? 'border-amber-400 ring-4 ring-amber-100' : 'border-slate-200'}`}>
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase">
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${!isKeySaved ? 'text-amber-500' : 'text-slate-400'}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>Acesso à API</span>
            </h3>
            
            <div className="space-y-4">
              {!isKeySaved && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                  <p className="text-[11px] text-amber-700 leading-tight font-medium">
                    ⚠️ <b>Atenção:</b> Você precisa configurar sua chave do <b>Google AI Studio</b> para desbloquear o aplicativo.
                  </p>
                </div>
              )}
              
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sua Chave API</label>
                <input
                  type="password"
                  className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs transition-all"
                  placeholder="Cole sua chave aqui..."
                  value={manualApiKey}
                  onChange={(e) => setManualApiKey(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={saveApiKey}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-xl shadow-sm transition-all active:scale-95"
                >
                  Salvar Chave
                </button>
                {isKeySaved && (
                  <button 
                    onClick={removeApiKey}
                    className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-bold rounded-xl border border-red-100 transition-all"
                  >
                    Excluir
                  </button>
                )}
              </div>
              
              <div className={`text-[10px] text-center p-2 rounded-xl font-bold flex items-center justify-center gap-2 ${isKeySaved ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                <span className={`h-2 w-2 rounded-full ${isKeySaved ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                {isKeySaved ? 'APLICATIVO DESBLOQUEADO' : 'AGUARDANDO CONFIGURAÇÃO'}
              </div>
            </div>
          </div>

          {/* HISTÓRICO - TAMBÉM BLOQUEADO SE SEM CHAVE */}
          <div className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-200 transition-opacity ${!isKeySaved ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
            <h3 className="font-bold text-slate-800 mb-4 flex items-center space-x-2 text-sm uppercase tracking-wider">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span>Atividade</span>
            </h3>
            <div className="space-y-3">
              {history.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic">O histórico aparecerá aqui.</p>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 group transition-all hover:border-indigo-200">
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </p>
                    <p className="text-[11px] text-slate-600 line-clamp-1 italic">"{item.cleaned.substring(0, 35)}..."</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[8px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter truncate max-w-[80px]">
                        {item.removedChars}
                      </span>
                      <button 
                        onClick={() => setResultText(item.cleaned)} 
                        className="text-[9px] text-indigo-600 font-bold hover:underline"
                      >
                        Restaurar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default App;
