import type { AppState } from "../state.js";

export function renderWelcome(root: HTMLElement, state: AppState, go: (s: string, p?: any) => void) {
  root.innerHTML = `
    <section class="card center">
      <h1>🎓 学习架构师</h1>
      <p class="muted">通过 5 个问题，为你生成专属技能树 + 首周计划</p>
      <ul class="features">
        <li>零默认值 · 全靠你回答</li>
        <li>动态 System Prompt · 真正懂你</li>
        <li>结构化技能树 (DAG) + 每日微任务</li>
        <li>结果可导出 JSON / 分享链接</li>
      </ul>
      <button class="btn primary" id="start">开始摸底</button>
    </section>
  `;
  root.querySelector("#start")!.addEventListener("click", () => go("profile", { currentQuestionIndex: 0 }));
}