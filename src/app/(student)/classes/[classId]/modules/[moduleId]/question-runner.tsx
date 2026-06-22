"use client";

import { useActionState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormError } from "@/components/ui/form-error";
import { submitAttemptAction, type AttemptResult } from "@/features/attempts/actions";

interface Question {
  id: string;
  prompt: string;
  order: number;
  attempts: {
    verdict: string;
    studentAnswer: string;
    aiRationale: string | null;
  }[];
  correctAnswer: string;
  explanation: string;
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
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${styles[verdict] ?? "bg-gray-100 text-gray-600"}`}
    >
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

  const prior = question.attempts[0];
  const justSubmitted = result.ok;

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/30">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
          {index + 1}
        </span>
        <span className="text-xs text-muted-foreground">Question {index + 1} of {total}</span>
        {prior && !justSubmitted && (
          <span className="ml-auto"><VerdictBadge verdict={prior.verdict} /></span>
        )}
        {justSubmitted && (
          <span className="ml-auto"><VerdictBadge verdict={result.verdict ?? "UNSURE"} /></span>
        )}
      </div>

      <div className="p-6 space-y-5">
        <p className="text-base leading-relaxed font-medium">{question.prompt}</p>

        {prior && !justSubmitted && (
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your previous answer</p>
            <p className="text-sm">{prior.studentAnswer}</p>
            {prior.aiRationale && (
              <p className="text-sm text-muted-foreground italic">{prior.aiRationale}</p>
            )}
            <div className="pt-2 border-t border-border space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Correct answer</p>
              <p className="text-sm">{question.correctAnswer}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Explanation</p>
              <p className="text-sm">{question.explanation}</p>
            </div>
          </div>
        )}

        {justSubmitted && (
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your answer</p>
              <p className="text-sm">{result.studentAnswer}</p>
            </div>
            {result.rationale && (
              <p className="text-sm text-muted-foreground italic">{result.rationale}</p>
            )}
            <div className="pt-2 border-t border-border space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Correct answer</p>
              <p className="text-sm">{result.correctAnswer}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Explanation</p>
              <p className="text-sm">{result.explanation}</p>
            </div>
          </div>
        )}

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
