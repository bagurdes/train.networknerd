"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormError } from "@/components/ui/form-error";
import { Button } from "@/components/ui/button";
import {
  revealAnswerAction,
  submitAttemptAction,
  type AttemptResult,
} from "@/features/attempts/actions";

interface Question {
  id: string;
  prompt: string;
  order: number;
  hint: string | null;
  attempts: {
    verdict: string;
    studentAnswer: string;
    aiRationale: string | null;
  }[];
  /** Only present once the student has answered correctly (see page.tsx). */
  correctAnswer: string | null;
  explanation: string | null;
}

const initialResult: AttemptResult = { ok: false };

function VerdictBadge({ verdict }: { verdict: string }) {
  const styles: Record<string, string> = {
    CORRECT: "bg-green-100 text-green-800 border-green-200",
    INCORRECT: "bg-red-100 text-red-800 border-red-200",
    UNSURE: "bg-yellow-100 text-yellow-800 border-yellow-200",
    PENDING: "bg-gray-100 text-gray-600 border-gray-200",
  };
  const labels: Record<string, string> = {
    CORRECT: "✓ Correct",
    INCORRECT: "✗ Incorrect",
    UNSURE: "? Unsure",
    PENDING: "Pending",
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${styles[verdict] ?? "bg-gray-100 text-gray-600"}`}>
      {labels[verdict] ?? verdict}
    </span>
  );
}

function QuestionCard({
  question,
  index,
  total,
  classId,
  moduleId,
}: {
  question: Question;
  index: number;
  total: number;
  classId: string;
  moduleId: string;
}) {
  const action = submitAttemptAction.bind(null, question.id, classId, moduleId);
  const [result, formAction] = useActionState(action, initialResult);
  const [showHint, setShowHint] = useState(false);

  const prior = question.attempts[0];
  const justSubmitted = result.ok;

  // The latest result to show: the answer just submitted, or the saved one.
  const latest = justSubmitted
    ? {
        label: "Your answer",
        verdict: result.verdict ?? "UNSURE",
        studentAnswer: result.studentAnswer ?? "",
        rationale: result.rationale ?? null,
        correctAnswer: result.correctAnswer ?? null,
        explanation: result.explanation ?? null,
      }
    : prior
      ? {
          label: "Your previous answer",
          verdict: prior.verdict,
          studentAnswer: prior.studentAnswer,
          rationale: prior.aiRationale,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
        }
      : null;

  // Wrong / unsure answers: the answer and explanation stay hidden until the
  // student asks for them. A new submission hides them again.
  const [revealed, setRevealed] = useState<{ correctAnswer: string; explanation: string | null } | null>(null);
  const [revealError, setRevealError] = useState("");
  const [revealing, startReveal] = useTransition();
  useEffect(() => {
    setRevealed(null);
    setRevealError("");
  }, [result]);

  function reveal() {
    startReveal(async () => {
      const r = await revealAnswerAction(question.id, classId, moduleId);
      if (r.ok && r.correctAnswer !== undefined) {
        setRevealed({ correctAnswer: r.correctAnswer, explanation: r.explanation ?? null });
        setRevealError("");
      } else {
        setRevealError(r.error ?? "Could not load the answer. Please try again.");
      }
    });
  }

  const isCorrect = latest?.verdict === "CORRECT";
  const answerToShow =
    isCorrect && latest?.correctAnswer
      ? { correctAnswer: latest.correctAnswer, explanation: latest.explanation }
      : revealed;

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/30">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
          {index + 1}
        </span>
        <span className="text-xs text-muted-foreground">Question {index + 1} of {total}</span>
        {latest && (
          <span className="ml-auto"><VerdictBadge verdict={latest.verdict} /></span>
        )}
      </div>

      <div className="p-6 space-y-5">
        {/* Question text */}
        <p className="text-base leading-relaxed font-medium whitespace-pre-wrap">{question.prompt}</p>

        {/* Hint — only if the question has one */}
        {question.hint && (
          <div>
            <button
              type="button"
              onClick={() => setShowHint(!showHint)}
              className="text-sm text-primary hover:underline"
            >
              {showHint ? "Hide hint" : "Show hint"}
            </button>
            {showHint && (
              <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1">Hint</p>
                <p className="text-sm text-amber-900">{question.hint}</p>
              </div>
            )}
          </div>
        )}

        {/* Latest result */}
        {latest && (
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{latest.label}</p>
              <p className="text-sm whitespace-pre-wrap">{latest.studentAnswer}</p>
            </div>
            {latest.rationale && (
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">AI feedback</p>
                <p className="text-sm text-muted-foreground italic">{latest.rationale}</p>
              </div>
            )}

            {answerToShow ? (
              <>
                <div className="pt-2 border-t border-border space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Correct answer</p>
                  <p className="text-sm whitespace-pre-wrap">{answerToShow.correctAnswer}</p>
                </div>
                {answerToShow.explanation && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Explanation</p>
                    <p className="text-sm whitespace-pre-wrap">{answerToShow.explanation}</p>
                  </div>
                )}
              </>
            ) : (
              !isCorrect && (
                <div className="pt-2 border-t border-border space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Try again below, or reveal the answer if you&rsquo;re stuck.
                  </p>
                  <Button type="button" size="sm" variant="outline" onClick={reveal} disabled={revealing}>
                    {revealing ? "Loading…" : "Show Correct Answer and Explanation"}
                  </Button>
                  <FormError>{revealError}</FormError>
                </div>
              )
            )}
          </div>
        )}

        {/* Answer form */}
        <form action={formAction} className="space-y-3">
          <Textarea
            name="studentAnswer"
            rows={4}
            placeholder={prior ? "Re-attempt — type a new answer…" : "Type your answer here…"}
            required
          />
          <FormError>{result.error}</FormError>
          <SubmitButton pendingText="Grading…">
            {prior ? "Re-submit answer" : "Submit answer"}
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}

export function QuestionRunner({
  questions,
  classId,
  moduleId,
}: {
  questions: Question[];
  classId: string;
  moduleId: string;
}) {
  const answered = questions.filter((q) => q.attempts.length > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{questions.length} questions</span>
        <span>{answered} of {questions.length} answered</span>
      </div>
      <div className="space-y-6">
        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={i}
            total={questions.length}
            classId={classId}
            moduleId={moduleId}
          />
        ))}
      </div>
    </div>
  );
}
