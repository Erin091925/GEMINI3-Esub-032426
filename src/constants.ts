/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PantoneStyle, ThemeConfig } from './types';

export const PANTONE_PALETTES: Record<PantoneStyle, ThemeConfig> = {
  ClassicBlue: { accent: '#0F4C81', foreground: '#FFFFFF', name: 'Classic Blue (19-4052)' },
  PeachFuzz: { accent: '#FFBE98', foreground: '#1A1A1A', name: 'Peach Fuzz (13-1023)' },
  VeryPeri: { accent: '#6667AB', foreground: '#FFFFFF', name: 'Very Peri (17-3938)' },
  Illuminating: { accent: '#F5DF4D', foreground: '#1A1A1A', name: 'Illuminating (13-0647)' },
  LivingCoral: { accent: '#FF6F61', foreground: '#FFFFFF', name: 'Living Coral (16-1546)' },
  UltraViolet: { accent: '#5F4B8B', foreground: '#FFFFFF', name: 'Ultra Violet (18-3838)' },
  Greenery: { accent: '#88B04B', foreground: '#FFFFFF', name: 'Greenery (15-0343)' },
  Marsala: { accent: '#955251', foreground: '#FFFFFF', name: 'Marsala (18-1438)' },
  Emerald: { accent: '#009473', foreground: '#FFFFFF', name: 'Emerald (17-5641)' },
  TangerineTango: { accent: '#DD4124', foreground: '#FFFFFF', name: 'Tangerine Tango (17-1463)' },
};

export const DEFAULT_PROMPTS = {
  step1: "Generate a 2000-word FDA Intelligence Summary for a generic medical device. Include Device Description, Intended Use, and Predicate Comparison. Use Markdown.",
  step2: "Generate a 2000-word Guidance-Driven Review Instruction set. Include a checklist and exactly 3 Markdown tables for Performance, Biocompatibility, and Labeling.",
  step3: "Reorganize a hypothetical 510(k) submission summary based on the instructions from Step 2. Focus on mapping data to the required tables.",
  step4: "Synthesize a final 3000-word Comprehensive 510(k) Review Report. Include Executive Summary, Deficiencies, and Final Recommendation.",
  ocr: "Extract all text and tables from this medical device document. Maintain structural integrity.",
  wow: "Analyze this regulatory artifact for risk, consistency, and labeling compliance.",
};

export const MODEL_OPTIONS = [
  "gemini-2.5-flash",
  "gemini-3-flash-preview",
  "gemini-3.1-pro-preview"
];

export const TRANSLATIONS = {
  EN: {
    title: 'FDA 510(k) Review Studio v3.0',
    subtitle: 'Regulatory Command Center: Nordic WOW — Pantone Edition',
    step1: 'Device Context & FDA Intelligence',
    step2: 'Guidance-Driven Instructions',
    step3: 'Submission Reorganization',
    step4: 'Final Comprehensive Review',
    dashboard: 'Mission Control',
    logs: 'Black Box Recorder',
    settings: 'LLM Matrix',
    theme: 'Pantone Style',
    language: 'Language',
    purge: 'Total Purge',
    generate: 'Generate Artifact',
    save: 'Save Changes',
    download: 'Download',
    next: 'Proceed to Next Step',
    riskRadar: 'Regulatory Risk Radar',
    tokenEfficiency: 'Token Efficiency',
    activeStep: 'Active Pipeline Step',
    wordCount: 'Word Count',
    stop: 'Stop Generation',
    reset: 'Reset to FDA Defaults',
    rollback: 'Rollback to this state',
    apiKey: 'Gemini API Key',
    model: 'Model Selection',
    prompt: 'System Prompt',
    timeline: 'State Lineage (DAG)',
  },
  ZH: {
    title: 'FDA 510(k) 審查工作室 v3.0',
    subtitle: '法規指揮中心：北歐 WOW — Pantone 版',
    step1: '設備背景與 FDA 情報',
    step2: '指南驅動的審查指令',
    step3: '提交內容重組',
    step4: '最終綜合審查報告',
    dashboard: '任務控制中心',
    logs: '黑盒子記錄器',
    settings: 'LLM 矩陣',
    theme: 'Pantone 風格',
    language: '語言',
    purge: '全面清除',
    generate: '生成產出',
    save: '儲存變更',
    download: '下載',
    next: '進入下一步',
    riskRadar: '法規風險雷達',
    tokenEfficiency: 'Token 效率',
    activeStep: '當前流程步驟',
    wordCount: '字數',
    stop: '停止生成',
    reset: '重置為 FDA 預設',
    rollback: '回滾到此狀態',
    apiKey: 'Gemini API 金鑰',
    model: '模型選擇',
    prompt: '系統提示詞',
    timeline: '狀態血統 (DAG)',
  },
};
