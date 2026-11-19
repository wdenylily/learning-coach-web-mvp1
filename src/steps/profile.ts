import type { AppState } from "../state.js";
import { REQUIRED_FIELDS } from "../schema.js";
import { saveState } from "../state.js";

// 双保险：彻底阻断 HMR 对该模块的任何干预
// @ts-ignore
if (import.meta.hot) {
  import.meta.hot.decline()
  import.meta.hot.accept(() => {}) // 空 accept，吞掉后续更新
}

const QUESTIONS = [
  { key: "goal", label: "🎯 学习目标", type: "text", placeholder: "如：从零入门 RAG 应用开发，能独立做出文档问答 Demo", required: true },
  { key: "level", label: "📊 现有水平", type: "select", options: [
    { value: "zero", label: "零基础（完全没接触过）" },
    { value: "beginner", label: "入门（看过教程/上过课，没实战）" },
    { value: "intermediate", label: "有经验（做过相关项目/工作用过）" },
    { value: "advanced", label: "专家（能教别人/架构级理解）" },
  ], required: true },
  { key: "level_detail", label: "📝 水平细节（可留空）", type: "text", placeholder: "如：会 Python 基础，懂 HTTP/REST，没碰过向量数据库", required: false },
  { key: "hours_per_week", label: "⏰ 每周可投入小时数", type: "number", min: 1, max: 40, required: true },
  { key: "target_weeks", label: "📅 目标时间线（可跳过）", type: "select", options: [
    { value: "4", label: "4 周" }, { value: "8", label: "8 周" }, { value: "12", label: "12 周" },
    { value: "24", label: "24 周" }, { value: "custom", label: "自定义..." }, { value: "", label: "⏭️ 跳过" },
  ], required: false },
  { key: "target_weeks_custom", label: "自定义周数 (1-52)", type: "number", min: 1, max: 52, showWhen: (v: any) => v.target_weeks === "custom", required: false },
  { key: "preferred_types", label: "📚 偏好资源类型（可多选，可跳过）", type: "checkbox", options: [
    { value: "video", label: "视频" }, { value: "read", label: "文档/博客" },
    { value: "practice", label: "动手实战" }, { value: "quiz", label: "刷题/测验" },
    { value: "project", label: "完整项目" },
  ], required: false },
  { key: "learning_style", label: "🧭 学习风格（可跳过）", type: "select", options: [
    { value: "theory_first", label: "理论先行（先懂原理再动手）" },
    { value: "project_driven", label: "项目驱动（在做中学）" },
    { value: "micro_learning", label: "碎片微学（每天 15-30 分钟）" },
    { value: "exam_oriented", label: "考试导向（冲证书/面试）" },
    { value: "", label: "⏭️ 跳过" },
  ], required: false },
  { key: "constraints", label: "⚠️ 硬性约束（可留空）", type: "text", placeholder: "如：不想花钱、只能用中文资料、需配合全职工作", required: false },
];

// 本地强制跳转辅助（复用 main.ts 的强制 hashchange 逻辑）
function forceGo(step: string, patch?: any) {
  if (patch) { /* state 会在外层更新 */ }
  location.hash = "_force_" + Date.now()
  setTimeout(() => location.hash = step, 0)
}

// 判断某题是否可见
function isVisible(q: any, profile: any): boolean {
  return !q.showWhen || q.showWhen(profile);
}

// 找上一个可见题的索引
function findPrevVisibleIdx(currentIdx: number, profile: any): number {
  let i = currentIdx - 1;
  while (i >= 0) {
    if (isVisible(QUESTIONS[i], profile)) return i;
    i--;
  }
  return 0;
}

// 找下一个可见题的索引
function findNextVisibleIdx(currentIdx: number, profile: any): number {
  let i = currentIdx + 1;
  while (i < QUESTIONS.length) {
    if (isVisible(QUESTIONS[i], profile)) return i;
    i++;
  }
  return QUESTIONS.length - 1;
}

export function renderProfile(root: HTMLElement, state: AppState, go: (s: string, p?: any) => void) {
  const idx = state.currentQuestionIndex;
  const q = QUESTIONS[idx];
  const progress = ((idx + 1) / QUESTIONS.length * 100).toFixed(0);

  if (q.showWhen && !q.showWhen(state.profile)) {
    state.currentQuestionIndex++;
    saveState(state);
    // 关键修复：跳过条件题也要强制触发 hashchange
    forceGo("profile", { currentQuestionIndex: state.currentQuestionIndex });
    return;
  }

  const html = `
    <section class="card">
      <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
      <p class="progress-text">第 ${idx + 1} / ${QUESTIONS.length} 题</p>
      <h2>${q.label}</h2>
      <div class="input-wrap">${renderInput(q, (state.profile as any)[q.key])}</div>
      <div class="nav">
        ${idx > 0 ? `<button class="btn ghost" id="prev">上一题</button>` : `<div class="spacer"></div>`}
        ${!q.required ? `<button class="btn ghost" id="skip">跳过</button>` : `<div class="spacer"></div>`}
        <button class="btn primary" id="next" disabled>下一题</button>
      </div>
    </section>
  `;

  // 关键修复：用 replaceChildren + insertAdjacentHTML，避免 innerHTML 触发 HMR 破坏监听器
  root.replaceChildren();
  root.insertAdjacentHTML('beforeend', html);

  const inputEl = root.querySelector("input, select, textarea") as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  const nextBtn = root.querySelector("#next")! as HTMLButtonElement;
  const enableNext = () => { nextBtn.disabled = !inputEl.value && q.required; };
  inputEl.addEventListener("input", enableNext);
  inputEl.addEventListener("change", enableNext);
  enableNext();

  root.querySelector("#prev")?.addEventListener("click", () => {
    (state.profile as any)[q.key] = inputEl.value || undefined;
    saveState(state);
    // 修复：上一题也要跳过不可见的条件题
    const prevIdx = findPrevVisibleIdx(idx, state.profile);
    go("profile", { currentQuestionIndex: prevIdx });
  });
  root.querySelector("#skip")?.addEventListener("click", () => {
    // 修复：跳过也要找下一个可见题
    const nextIdx = findNextVisibleIdx(idx, state.profile);
    go("profile", { currentQuestionIndex: nextIdx });
  });
  root.querySelector("#next")?.addEventListener("click", () => {
    let val: any = inputEl.value;
    if (q.type === "number") val = val ? Number(val) : undefined;
    if (q.type === "checkbox") val = Array.from(root.querySelectorAll("input[type=checkbox]:checked")).map((e: any) => e.value);
    if (val !== undefined && val !== "") (state.profile as any)[q.key] = val;
    else delete (state.profile as any)[q.key];
    saveState(state);
    if (idx + 1 >= QUESTIONS.length) go("confirm");
    else {
      // 修复：下一题也要找下一个可见题
      const nextIdx = findNextVisibleIdx(idx, state.profile);
      go("profile", { currentQuestionIndex: nextIdx });
    }
  });

  // 调试日志：确认绑定成功
  console.log('🔗 [profile] 事件绑定完成:', {
    prev: !!root.querySelector('#prev'),
    skip: !!root.querySelector('#skip'),
    next: !!root.querySelector('#next'),
    input: !!root.querySelector('input, select, textarea')
  });
}

function renderInput(q: any, current: any): string {
  switch (q.type) {
    case "text": return `<input type="text" placeholder="${q.placeholder}" value="${current ?? ""}" />`;
    case "number": return `<input type="number" min="${q.min}" max="${q.max}" placeholder="${q.placeholder}" value="${current ?? ""}" />`;
    case "select": return `<select>${q.options.map((o: any) => `<option value="${o.value}" ${current === o.value ? "selected" : ""}>${o.label}</option>`).join("")}</select>`;
    case "checkbox": return `<div class="checkbox-group">${q.options.map((o: any) => `<label><input type="checkbox" value="${o.value}" ${(current || []).includes(o.value) ? "checked" : ""} /> ${o.label}</label>`).join("")}</div>`;
    default: return "";
  }
}