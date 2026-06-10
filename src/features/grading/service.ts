import { anthropic } from "@/lib/anthropic";
import { env } from "@/lib/env";

interface GradeInput {
  prompt: string;
  correctAnswer: string;
  explanation: string;
  studentAnswer: string;
}

export interface GradeResult {
  verdict: "CORRECT" | "INCORRECT" | "UNSURE";
  rationale: string;
  model: string;
}

export async function gradeAnswer(input: GradeInput): Promise<GradeResult> {
  const model = env.ANTHROPIC_GRADING_MODEL;

  try {
    const message = await anthropic.messages.create({
      model,
      max_tokens: 256,
      system: `You are grading a student's free-text answer to a Wireshark/networking question.
Compare the student's answer to the correct answer and explanation.
Return a JSON object with exactly two keys:
- "verdict": one of "correct", "incorrect", or "unsure"
- "rationale": a brief 1-2 sentence explanation of your decision

Use "correct" if the student captures the key idea (exact wording need not match).
Use "incorrect" if the answer contradicts or misses the key idea.
Use "unsure" if the answer is ambiguous, partially right, or you cannot confidently judge.
Respond with JSON only. No markdown, no backticks, no preamble.`,
      messages: [
        {
          role: "user",
          content: `Question: ${input.prompt}

Correct answer: ${input.correctAnswer}

Explanation: ${input.explanation}

Student's answer: ${input.studentAnswer}`,
        },
      ],
    });

    const firstBlock = message.content[0];
    const text = firstBlock && firstBlock.type === "text" ? firstBlock.text : "";
    const clean = text.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    const parsed = JSON.parse(clean) as { verdict: string; rationale: string };
    const verdictRaw = (parsed.verdict ?? "unsure").toLowerCase();
    const verdict =
      verdictRaw === "correct"
        ? "CORRECT"
        : verdictRaw === "incorrect"
          ? "INCORRECT"
          : "UNSURE";

    return { verdict, rationale: parsed.rationale ?? "", model };
  } catch (err) {
    // If Claude is unavailable or returns invalid JSON, fall back to UNSURE
    console.error("[grading] Failed to grade answer:", err);
    return {
      verdict: "UNSURE",
      rationale: "Grading service unavailable — an instructor will review your answer.",
      model,
    };
  }
}
