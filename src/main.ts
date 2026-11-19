import { loadState, saveState, clearState, type AppState, type Step } from "./state.js";
import { renderWelcome } from "./steps/welcome.js";
import { renderProfile } from "./steps/profile.js";
import { renderConfirm } from "./steps/confirm.js";
import { renderResult } from "./steps/result.js";
import "./style.css";

const app = document.getElementById("app")!;
let state = loadState();

function router() {
  const hash = location.hash.slice(1) || "welcome";
  const step = hash as Step;
  if (step !== state.step) { state.step = step; saveState(state); }
  render(step);
}

function render(step: Step) {
  app.innerHTML = "";
  switch (step) {
    case "welcome": renderWelcome(app, state, go as any); break;
    case "profile": renderProfile(app, state, go as any); break;
    case "confirm": renderConfirm(app, state, go as any); break;
    case "result": renderResult(app, state, go as any); break;
  }
}

function go(nextStep: Step, patch?: Partial<AppState>) {
  if (patch) { state = { ...state, ...patch }; saveState(state); }
  // 强制触发 hashchange：先跳临时 hash，再跳目标
  location.hash = "_force_" + Date.now()
  setTimeout(() => location.hash = nextStep, 0)
}

window.addEventListener("hashchange", router);
router();