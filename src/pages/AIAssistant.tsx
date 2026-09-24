import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  User,
  Sparkles,
  RotateCw,
  Cpu,
  Layers,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardData } from '../types';

interface AIAssistantProps {
  data: DashboardData | null;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ data }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text:
        'Hello! I am **ToolGuard Copilot**, your CNC manufacturing and predictive maintenance engineering AI.\n\n' +
        'I am grounded in your machine telemetry, the active XGBoost regression model, and Tree SHAP contributions. ' +
        'Ask me any technical question about cutting tool degradation, vibration signatures, or maintenance advisories.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const latest = data?.latestPrediction || {
    wear: 0.174,
    risk: 'MEDIUM',
    health: 'Moderate Wear',
  };

  const handleSend = async (userPrompt?: string) => {
    const text = userPrompt || input;
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const reply = await api.askCopilot(text, {
        toolId: data?.currentTool || 'Tool_T01',
        predictedWear: latest.wear,
        riskLevel: latest.risk,
        toolHealth: latest.health,
        sensorValues: {
          cuttingForce: 195.5,
          vibration: 0.245,
          acousticEmission: 0.068,
        },
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Error communicating with Copilot: ' + (err.message || 'Network error'),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sampleChips = [
    'Why is this tool showing moderate/high wear?',
    'Which sensor is contributing most to the prediction?',
    'Explain the latest prediction for Tool T01.',
    'What maintenance action should be considered?',
    'What does SHAP mean in CNC manufacturing?',
    'Explain the difference between crater wear and flank wear.',
  ];

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-8.5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 shrink-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white flex items-center space-x-3">
            <Bot className="w-8 h-8 text-cyan-400" />
            <span>ToolGuard Copilot</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Grounded industrial engineering diagnostic assistant powered by Google Gemini 3.8 Flash.
          </p>
        </div>

        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono">
          <Sparkles className="w-4 h-4" />
          <span>Gemini Intelligence Active</span>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="flex-1 min-h-0 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between overflow-hidden">
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-slate-800">
          {messages.map((m, idx) => {
            const isBot = m.role === 'assistant';
            return (
              <div
                key={idx}
                className={`flex items-start space-x-3 ${isBot ? '' : 'flex-row-reverse space-x-reverse'}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isBot
                      ? 'bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-2xl p-4 rounded-2xl text-xs leading-relaxed space-y-1 ${
                    isBot
                      ? 'bg-slate-950 border border-slate-800 text-slate-200'
                      : 'bg-cyan-500 text-slate-950 font-semibold'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono opacity-60 mb-1">
                    <span>{isBot ? 'ToolGuard Copilot' : 'Machining Engineer'}</span>
                    <span>{m.timestamp}</span>
                  </div>
                  <div className="whitespace-pre-line font-sans">{m.text}</div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center space-x-2">
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing telemetry data & generating response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompt Chips */}
        <div className="pt-3 border-t border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {sampleChips.map((chip, i) => (
              <button
                key={i}
                onClick={() => handleSend(chip)}
                className="px-3 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] whitespace-nowrap cursor-pointer transition-all hover:border-cyan-500/40"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask ToolGuard Copilot about tool wear, sensor dynamics, or SHAP..."
              disabled={loading}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all cursor-pointer disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
