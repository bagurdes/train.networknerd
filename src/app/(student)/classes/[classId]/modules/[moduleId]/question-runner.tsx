"use client";

import { useState, useActionState } from "react";
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
  const style = styles[verdict] ?? "bg-gray-100 text-gray-600";
  const label = labels[verdict] ?? verdict;

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${style}`}
    >
      {label}
    </span>
  );
}

function SingleQuestion({
  question,
  classId,
  moduleId,
  onNext,
  isLast,
}: {
  question: Question;
  classId: string;
  moduleId: string;
  onNext: () => void;
  isLast: boolean;
}) {
  const action = submitAttemptAction.bind(null, question.id, classId, moduleId);
  const [result, formAction] = useActionState(action, initialResult);

  const prior = question.attempts[0];
  const alreadyAnswered = !!prior && !result.ok;
  const justSubmitted = result.ok;

  return (
    <div className="space-y-5">
      <p className="text-lg leading-relaxed">{question.prompt}</p>

      {/* Prior attempt */}
      {alreadyAnswered && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Your previous answer:</p>
          <p className="text-sm">{prior.studentAnswer}</p>
          <VerdictBadge verdict={prior.verdict} />
          {prior.aiRationale && (
            <p className="text-sm text-muted-foreground">{prior.aiRationale}</p>
          )}
          <button
            className="text-xs text-primary hover:underline pt-1 block"
            onClick={() => {
              /* allow re-attempt by showing the form — handled by not setting submitted */
            }}
          >
            Re-attempt below
          </button>
        </div>
      )}

      {/* Result after submission */}
      {justSubmitted && (
        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
          <VerdictBadge verdict={result.verdict ?? "UNSURE"} />
          {result.rationale && (
            <p className="text-sm text-muted-foreground">{result.rationale}</p>
          )}
          <div className="pt-2 border-t border-border space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Correct answer
            </p>
            <p className="text-sm">{result.correctAnswer}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Explanation
            </p>
            <p className="text-sm">{result.explanation}</p>
          </div>
        </div>
      )}

      {/* Answer form — always shown unless just submitted */}
      {!justSubmitted && (
        <form action={formAction} className="space-y-3">
          <Textarea
            name="studentAnswer"
            rows={5}
            placeholder="Type your answer here…"
            required
          />
          <FormError>{result.error}</FormError>
          <SubmitButton pendingText="Grading…">Submit answer</SubmitButton>
        </form>
      )}

      {/* Navigation */}
      {justSubmitted && (
        <button
          onClick={onNext}
          className="text-sm font-medium text-primary hover:underline"
        >
          {isLast ? "← Back to modules" : "Next question →"}
        </button>
      )}
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
  const [current, setCurrent] = useState(0);

  const question = questions[current];
  const isLast = current === questions.length - 1;

  function handleNext() {
    if (isLast) {
      window.history.back();
    } else {
      setCurrent((c) => c + 1);
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Question {current + 1} of {questions.length}
        </span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 w-6 rounded-full transition-colors ${
                i === current ? "bg-primary" : "bg-muted hover:bg-muted-foreground/40"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Question card */}
      <div className="rounded-lg border border-border bg-card p-6">
        <SingleQuestion
          key={question.id}
          question={question}
          classId={classId}
          moduleId={moduleId}
          onNext={handleNext}
          isLast={isLast}
        />
      </div>
    </div>
  );
}
