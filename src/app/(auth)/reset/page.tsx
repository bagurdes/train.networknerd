import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RequestResetForm } from "./request-form";

export const metadata = { title: "Reset password" };

export default function RequestResetPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>
          Enter your email and we&rsquo;ll send you a link to choose a new
          password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RequestResetForm />
      </CardContent>
      <CardFooter className="text-sm">
        <Link href="/login" className="text-primary hover:underline">
          Back to log in
        </Link>
      </CardFooter>
    </Card>
  );
}
