"use client";

import { verifyUserAction, unverifyUserAction } from "@/features/users/actions";

export function VerifyUserButton({
  id,
  verified,
}: {
  id: string;
  verified: boolean;
}) {
  async function handleToggle() {
    if (verified) {
      if (!confirm("Remove email verification from this user? They will be locked out until re-verified.")) return;
      await unverifyUserAction(id);
    } else {
      await verifyUserAction(id);
    }
  }

  return (
    <button
      onClick={handleToggle}
      className={`text-xs font-medium px-2 py-0.5 rounded-full border cursor-pointer transition-colors ${
        verified
          ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
          : "bg-red-100 text-red-800 border-red-200 hover:bg-red-200"
      }`}
      title={verified ? "Click to revoke verification" : "Click to verify"}
    >
      {verified ? "✓ Verified" : "✗ Unverified"}
    </button>
  );
}
