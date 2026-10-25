"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  regenerateJoinCodeAction,
  setJoinEnabledAction,
} from "@/features/classes/actions";

export function JoinCodeCard({
  classId,
  code,
  joinUrl,
  enabled,
}: {
  classId: string;
  /** Formatted code ("ABCD-2345"), or null if the class has none yet. */
  code: string | null;
  joinUrl: string | null;
  enabled: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  async function copy(text: string, which: "code" | "link") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard blocked (e.g. non-HTTPS); the text is selectable anyway.
    }
  }

  function regenerate() {
    if (
      code &&
      !confirm("Make a new join code? The current code and link will stop working immediately.")
    ) {
      return;
    }
    startTransition(() => regenerateJoinCodeAction(classId));
  }

  function toggle() {
    startTransition(() => setJoinEnabledAction(classId, !enabled));
  }

  if (!code || !joinUrl) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          This class doesn&rsquo;t have a join code yet.
        </p>
        <Button size="sm" onClick={regenerate} disabled={pending}>
          {pending ? "Generating…" : "Generate join code"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className={enabled ? "" : "opacity-50"}>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xl font-semibold tracking-widest select-all">{code}</span>
          <Button size="sm" variant="ghost" onClick={() => copy(code, "code")}>
            {copied === "code" ? "Copied" : "Copy"}
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground break-all select-all">{joinUrl}</span>
          <Button size="sm" variant="ghost" onClick={() => copy(joinUrl, "link")}>
            {copied === "link" ? "Copied" : "Copy link"}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {enabled
          ? "Students with this code or link can join until the class is full or past its end date."
          : "Joining is turned off. The code and link won't work until you turn it back on."}
      </p>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={toggle} disabled={pending}>
          {enabled ? "Turn off joining" : "Turn on joining"}
        </Button>
        <Button size="sm" variant="outline" onClick={regenerate} disabled={pending}>
          New code
        </Button>
      </div>
    </div>
  );
}
