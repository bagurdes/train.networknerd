import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  // Auth.js may hand us an absolute URL; keep only the path so the form posts
  // a same-site destination (the action re-checks it).
  let next: string | undefined;
  if (callbackUrl) {
    try {
      const u = new URL(callbackUrl, "http://local");
      next = u.pathname + u.search;
    } catch {
      next = undefined;
    }
  }
  const joinCode = next?.match(/^\/join\/([^/?#]+)/)?.[1];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log in</CardTitle>
        <CardDescription>Welcome back.</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm callbackUrl={next} />
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-2 text-sm">
        <Link href="/reset" className="text-primary hover:underline">
          Forgot your password?
        </Link>
        <p className="text-muted-foreground">
          Don&rsquo;t have an account?{" "}
          <Link
            href={joinCode ? `/register?code=${encodeURIComponent(joinCode)}` : "/register"}
            className="text-primary hover:underline"
          >
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
