
import React, { useState, useCallback } from 'react';
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

  const handleClean = useCallback(() => {
    if (!inputText) return;

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
        alert("Expressão Regular Inválida");
        return;
      }
    }

    setResultText(cleaned);
    
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      original: inputText,
      cleaned: cleaned,
      timestamp: Date.now(),
      removedChars: charsToRemove || 'Nenhum'
    };
    setHistory(prev => [newItem, ...prev].slice(0, 5));
  }, [inputText, charsToRemove, mode]);

  const handleAiClean = async () => {
    if (!inputText || !aiInstructions) return;
    setIsAiLoading(true);
    try {
      const cleaned = await smartCleanText(inputText, aiInstructions);
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
      alert(error instanceof Error ? error.message : "Limpeza com IA falhou");
    } finally {
      setIsAiLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const clearAll = () => {
    setInputText('');
    setCharsToRemove('');
    setResultText('');
    setAiInstructions('');
  };

  const getModeLabel = (m: CleanMode) => {
    switch(m) {
      case CleanMode.INDIVIDUAL_CHARS: return 'Caracteres Individuais';
      case CleanMode.LITERAL_STRING: return 'Texto Literal';
      case CleanMode.REGEX: return 'Regex';
      default: return m;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <Header />
      
      <main className="max-w-5xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controles de Entrada */}
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h2 className="font-semibold text-slate-700">Texto de Origem</h2>
              <button 
                onClick={clearAll}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-wider"
              >
                Limpar Tudo
              </button>
            </div>
            <textarea
              className="w-full h-48 p-6 text-slate-700 bg-white focus:outline-none resize-none text-lg leading-relaxed"
              placeholder="Cole seu texto aqui..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ferramentas de Remoção Padrão */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <h3 className="font-semibold text-slate-800 flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>Remoção Rápida</span>
              </h3>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Caracteres/Textos para remover</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  placeholder="ex: x, abc, @#$"
                  value={charsToRemove}
                  onChange={(e) => setCharsToRemove(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {Object.values(CleanMode).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all border ${
                      mode === m 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {getModeLabel(m)}
                  </button>
                ))}
              </div>

              <button
                onClick={handleClean}
                disabled={!inputText}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl transition-all shadow-lg active:scale-[0.98]"
              >
                Executar Remoção
              </button>
            </div>

            {/* Assistente de IA */}
            <div className="bg-indigo-50 p-6 rounded-2xl shadow-sm border border-indigo-100 space-y-4">
              <h3 className="font-semibold text-indigo-900 flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <span>Limpeza Inteligente com IA</span>
              </h3>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-indigo-400 uppercase">Instrução para a IA</label>
                <textarea
                  className="w-full px-4 py-2 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all resize-none text-sm"
                  rows={2}
                  placeholder="ex: Remova todos os emojis e espaços duplos..."
                  value={aiInstructions}
                  onChange={(e) => setAiInstructions(e.target.value)}
                />
              </div>

              <button
                onClick={handleAiClean}
                disabled={!inputText || !aiInstructions || isAiLoading}
                className="w-full py-3 bg-indigo-900 hover:bg-indigo-950 disabled:bg-slate-300 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center space-x-2"
              >
                {isAiLoading ? (
                  <span className="animate-pulse">Processando...</span>
                ) : (
                  <span>Aplicar Limpeza com IA</span>
                )}
              </button>
            </div>
          </div>

          {/* Resultado */}
          {resultText && (
            <div className="bg-white rounded-2xl shadow-lg border-2 border-indigo-500 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
              <div className="px-6 py-4 bg-indigo-500 text-white flex justify-between items-center">
                <h2 className="font-semibold">Texto Resultante</h2>
                <button 
                  onClick={() => copyToClipboard(resultText)}
                  className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-xs font-bold transition-colors"
                >
                  Copiar para Área de Transferência
                </button>
              </div>
              <div className="p-6 text-slate-700 text-lg leading-relaxed whitespace-pre-wrap min-h-[10rem]">
                {resultText}
              </div>
            </div>
          )}
        </section>

        {/* Barra Lateral / Histórico */}
        <aside className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span>Atividade Recente</span>
            </h3>
            
            <div className="space-y-4">
              {history.length === 0 ? (
                <p className="text-sm text-slate-400 italic">Nenhum histórico de limpeza ainda.</p>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 group relative">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </p>
                    <p className="text-xs text-slate-600 line-clamp-2 italic">"{item.cleaned.substring(0, 50)}..."</p>
                    <div className="mt-2 flex items-center justify-between">
                       <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded font-bold">
                        Removido: {item.removedChars}
                       </span>
                       <button 
                        onClick={() => setResultText(item.cleaned)}
                        className="text-[10px] text-indigo-600 hover:underline font-bold"
                       >
                        Restaurar
                       </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-xl text-white">
            <h4 className="font-bold mb-2">Dicas Pro</h4>
            <ul className="text-xs space-y-3 text-slate-300 list-disc pl-4">
              <li>Use o modo <b>Caracteres Individuais</b> para remover várias letras de uma vez.</li>
              <li><b>Texto Literal</b> é melhor para remover palavras ou frases específicas.</li>
              <li>Tente o <b>Assistente de IA</b> para tarefas complexas como "remover todos os números mas manter decimais".</li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default App;
