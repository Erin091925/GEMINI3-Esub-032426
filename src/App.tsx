/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Activity, 
  LayoutDashboard, 
  FileText, 
  Settings, 
  Sun, 
  Moon, 
  Globe, 
  Trash2, 
  Download, 
  Save, 
  ChevronRight, 
  Terminal,
  AlertCircle,
  CheckCircle2,
  Search,
  BookOpen,
  Shuffle,
  FileCheck,
  Square,
  RotateCcw,
  History,
  Key,
  Cpu,
  MessageSquare,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { GoogleGenAI } from "@google/genai";
import { PANTONE_PALETTES, TRANSLATIONS, DEFAULT_PROMPTS, MODEL_OPTIONS } from './constants';
import { PantoneStyle, Language, PipelineStep, LogEntry, PipelineState, AppSettings, HistoryEntry } from './types';

// --- Components ---

const InteractiveIndicator = ({ step, currentStep, label }: { step: PipelineStep, currentStep: PipelineStep, label: string }) => {
  const isActive = currentStep === step;
  const isCompleted = currentStep > step;

  return (
    <div className="flex flex-col items-center gap-2 relative">
      <motion.div 
        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors duration-500 ${
          isActive ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]' : 
          isCompleted ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-[var(--border)] text-[var(--text-muted)]'
        }`}
        animate={isActive ? { scale: [1, 1.1, 1], boxShadow: "0 0 20px var(--accent)" } : { scale: 1 }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        {isCompleted ? <CheckCircle2 size={24} /> : <span>{step}</span>}
      </motion.div>
      <span className={`text-xs font-medium ${isActive ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>
        {label}
      </span>
      {step < 4 && (
        <div className="absolute left-[calc(100%+0.5rem)] top-6 w-12 h-[2px] bg-[var(--border)]">
          <motion.div 
            className="h-full bg-[var(--accent)]"
            initial={{ width: 0 }}
            animate={{ width: isCompleted ? '100%' : '0%' }}
          />
        </div>
      )}
    </div>
  );
};

const Dashboard = ({ riskData, tokenData, t, history, onRollback }: { riskData: any[], tokenData: any[], t: any, history: HistoryEntry[], onRollback: (entry: HistoryEntry) => void }) => {
  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="nordic-card p-4 h-64">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Activity size={16} className="text-[var(--accent)]" />
            {t.riskRadar}
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={riskData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
              <Radar
                name="Risk"
                dataKey="A"
                stroke="var(--accent)"
                fill="var(--accent)"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="nordic-card p-4 h-64">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <LayoutDashboard size={16} className="text-[var(--accent)]" />
            {t.tokenEfficiency}
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={tokenData}>
              <defs>
                <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" hide />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
              <Area type="monotone" dataKey="tokens" stroke="var(--accent)" fillOpacity={1} fill="url(#colorTokens)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Timeline / DAG */}
      <div className="nordic-card p-4 flex-1 min-h-[200px]">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <History size={16} className="text-[var(--accent)]" />
          {t.timeline}
        </h3>
        <div className="space-y-3">
          {history.length === 0 && <p className="text-xs text-[var(--text-muted)] italic">No history yet.</p>}
          {history.map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 rounded bg-[var(--bg)] border border-[var(--border)] group">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono opacity-50">{entry.timestamp}</span>
                <span className="text-xs font-medium">{entry.label}</span>
              </div>
              <button 
                onClick={() => onRollback(entry)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] rounded transition-all"
                title={t.rollback}
              >
                <RotateCcw size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const LogViewer = ({ logs, t }: { logs: LogEntry[], t: any }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="nordic-card bg-[#000] text-[#00FF00] font-mono text-[10px] p-4 h-48 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-2 border-b border-[#00FF00]/20 pb-1">
        <span className="flex items-center gap-2">
          <Terminal size={12} />
          {t.logs}
        </span>
        <span className="opacity-50">v3.0.1-LIVE</span>
      </div>
      <div ref={scrollRef} className="overflow-y-auto flex-1 scrollbar-hide">
        {logs.map((log) => (
          <div key={log.id} className="mb-1 flex gap-2">
            <span className="opacity-40">[{log.timestamp}]</span>
            <span className={
              log.type === 'error' ? 'text-red-500' : 
              log.type === 'warning' ? 'text-yellow-500' : 
              log.type === 'success' ? 'text-blue-400' : 
              log.type === 'system' ? 'text-purple-400' : ''
            }>
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [theme, setTheme] = useState<PantoneStyle>('ClassicBlue');
  const [isDark, setIsDark] = useState(false);
  const [lang, setLang] = useState<Language>('EN');
  const [pipeline, setPipeline] = useState<PipelineState>({
    step1: '',
    step2: '',
    step3: '',
    step4: '',
    currentStep: 1,
  });
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // LLM Settings
  const [settings, setSettings] = useState<AppSettings>({
    apiKey: process.env.GEMINI_API_KEY || '',
    features: {
      step1: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.step1 },
      step2: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.step2 },
      step3: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.step3 },
      step4: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.step4 },
      ocr: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.ocr },
      wow: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.wow },
    }
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const t = TRANSLATIONS[lang];

  // --- Theme Injection ---
  useEffect(() => {
    const root = document.documentElement;
    const palette = PANTONE_PALETTES[theme];
    root.style.setProperty('--accent', palette.accent);
    root.style.setProperty('--accent-foreground', palette.foreground);
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme, isDark]);

  // --- Logging Helper ---
  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
      message,
      type,
    };
    setLogs(prev => [...prev, newLog].slice(-50));
  };

  useEffect(() => {
    addLog('System Initialized: Nordic WOW Pantone Edition v3.0.1', 'system');
  }, []);

  // --- Mock Data for Charts ---
  const riskData = [
    { subject: 'Clinical', A: 85, fullMark: 100 },
    { subject: 'Technical', A: 65, fullMark: 100 },
    { subject: 'Regulatory', A: 90, fullMark: 100 },
    { subject: 'Safety', A: 75, fullMark: 100 },
    { subject: 'Labeling', A: 40, fullMark: 100 },
  ];

  const tokenData = [
    { name: '1', tokens: 400 },
    { name: '2', tokens: 1200 },
    { name: '3', tokens: 800 },
    { name: '4', tokens: 2400 },
    { name: '5', tokens: 1800 },
    { name: '6', tokens: 3200 },
    { name: '7', tokens: 2100 },
  ];

  // --- Pipeline Actions ---
  const generateArtifact = async () => {
    setIsGenerating(true);
    addLog(`Initiating Generation for Step ${pipeline.currentStep}...`, 'info');
    
    abortControllerRef.current = new AbortController();

    try {
      const featureKey = `step${pipeline.currentStep}` as keyof AppSettings['features'];
      const config = settings.features[featureKey];
      
      const ai = new GoogleGenAI({ apiKey: settings.apiKey });
      
      // Note: @google/genai doesn't natively support AbortController in generateContent yet, 
      // but we can simulate the "Stop" by ignoring the result if aborted.
      const response = await ai.models.generateContent({
        model: config.model,
        contents: config.prompt,
      });

      if (abortControllerRef.current?.signal.aborted) {
        addLog('Generation stopped by user.', 'warning');
        return;
      }

      const text = response.text || "Failed to generate content.";
      
      // Save to history before updating
      const newHistoryEntry: HistoryEntry = {
        timestamp: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
        state: { ...pipeline },
        label: `Step ${pipeline.currentStep} Generated`
      };
      setHistory(prev => [newHistoryEntry, ...prev].slice(0, 10));

      setPipeline(prev => ({
        ...prev,
        [`step${pipeline.currentStep}`]: text
      }));
      
      addLog(`Step ${pipeline.currentStep} Artifact Generated Successfully.`, 'success');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        addLog('Generation aborted.', 'warning');
      } else {
        addLog(`Generation Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      addLog('Stopping generation...', 'warning');
    }
  };

  const handlePurge = () => {
    setPipeline({
      step1: '',
      step2: '',
      step3: '',
      step4: '',
      currentStep: 1,
    });
    setHistory([]);
    setLogs([]);
    addLog('Total Purge Executed. Session Cleared.', 'warning');
  };

  const resetToDefaults = () => {
    setSettings(prev => ({
      ...prev,
      features: {
        step1: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.step1 },
        step2: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.step2 },
        step3: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.step3 },
        step4: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.step4 },
        ocr: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.ocr },
        wow: { model: 'gemini-3-flash-preview', prompt: DEFAULT_PROMPTS.wow },
      }
    }));
    addLog('LLM Matrix reset to FDA Defaults.', 'system');
  };

  const handleRollback = (entry: HistoryEntry) => {
    setPipeline(entry.state);
    addLog(`Rolled back to state: ${entry.label}`, 'system');
  };

  const currentContent = pipeline[`step${pipeline.currentStep}` as keyof PipelineState] as string;

  return (
    <div className="min-h-screen flex flex-col">
      {/* --- Header --- */}
      <header className="nordic-card m-4 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--accent)]">{t.title}</h1>
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <button 
            onClick={() => setLang(lang === 'EN' ? 'ZH' : 'EN')}
            className="p-2 rounded hover:bg-[var(--border)] transition-colors flex items-center gap-2 text-sm"
          >
            <Globe size={16} />
            {lang}
          </button>
          
          {/* Theme Toggle */}
          <button 
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded hover:bg-[var(--border)] transition-colors"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Pantone Selector */}
          <select 
            value={theme}
            onChange={(e) => setTheme(e.target.value as PantoneStyle)}
            className="nordic-input text-xs font-medium"
          >
            {Object.entries(PANTONE_PALETTES).map(([key, val]) => (
              <option key={key} value={key}>{val.name}</option>
            ))}
          </select>

          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-[var(--border)] rounded transition-colors"
            title={t.settings}
          >
            <Settings size={18} />
          </button>

          <button 
            onClick={handlePurge}
            className="p-2 text-red-500 hover:bg-red-500/10 rounded transition-colors"
            title={t.purge}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 pt-0">
        {/* --- Left Sidebar: Dashboard & Logs --- */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="nordic-card flex-1 overflow-hidden">
            <Dashboard 
              riskData={riskData} 
              tokenData={tokenData} 
              t={t} 
              history={history}
              onRollback={handleRollback}
            />
            <div className="p-6 pt-0">
              <LogViewer logs={logs} t={t} />
            </div>
          </div>
          
          {/* Pipeline Indicators */}
          <div className="nordic-card p-6 flex justify-between items-center">
            <InteractiveIndicator step={1} currentStep={pipeline.currentStep} label={t.step1.split(' ')[0]} />
            <InteractiveIndicator step={2} currentStep={pipeline.currentStep} label={t.step2.split(' ')[0]} />
            <InteractiveIndicator step={3} currentStep={pipeline.currentStep} label={t.step3.split(' ')[0]} />
            <InteractiveIndicator step={4} currentStep={pipeline.currentStep} label={t.step4.split(' ')[0]} />
          </div>
        </div>

        {/* --- Center/Right: Pipeline Workspace --- */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="nordic-card flex-1 flex flex-col overflow-hidden">
            {/* Step Header */}
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--accent)] text-[var(--accent-foreground)]">
              <div className="flex items-center gap-3">
                {pipeline.currentStep === 1 && <Search size={20} />}
                {pipeline.currentStep === 2 && <BookOpen size={20} />}
                {pipeline.currentStep === 3 && <Shuffle size={20} />}
                {pipeline.currentStep === 4 && <FileCheck size={20} />}
                <h2 className="font-semibold">
                  {t[`step${pipeline.currentStep}` as keyof typeof t]}
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs opacity-80">
                <span>{t.wordCount}: {currentContent.split(/\s+/).filter(x => x).length}</span>
              </div>
            </div>

            {/* Dual-View Editor */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
              {/* Editor Pane */}
              <div className="border-r border-[var(--border)] flex flex-col">
                <textarea 
                  className="flex-1 p-6 bg-transparent resize-none focus:outline-none font-mono text-sm leading-relaxed"
                  value={currentContent}
                  onChange={(e) => setPipeline(prev => ({ ...prev, [`step${pipeline.currentStep}`]: e.target.value }))}
                  placeholder="Paste or generate content here..."
                />
              </div>
              {/* Preview Pane */}
              <div className="p-6 overflow-y-auto bg-[var(--bg)]/50">
                <div className="markdown-body">
                  <ReactMarkdown>{currentContent || '*No content generated yet.*'}</ReactMarkdown>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-4 border-t border-[var(--border)] flex justify-between items-center">
              <div className="flex gap-2">
                {!isGenerating ? (
                  <button 
                    onClick={generateArtifact}
                    className="nordic-button flex items-center gap-2"
                  >
                    <FileText size={16} />
                    {t.generate}
                  </button>
                ) : (
                  <button 
                    onClick={stopGeneration}
                    className="nordic-button bg-red-600 flex items-center gap-2"
                  >
                    <Square size={16} />
                    {t.stop}
                  </button>
                )}
                <button className="p-2 border border-[var(--border)] rounded hover:bg-[var(--border)] transition-colors">
                  <Save size={18} />
                </button>
                <button className="p-2 border border-[var(--border)] rounded hover:bg-[var(--border)] transition-colors">
                  <Download size={18} />
                </button>
              </div>
              
              {pipeline.currentStep < 4 && (
                <button 
                  onClick={() => setPipeline(prev => ({ ...prev, currentStep: (prev.currentStep + 1) as PipelineStep }))}
                  className="flex items-center gap-2 text-[var(--accent)] font-semibold hover:translate-x-1 transition-transform"
                >
                  {t.next}
                  <ChevronRight size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* --- Settings Modal --- */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="nordic-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-[var(--border)] flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Settings size={24} className="text-[var(--accent)]" />
                  {t.settings}
                </h2>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={resetToDefaults}
                    className="text-xs flex items-center gap-1 text-[var(--accent)] hover:underline"
                  >
                    <RotateCcw size={14} />
                    {t.reset}
                  </button>
                  <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-[var(--border)] rounded">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* API Key Section */}
                {!process.env.GEMINI_API_KEY && (
                  <section className="space-y-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Key size={16} />
                      {t.apiKey}
                    </h3>
                    <input 
                      type="password"
                      className="nordic-input w-full"
                      value={settings.apiKey}
                      onChange={(e) => setSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder="Enter Gemini API Key..."
                    />
                  </section>
                )}

                {/* Feature Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(settings.features).map(([key, config]) => (
                    <div key={key} className="p-4 border border-[var(--border)] rounded bg-[var(--bg)]/50 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                        {key.toUpperCase()}
                      </h4>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-semibold text-[var(--text-muted)] flex items-center gap-1">
                          <Cpu size={10} />
                          {t.model}
                        </label>
                        <select 
                          className="nordic-input w-full text-xs"
                          value={config.model}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            features: {
                              ...prev.features,
                              [key]: { ...config, model: e.target.value }
                            }
                          }))}
                        >
                          {MODEL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-semibold text-[var(--text-muted)] flex items-center gap-1">
                          <MessageSquare size={10} />
                          {t.prompt}
                        </label>
                        <textarea 
                          className="nordic-input w-full text-xs h-24 resize-none"
                          value={config.prompt}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            features: {
                              ...prev.features,
                              [key]: { ...config, prompt: e.target.value }
                            }
                          }))}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-[var(--border)] flex justify-end">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="nordic-button"
                >
                  {t.save}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Footer --- */}
      <footer className="p-4 text-center text-[10px] text-[var(--text-muted)] uppercase tracking-[0.2em]">
        © 2026 Regulatory Command Center • Nordic WOW Pantone Edition • Secure Session Active
      </footer>
    </div>
  );
}
