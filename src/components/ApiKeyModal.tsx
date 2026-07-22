import React, { useState, useEffect } from "react";
import { Key, Check, Shield, X, Sparkles, Bot } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
}) => {
  const [inputKey, setInputKey] = useState(apiKey);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setInputKey(apiKey);
  }, [apiKey]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveApiKey(inputKey.trim());
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 1000);
  };

  const handleClear = () => {
    setInputKey("");
    onSaveApiKey("");
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-neutral-950 border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-6 text-left">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-xl cursor-pointer transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider font-sans">
              AI & ChatGPT API Key
            </h3>
            <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mt-0.5">
              OpenAI / ChatGPT / Gemini Integration
            </p>
          </div>
        </div>

        {/* Explanation */}
        <p className="text-xs text-zinc-300 leading-relaxed font-medium">
          Enter your <span className="text-emerald-400 font-semibold">ChatGPT (OpenAI)</span> or <span className="text-cyan-400 font-semibold">Gemini</span> API key below. This key will be applied to all AI Assistant and Voice Assistant models across the entire platform.
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold">
              API Key (e.g., sk-... or AIzaSy...)
            </label>
            <div className="relative">
              <input
                type="password"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="sk-proj-... or AIzaSy..."
                className="w-full px-4 py-3 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60 font-mono tracking-wider transition-colors"
              />
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">
              Key is stored locally in your browser and passed to secure server AI proxies.
            </p>
          </div>

          {showSuccess && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-mono flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>API key updated successfully!</span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-neutral-950 font-sans font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Apply Key</span>
            </button>

            {apiKey && (
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white font-sans font-semibold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Clear Key
              </button>
            )}
          </div>
        </form>

        <div className="p-3 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-zinc-400 leading-normal font-sans">
            If no key is provided, the platform automatically falls back to our high-accuracy biological farming expert system or server environment secrets.
          </p>
        </div>

      </div>
    </div>
  );
};
