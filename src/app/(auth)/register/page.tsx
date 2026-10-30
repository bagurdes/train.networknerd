import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RegisterForm } from "./register-form";
import { findJoinableClass, type JoinableClass } from "@/features/classes/service";
import { formatJoinCode, normalizeJoinCode } from "@/features/classes/join-code";

export const metadata = { title: "Sign up" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  // Arrived from a class join link: show which class they're signing up for.
  let joinClass: JoinableClass | null = null;
  let joinError = "";
  if (code) {
    try {
      joinClass = await findJoinableClass(code);
    } catch (err) {
      joinError = err instanceof Error ? err.message : "That join code isn't valid.";
    }
  }
  const joinCode = joinClass && code ? normalizeJoinCode(code) : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>
          {joinClass ? (
            <>
              Sign up to join <strong>{joinClass.name}</strong> ({joinClass.course.title}).
              You&rsquo;ll be added to the class when you verify your email.
            </>
          ) : (
            "Sign up as a student. If your instructor gave you a join code, you can enter it on your dashboard after you log in."
          )}
        </CardDescription>
        {joinError && (
          <p className="text-sm text-destructive">
            Join code {formatJoinCode(normalizeJoinCode(code ?? ""))}: {joinError} You can still
            create an account and enter a new code later.
          </p>
        )}
      </CardHeader>
      <CardContent>
        <RegisterForm joinCode={joinCode} />
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="ml-1 text-primary hover:underline">
          Log in
        </Link>
      </CardFooter>
    </Card>
  );
}
