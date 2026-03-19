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
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  acceptTerms: z.boolean().refine((v) => v === true, { message: "Please accept the Terms & Privacy Policy" })
});
type Form = z.infer<typeof Schema>;

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors }
  } = useForm<Form>({ resolver: zodResolver(Schema) });

  async function onSubmit(values: Form) {
    setServerError(null);
    try {
      await signup(values.name, values.email, values.password, values.acceptTerms);
      router.push("/dashboard");
    } catch (err) {
      setServerError(getApiErrorMessage(err));
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <Card>
        <h1 className="text-lg font-semibold">Create account</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Securely store your medical history and interpret reports anytime.
        </p>
        <div className="mt-2">
          <ApiStatus />
        </div>
        <form className="mt-6 space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <div className="mb-1 text-xs font-medium">Name</div>
            <Input placeholder="Your name" {...register("name")} />
            {errors.name && <div className="mt-1 text-xs text-rose-600">{errors.name.message}</div>}
          </div>
          <div>
            <div className="mb-1 text-xs font-medium">Email</div>
            <Input type="email" placeholder="you@example.com" {...register("email")} />
            {errors.email && <div className="mt-1 text-xs text-rose-600">{errors.email.message}</div>}
          </div>
          <div>
            <div className="mb-1 text-xs font-medium">Password</div>
            <Input type="password" placeholder="Minimum 8 characters" {...register("password")} />
            {errors.password && <div className="mt-1 text-xs text-rose-600">{errors.password.message}</div>}
          </div>
          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Creating…" : "Create account"}
          </Button>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-900/40">
            <label className="flex cursor-pointer items-start gap-2">
              <input className="mt-1" type="checkbox" {...register("acceptTerms")} />
              <span className="text-slate-700 dark:text-slate-200">
                I agree to the{" "}
                <Link className="text-brand-700 underline dark:text-brand-300" href="/legal/terms" target="_blank">
                  Terms
                </Link>{" "}
                and{" "}
                <Link className="text-brand-700 underline dark:text-brand-300" href="/legal/privacy" target="_blank">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            {errors.acceptTerms && <div className="mt-1 text-xs text-rose-600">{errors.acceptTerms.message}</div>}
          </div>
          {serverError && <div className="text-sm text-rose-600">{serverError}</div>}
          <div className="text-center text-sm text-slate-600 dark:text-slate-300">
            Already have an account?{" "}
            <Link className="text-brand-700 underline dark:text-brand-300" href="/auth/login">
              Login
            </Link>
          </div>
        </form>
      </Card>
    </main>
  );
}
