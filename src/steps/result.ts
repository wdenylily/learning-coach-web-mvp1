import type { AppState } from "../state.js";
import { OutputSchema, type WeeklyPlan } from "../schema.js";
import { clearState } from "../state.js";

export function renderResult(root: HTMLElement, state: AppState, go: (s: string, p?: any) => void) {
  const data = OutputSchema.parse(state.result);

  root.innerHTML = `
    <section class="card result-page">
      <header class="result-header">
        <h2>🎉 你的专属学习路径已生成</h2>
        <div class="meta">模型：${data.meta.model} · Token：${data.meta.tokens_est} · 生成于 ${new Date(data.meta.generated_at).toLocaleString()}</div>
      </header>

      <div class="result-grid">
        <div class="panel skill-tree">
          <h3>🌳 技能树 (${data.skill_tree.length} 节点)</h3>
          <div class="tree">${renderTree(data.skill_tree)}</div>
        </div>

        <div class="panel weekly-plan">
          <h3>📅 首周计划</h3>
          ${data.weekly_plan.map((w: WeeklyPlan) => renderWeek(w)).join("")}
        </div>
      </div>

      <div class="actions">
        <button class="btn ghost" id="restart">重新摸底</button>
        <button class="btn primary" id="download">下载 JSON</button>
        <button class="btn" id="copy">复制 JSON</button>
      </div>
    </section>
  `;

  root.querySelector("#restart")!.addEventListener("click", () => { clearState(); go("welcome"); });
  root.querySelector("#download")!.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "learning-plan.json"; a.click();
  });
  root.querySelector("#copy")!.addEventListener("click", () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    alert("已复制到剪贴板");
  });
}

function renderTree(nodes: any[]): string {
  const idMap = new Map(nodes.map(n => [n.id, n]));
  const roots = nodes.filter(n => n.prereqs.length === 0);
  return `<ul class="tree-list">${roots.map(r => renderNode(r, idMap, new Set())).join("")}</ul>`;
}

function renderNode(node: any, idMap: Map<string, any>, visited: Set<string>): string {
  if (visited.has(node.id)) return `<li class="cycle">🔄 循环引用: ${node.id}</li>`;
  visited.add(node.id);
  const children = Array.from(idMap.values()).filter(n => n.prereqs.includes(node.id));
  const hasChildren = children.length > 0;
  return `
    <li class="tree-node">
      <div class="node-card" title="${node.desc}">
        <strong>${node.name}</strong>
        <span class="badge">${node.est_hours}h</span>
        <span class="badge diff-${node.difficulty}">难度 ${node.difficulty}</span>
      </div>
      ${hasChildren ? `<ul class="tree-children">${children.map(c => renderNode(c, idMap, new Set(visited))).join("")}</ul>` : ""}
    </li>
  `;
}

function renderWeek(week: WeeklyPlan): string {
  return `
    <div class="week-card">
      <h4>第 ${week.week} 周：${week.focus}</h4>
      <div class="day-grid">
        ${week.tasks.map((t: any) => `
          <div class="task-card type-${t.type}">
            <span class="day">Day ${t.day}</span>
            <span class="type">${t.type}</span>
            <span class="kw">${t.resource_kw}</span>
            <span class="dur">${t.est_min}min</span>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}