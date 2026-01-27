import { SignUpForm } from "@/components/auth/sign-up-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Suspense } from "react";

function SignUpFallback() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Sign up</CardTitle>
        <CardDescription>Create a new account</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          <div className="grid gap-2">
            <div className="h-4 w-14 rounded bg-muted" />
            <div className="h-10 w-full rounded-md bg-muted" />
          </div>
          <div className="grid gap-2">
            <div className="h-4 w-20 rounded bg-muted" />
            <div className="h-10 w-full rounded-md bg-muted" />
          </div>
          <div className="grid gap-2">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-10 w-full rounded-md bg-muted" />
          </div>
          <div className="h-10 w-full rounded-md bg-muted" />
          <div className="mt-4 h-4 w-48 rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense fallback={<SignUpFallback />}>
          <SignUpForm />
        </Suspense>
      </div>
    </div>
  );
}
