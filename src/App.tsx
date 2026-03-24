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
  FileCheck
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
import { PANTONE_PALETTES, TRANSLATIONS } from './constants';
import { PantoneStyle, Language, PipelineStep, LogEntry, PipelineState } from './types';

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

const Dashboard = ({ riskData, tokenData, t }: { riskData: any[], tokenData: any[], t: any }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
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
        <span className="opacity-50">v3.0.0-STABLE</span>
      </div>
      <div ref={scrollRef} className="overflow-y-auto flex-1 scrollbar-hide">
        {logs.map((log) => (
          <div key={log.id} className="mb-1 flex gap-2">
            <span className="opacity-40">[{log.timestamp}]</span>
            <span className={
              log.type === 'error' ? 'text-red-500' : 
              log.type === 'warning' ? 'text-yellow-500' : 
              log.type === 'success' ? 'text-blue-400' : ''
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
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

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
    addLog('System Initialized: Nordic WOW Pantone Edition v3.0', 'success');
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
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3-flash-preview";
      
      let prompt = "";
      switch(pipeline.currentStep) {
        case 1:
          prompt = "Generate a 2000-word FDA Intelligence Summary for a generic medical device. Include Device Description, Intended Use, and Predicate Comparison. Use Markdown.";
          break;
        case 2:
          prompt = "Generate a 2000-word Guidance-Driven Review Instruction set. Include a checklist and exactly 3 Markdown tables for Performance, Biocompatibility, and Labeling.";
          break;
        case 3:
          prompt = "Reorganize a hypothetical 510(k) submission summary based on the instructions from Step 2. Focus on mapping data to the required tables.";
          break;
        case 4:
          prompt = "Synthesize a final 3000-word Comprehensive 510(k) Review Report. Include Executive Summary, Deficiencies, and Final Recommendation.";
          break;
      }

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      const text = response.text || "Failed to generate content.";
      setPipeline(prev => ({
        ...prev,
        [`step${pipeline.currentStep}`]: text
      }));
      
      addLog(`Step ${pipeline.currentStep} Artifact Generated Successfully.`, 'success');
    } catch (error) {
      addLog(`Generation Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsGenerating(false);
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
    setLogs([]);
    addLog('Total Purge Executed. Session Cleared.', 'warning');
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
          <div className="nordic-card flex-1">
            <Dashboard riskData={riskData} tokenData={tokenData} t={t} />
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
                <button 
                  onClick={generateArtifact}
                  disabled={isGenerating}
                  className="nordic-button flex items-center gap-2 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    >
                      <Activity size={16} />
                    </motion.div>
                  ) : <FileText size={16} />}
                  {t.generate}
                </button>
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

      {/* --- Footer --- */}
      <footer className="p-4 text-center text-[10px] text-[var(--text-muted)] uppercase tracking-[0.2em]">
        © 2026 Regulatory Command Center • Nordic WOW Pantone Edition • Secure Session Active
      </footer>
    </div>
  );
}
