"use client";

import { useState } from "react";
import { adminResetPasswordAction } from "@/features/users/actions";

export function ResetPasswordButton({ userId, name }: { userId: string; name: string }) {
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");

  async function handleReset() {
    if (!confirm(`Send a password reset email to ${name}?`)) return;
    const result = await adminResetPasswordAction(userId);
    setStatus(result.ok ? "sent" : "error");
    setTimeout(() => setStatus("idle"), 3000);
  }

  return (
    <button
      onClick={handleReset}
      className="text-xs px-2 py-1 rounded border border-border hover:bg-muted transition-colors"
    >
      {status === "sent" ? "✓ Sent!" : status === "error" ? "✗ Failed" : "Reset pwd"}
    </button>
  );
}
