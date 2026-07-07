"use client";

import { useActionState, useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormError } from "@/components/ui/form-error";
import {
  submitDemoAttemptAction,
  type DemoAttemptResult,
} from "@/features/demo/actions";

interface DemoQuestion {
  id: string;
  prompt: string;
  hint: string | null;
  order: number;
}

interface StoredAttempt {
  studentAnswer: string;
  verdict: string;
  rationale: string;
  correctAnswer: string;
  explanation: string;
}

const initialResult: DemoAttemptResult = { ok: false };

function storageKey(moduleId: string) {
  return `nn-demo-${moduleId}`;
}

function loadStored(moduleId: string): Record<string, StoredAttempt> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(storageKey(moduleId));
    return raw ? (JSON.parse(raw) as Record<string, StoredAttempt>) : {};
  } catch {
    return {};
  }
}

function saveStored(moduleId: string, data: Record<string, StoredAttempt>) {
  try {
    localStorage.setItem(storageKey(moduleId), JSON.stringify(data));
  } catch {
    // localStorage full or blocked — demo still works, just won't persist
  }
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const styles: Record<string, string> = {
    CORRECT: "bg-green-100 text-green-800 border-green-200",
    INCORRECT: "bg-red-100 text-red-800 border-red-200",
    UNSURE: "bg-yellow-100 text-yellow-800 border-yellow-200",
  };
  const labels: Record<string, string> = {
    CORRECT: "✓ Correct",
    INCORRECT: "✗ Incorrect",
    UNSURE: "? Unsure",
  };
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${styles[verdict] ?? "bg-gray-100 text-gray-600"}`}
    >
      {labels[verdict] ?? verdict}
    </span>
  );
}

function DemoQuestionCard({
  question,
  index,
  total,
  stored,
  onGraded,
}: {
  question: DemoQuestion;
  index: number;
  total: number;
  stored: StoredAttempt | undefined;
  onGraded: (questionId: string, attempt: StoredAttempt) => void;
}) {
  const action = submitDemoAttemptAction.bind(null, question.id);
  const [result, formAction] = useActionState(action, initialResult);
  const [showHint, setShowHint] = useState(false);

  // Push a fresh grading result up to the parent for localStorage persistence.
  useEffect(() => {
    if (result.ok && result.verdict) {
      onGraded(question.id, {
        studentAnswer: result.studentAnswer ?? "",
        verdict: result.verdict,
        rationale: result.rationale ?? "",
        correctAnswer: result.correctAnswer ?? "",
        explanation: result.explanation ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  // Prefer the just-graded result; fall back to what's in localStorage.
  const display: StoredAttempt | undefined = result.ok
    ? {
        studentAnswer: result.studentAnswer ?? "",
        verdict: result.verdict ?? "UNSURE",
        rationale: result.rationale ?? "",
        correctAnswer: result.correctAnswer ?? "",
        explanation: result.explanation ?? "",
      }
    : stored;

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/30">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
          {index + 1}
        </span>
        <span className="text-xs text-muted-foreground">
          Question {index + 1} of {total}
        </span>
        {display && (
          <span className="ml-auto">
            <VerdictBadge verdict={display.verdict} />
          </span>
        )}
      </div>

      <div className="p-6 space-y-5">
        {/* Question */}
        <p className="text-base leading-relaxed font-medium whitespace-pre-wrap">
          {question.prompt}
        </p>

        {/* Hint */}
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
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1">
                  Hint
                </p>
                <p className="text-sm text-amber-900 whitespace-pre-wrap">{question.hint}</p>
              </div>
            )}
          </div>
        )}

        {/* Result (graded now or restored from localStorage) */}
        {display && (
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Your answer
              </p>
              <p className="text-sm whitespace-pre-wrap">{display.studentAnswer}</p>
            </div>
            {display.rationale && (
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  AI feedback
                </p>
                <p className="text-sm text-muted-foreground italic whitespace-pre-wrap">
                  {display.rationale}
                </p>
              </div>
            )}
            <div className="pt-2 border-t border-border space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Correct answer
              </p>
              <p className="text-sm whitespace-pre-wrap">{display.correctAnswer}</p>
            </div>
            {display.explanation && (
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Explanation
                </p>
                <p className="text-sm whitespace-pre-wrap">{display.explanation}</p>
              </div>
            )}
          </div>
        )}

        {/* Answer form */}
        <form action={formAction} className="space-y-3">
          <Textarea
            name="studentAnswer"
            rows={4}
            placeholder={display ? "Re-attempt — type a new answer…" : "Type your answer here…"}
            required
          />
          <FormError>{result.error}</FormError>
          <SubmitButton pendingText="Grading…">
            {display ? "Re-submit answer" : "Submit answer"}
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}

export function DemoQuestionRunner({
  moduleId,
  questions,
}: {
  moduleId: string;
  questions: DemoQuestion[];
}) {
  const [attempts, setAttempts] = useState<Record<string, StoredAttempt>>({});
  const [loaded, setLoaded] = useState(false);

  // Load persisted attempts once on mount (client only).
  useEffect(() => {
    setAttempts(loadStored(moduleId));
    setLoaded(true);
  }, [moduleId]);

  function handleGraded(questionId: string, attempt: StoredAttempt) {
    setAttempts((prev) => {
      const next = { ...prev, [questionId]: attempt };
      saveStored(moduleId, next);
      return next;
    });
  }

  const answered = Object.keys(attempts).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{questions.length} questions</span>
        <span>
          {answered} of {questions.length} answered
        </span>
      </div>
      <div className="space-y-6">
        {questions.map((q, i) => (
          <DemoQuestionCard
            key={q.id}
            question={q}
            index={i}
            total={questions.length}
            stored={loaded ? attempts[q.id] : undefined}
            onGraded={handleGraded}
          />
        ))}
      </div>
    </div>
  );
}
