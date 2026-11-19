import type { AppState } from "../state.js";
import { REQUIRED_FIELDS } from "../schema.js";

const LABELS: Record<string, string> = {
  goal: "目标", level: "水平", level_detail: "水平细节", hours_per_week: "周投入",
  target_weeks: "目标周数", preferred_types: "偏好资源", learning_style: "学习风格", constraints: "约束",
};

export function renderConfirm(root: HTMLElement, state: AppState, go: (s: string, p?: any) => void) {
  const missing = REQUIRED_FIELDS.filter((k) => !state.profile[k]);
  if (missing.length) { go("profile", { currentQuestionIndex: 0 }); return; }

  root.innerHTML = `
    <section class="card">
      <h2>✅ 请确认你的学习者画像</h2>
      <div class="summary-grid">
        ${Object.entries(state.profile).map(([k, v]) => `
          <div class="summary-item">
            <span class="summary-label">${LABELS[k] || k}</span>
            <span class="summary-value">${Array.isArray(v) ? v.join("、") : v}</span>
          </div>
        `).join("")}
      </div>
      <div class="actions">
        <button class="btn ghost" id="edit">修改回答</button>
        <button class="btn primary" id="generate">生成技能树 + 首周计划</button>
      </div>
    </section>
  `;

  root.querySelector("#edit")!.addEventListener("click", () => go("profile", { currentQuestionIndex: 0 }));
  root.querySelector("#generate")!.addEventListener("click", async () => {
    const btn = root.querySelector("#generate")! as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = "生成中...";
    try {
      const { generatePlan } = await import("../engine.js");
      const result = await generatePlan(state.profile as any);
      go("result", { result });
    } catch (e: any) {
      btn.disabled = false;
      btn.textContent = "生成技能树 + 首周计划";
      alert("生成失败：" + e.message);
    }
  });
}