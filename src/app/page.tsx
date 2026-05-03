import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container max-w-3xl py-24">
        <p className="font-medium uppercase tracking-widest text-primary">
          Network Nerd
        </p>
        <h1 className="mt-3 text-5xl font-bold tracking-tight">
          Learn Wireshark by doing.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Sign up for a class, work through ordered modules, and get instant
          feedback on every answer.
        </p>
        <div className="mt-10 flex gap-3">
          <Button asChild size="lg">
            <Link href="/register">Create an account</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
