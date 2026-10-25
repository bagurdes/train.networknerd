import Link from "next/link";
import { verifyEmail, type VerifyEmailResult } from "@/features/auth/service";

export const metadata = { title: "Verify Email · Network Nerd" };

export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let success = false;
  let name = "";
  let joinedClass: VerifyEmailResult["joinedClass"];
  let errorMessage = "";

  try {
    const result = await verifyEmail(token);
    success = true;
    name = result.name;
    joinedClass = result.joinedClass;
  } catch (err) {
    errorMessage =
      err instanceof Error ? err.message : "Something went wrong. Please try again.";
  }

  if (success) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="text-4xl">✅</div>
        <h1 className="text-2xl font-bold tracking-tight">Email verified!</h1>
        <p className="text-muted-foreground">
          Welcome to Network Nerd, {name}. Your account is now active.
        </p>
        {joinedClass && !joinedClass.error && (
          <p className="text-sm">
            You&rsquo;ve been added to <strong>{joinedClass.name}</strong>.
          </p>
        )}
        {joinedClass?.error && (
          <p className="text-sm text-destructive">
            We couldn&rsquo;t add you to {joinedClass.name}: {joinedClass.error}
          </p>
        )}
        <Link
          href="/login"
          className="inline-block mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4 py-4">
      <div className="text-4xl">❌</div>
      <h1 className="text-2xl font-bold tracking-tight">Verification failed</h1>
      <p className="text-muted-foreground">{errorMessage}</p>
      <Link
        href="/register"
        className="inline-block mt-4 text-sm text-primary hover:underline"
      >
        Back to registration
      </Link>
    </div>
  );
}
