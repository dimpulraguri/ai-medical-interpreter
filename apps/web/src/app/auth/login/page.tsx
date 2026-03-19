"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/AuthProvider";
import { getApiErrorMessage } from "@/lib/errors";
import { ApiStatus } from "@/components/ApiStatus";

const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});
type Form = z.infer<typeof Schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors }
  } = useForm<Form>({ resolver: zodResolver(Schema) });

  async function onSubmit(values: Form) {
    setServerError(null);
    try {
      await login(values.email, values.password);
      router.push("/dashboard");
    } catch (err) {
      setServerError(getApiErrorMessage(err));
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <Card>
        <h1 className="text-lg font-semibold">Login</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Welcome back. Your health dashboard awaits.</p>
        <div className="mt-2">
          <ApiStatus />
        </div>
        <form className="mt-6 space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <div className="mb-1 text-xs font-medium">Email</div>
            <Input type="email" placeholder="you@example.com" {...register("email")} />
            {errors.email && <div className="mt-1 text-xs text-rose-600">{errors.email.message}</div>}
          </div>
          <div>
            <div className="mb-1 text-xs font-medium">Password</div>
            <Input type="password" placeholder="********" {...register("password")} />
            {errors.password && <div className="mt-1 text-xs text-rose-600">{errors.password.message}</div>}
          </div>
          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
          {serverError && <div className="text-sm text-rose-600">{serverError}</div>}
          <div className="text-center text-sm text-slate-600 dark:text-slate-300">
            New here?{" "}
            <Link className="text-brand-700 underline dark:text-brand-300" href="/auth/signup">
              Create an account
            </Link>
          </div>
        </form>
      </Card>
    </main>
  );
}
