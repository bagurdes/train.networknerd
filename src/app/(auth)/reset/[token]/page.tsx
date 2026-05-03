import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmResetForm } from "./confirm-form";

export const metadata = { title: "Choose a new password" };

export default async function ConfirmResetPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose a new password</CardTitle>
        <CardDescription>
          Pick something at least 10 characters long. You&rsquo;ll be logged in
          on the next screen with your new password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ConfirmResetForm token={token} />
      </CardContent>
      <CardFooter className="text-sm">
        <Link href="/login" className="text-primary hover:underline">
          Back to log in
        </Link>
      </CardFooter>
    </Card>
  );
}
