import Link from "next/link";
import { Role } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";
import { findJoinableClass, type JoinableClass } from "@/features/classes/service";
import { formatJoinCode, normalizeJoinCode } from "@/features/classes/join-code";
import { JoinClassForm } from "@/components/classes/join-class-form";
import { formatDateShort } from "@/lib/utils";

export const metadata = { title: "Join a class" };

/**
 * Landing page for a class invite link: /join/ABCD2345.
 *
 * - Not logged in → shows the class and offers "Create account" (enrolls on
 *   email verification) or "Log in" (comes back here afterwards).
 * - Logged-in student → one-click Join.
 * - Already a member → link straight to the class.
 */
export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = await params;
  const code = normalizeJoinCode(decodeURIComponent(rawCode));

  let cls: JoinableClass | null = null;
  let error = "";
  try {
    cls = await findJoinableClass(code);
  } catch (err) {
    error = err instanceof Error ? err.message : "That join code isn't valid.";
  }

  if (!cls) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Can&rsquo;t join this class</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Check the link or code with your instructor.{" "}
          <Link href="/dashboard" className="text-primary hover:underline">
            Go to your dashboard
          </Link>
        </CardContent>
      </Card>
    );
  }

  const user = await getCurrentUser();
  const isMember = user
    ? !!(await prisma.classMembership.findUnique({
        where: { classId_userId: { classId: cls.id, userId: user.id } },
        select: { id: true },
      }))
    : false;
  const isFull = cls._count.memberships >= cls.capacity;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join {cls.name}</CardTitle>
        <CardDescription>
          {cls.course.title} &middot; Starts {formatDateShort(cls.startDate)}
          {cls.endDate ? ` · Ends ${formatDateShort(cls.endDate)}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Join code: <span className="font-mono tracking-wider">{formatJoinCode(code)}</span>
        </p>

        {isMember ? (
          <Button asChild className="w-full">
            <Link href={`/classes/${cls.id}`}>You&rsquo;re in this class — open it</Link>
          </Button>
        ) : isFull ? (
          <p className="text-sm text-destructive">
            This class is full. Contact your instructor.
          </p>
        ) : !user ? (
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`/register?code=${code}`}>Create an account and join</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/login?callbackUrl=${encodeURIComponent(`/join/${code}`)}`}>
                I already have an account — log in
              </Link>
            </Button>
          </div>
        ) : user.role !== Role.STUDENT ? (
          <p className="text-sm text-muted-foreground">
            You&rsquo;re logged in as {user.role.toLowerCase()}. Join codes are for student
            accounts; manage this class from the admin area.
          </p>
        ) : (
          <JoinClassForm code={code} buttonText={`Join ${cls.name}`} />
        )}
      </CardContent>
    </Card>
  );
}
