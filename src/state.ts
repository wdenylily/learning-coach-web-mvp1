import { type LearnerProfile } from "./schema.js";

export type Step = "welcome" | "profile" | "confirm" | "result";

export interface AppState {
  step: Step;
  profile: Partial<LearnerProfile>;
  currentQuestionIndex: number;
  result: any;
  error: string | null;
}

const STORAGE_KEY = "learning-coach-state";

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { step: "welcome", profile: {}, currentQuestionIndex: 0, result: null, error: null };
}

export function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}