/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PantoneStyle = 
  | 'ClassicBlue'
  | 'PeachFuzz'
  | 'VeryPeri'
  | 'Illuminating'
  | 'LivingCoral'
  | 'UltraViolet'
  | 'Greenery'
  | 'Marsala'
  | 'Emerald'
  | 'TangerineTango';

export type Language = 'EN' | 'ZH';

export type PipelineStep = 1 | 2 | 3 | 4;

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface PipelineState {
  step1: string;
  step2: string;
  step3: string;
  step4: string;
  currentStep: PipelineStep;
}

export interface ThemeConfig {
  accent: string;
  foreground: string;
  name: string;
}
