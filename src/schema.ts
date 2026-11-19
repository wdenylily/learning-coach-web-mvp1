import { z } from "zod";

export const LearnerProfileSchema = z.object({
  goal: z.string().min(5).max(200),
  level: z.enum(["zero", "beginner", "intermediate", "advanced"]),
  level_detail: z.string().max(300).optional(),
  hours_per_week: z.number().int().min(1).max(40),
  target_weeks: z.number().int().min(1).max(52).optional(),
  preferred_types: z.array(z.enum(["video", "read", "practice", "quiz", "project"])).optional(),
  learning_style: z.enum(["theory_first", "project_driven", "micro_learning", "exam_oriented"]).optional(),
  constraints: z.string().max(300).optional(),
});

export const SkillNodeSchema = z.object({
  id: z.string(),
  name: z.string().max(20),
  prereqs: z.array(z.string()).default([]),
  desc: z.string().max(120),
  est_hours: z.number().int().positive().max(8),
  difficulty: z.number().int().min(1).max(5).default(3),
});

export const DailyTaskSchema = z.object({
  day: z.number().int().min(1).max(7),
  skill: z.string(),
  type: z.enum(["read", "video", "practice", "quiz", "project"]),
  resource_kw: z.string().max(60),
  est_min: z.number().int().positive().max(180),
});

export const WeeklyPlanSchema = z.object({
  week: z.number().int().positive(),
  focus: z.string().max(60),
  tasks: z.array(DailyTaskSchema).min(3).max(14),
});

export const OutputSchema = z.object({
  skill_tree: z.array(SkillNodeSchema).min(8).max(18),
  weekly_plan: z.array(WeeklyPlanSchema).min(1).max(4),
  meta: z.object({ generated_at: z.string(), model: z.string(), tokens_est: z.number().int().positive() }),
});

export type LearnerProfile = z.infer<typeof LearnerProfileSchema>;
export type SkillNode = z.infer<typeof SkillNodeSchema>;
export type DailyTask = z.infer<typeof DailyTaskSchema>;
export type WeeklyPlan = z.infer<typeof WeeklyPlanSchema>;
export type GeneratorOutput = z.infer<typeof OutputSchema>;
export const REQUIRED_FIELDS = ["goal", "level", "hours_per_week"] as const;