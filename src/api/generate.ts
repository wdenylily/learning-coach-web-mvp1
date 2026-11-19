import type { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://api.siliconflow.cn/v1",
  apiKey: process.env.SF_KEY,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { profile, fewShot, systemPrompt } = req.body as {
    profile: any;
    fewShot: string;
    systemPrompt: string;
  };

  if (!profile || !systemPrompt) return res.status(400).json({ error: "缺少参数" });

  try {
    const completion = await client.chat.completions.create({
      model: "deepseek-ai/DeepSeek-V3",
      temperature: 0.3,
      max_tokens: 2500,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: fewShot },
        { role: "user", content: "请为上述学习者生成技能树 + 首周计划。" },
      ],
    });

    const raw = completion.choices[0].message.content ?? "";
    const parsed = JSON.parse(raw);

    if (!parsed.skill_tree || !parsed.weekly_plan) throw new Error("输出结构不完整");

    return res.status(200).json({
      ...parsed,
      meta: {
        ...parsed.meta,
        generated_at: new Date().toISOString(),
        model: "deepseek-ai/DeepSeek-V3",
        tokens_est: completion.usage?.total_tokens ?? 0,
      },
    });
  } catch (e: any) {
    console.error("Generate error:", e);
    return res.status(500).json({ error: e.message || "生成失败" });
  }
}