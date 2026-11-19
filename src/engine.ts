import { LearnerProfile, GeneratorOutput } from "./schema.js";

const FEW_SHOT = `用户画像：
- 目标：3 个月通过 AWS Solutions Architect Associate 考试
- 现有水平：有经验（有 2 年后端开发经验，会 Docker/Linux，零云基础）
- 每周可投入：8 小时
- 目标周数：12 周
- 偏好资源：video、practice、read
- 学习风格：exam_oriented
- 硬性约束：优先免费官方资源，考前两周只做真题

输出：
{
  "skill_tree": [
    {"id":"s1","name":"云计算核心概念与 AWS 全球基础设施","prereqs":[],"desc":"理解 Region/AZ/Edge、共享责任模型、计费基础","est_hours":3,"difficulty":2},
    {"id":"s2","name":"IAM 与账号安全最佳实践","prereqs":["s1"],"desc":"掌握用户/组/角色/策略、MFA、跨账号访问","est_hours":4,"difficulty":3},
    {"id":"s3","name":"VPC 网络设计与子网规划","prereqs":["s1"],"desc":"CIDR、公私有子网、NAT/IGW、VPC Peering","est_hours":4,"difficulty":3},
    {"id":"s4","name":"EC2 实例类型、存储、启动模板","prereqs":["s2","s3"],"desc":"选型矩阵、EBS/EFS/Instance Store、User Data","est_hours":3,"difficulty":2},
    {"id":"s5","name":"负载均衡 (ALB/NLB) 与 Auto Scaling","prereqs":["s4"],"desc":"目标组、健康检查、伸缩策略、预热","est_hours":3,"difficulty":3}
  ],
  "weekly_plan": [{
    "week": 1,
    "focus": "建立云思维 + 搭建免费账号 + 读核心白皮书",
    "tasks": [
      {"day":1,"skill":"s1","type":"video","resource_kw":"AWS 云核心概念 入门 视频","est_min":45},
      {"day":1,"skill":"s1","type":"read","resource_kw":"AWS 共享责任模型 官方文档","est_min":30},
      {"day":2,"skill":"s2","type":"practice","resource_kw":"AWS IAM 创建用户 角色 策略 实操","est_min":60},
      {"day":3,"skill":"s2","type":"read","resource_kw":"AWS IAM 最佳实践 白皮书","est_min":40},
      {"day":4,"skill":"s3","type":"video","resource_kw":"VPC 子网 CIDR 规划 实战","est_min":50},
      {"day":5,"skill":"s3","type":"practice","resource_kw":"AWS 控制台创建 VPC 子网 IGW NAT","est_min":60},
      {"day":6,"skill":"s1","type":"quiz","resource_kw":"AWS 云从业者 练习题 免费","est_min":30},
      {"day":7,"skill":"s1","type":"read","resource_kw":"AWS Well-Architected Framework 核心支柱","est_min":45}
    ]
  }],
  "meta": {"generated_at":"2026-11-20T10:00:00Z","model":"deepseek-ai/DeepSeek-V3","tokens_est":1100}
}`;

function buildSystemPrompt(profile: LearnerProfile): string {
  const levelLabel = { zero: "零基础", beginner: "入门", intermediate: "有经验", advanced: "专家" }[profile.level];
  const styleLabel = profile.learning_style
    ? { theory_first: "理论先行", project_driven: "项目驱动", micro_learning: "碎片微学", exam_oriented: "考试导向" }[profile.learning_style]
    : "不限";
  const typesLabel = profile.preferred_types?.join("、") ?? "不限";

  return `你是学习架构师。为**这位具体学习者**生成**严格 JSON**，符合指定 Schema，不加任何解释、Markdown、代码围栏。

【学习者画像】
- 目标：${profile.goal}
- 现有水平：${levelLabel}${profile.level_detail ? `（${profile.level_detail}）` : ""}
- 每周可投入：${profile.hours_per_week} 小时
${profile.target_weeks ? `- 目标周数：${profile.target_weeks} 周` : ""}
${profile.constraints ? `- 硬性约束：${profile.constraints}` : ""}
- 偏好资源：${typesLabel}
- 学习风格：${styleLabel}

【核心原则】
1. 技能树 = 有向无环图（DAG），每节点含 id/name/prereqs/desc/est_hours/difficulty
2. 节点粒度：2-4h 可完成，10-15 个节点覆盖全目标
3. prereqs 只引用已定义 id，拓扑排序合法
4. 首周计划：7 天 × 1-2 微任务，每任务 30-90 min，类型 ∈ {read,video,practice,quiz,project}
5. resource_kw 给「搜索关键词」，不给死链接
6. **严格遵守约束**：${profile.constraints ? `「${profile.constraints}」` : "无特殊约束"}
7. **优先安排偏好类型**：${typesLabel !== "不限" ? typesLabel : "均衡分配"}

【输出 Schema】
{
  "skill_tree": SkillNode[],
  "weekly_plan": [{ "week": 1, "focus": "", "tasks": DailyTask[] }],
  "meta": { "generated_at": "ISO8601", "model": "", "tokens_est": 0 }
}`;
}

export async function generatePlan(profile: LearnerProfile): Promise<GeneratorOutput> {
  const resp = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile, fewShot: FEW_SHOT, systemPrompt: buildSystemPrompt(profile) }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "网络错误" }));
    throw new Error(err.error || `HTTP ${resp.status}`);
  }
  return resp.json();
}