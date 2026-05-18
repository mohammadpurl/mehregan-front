'use client';
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Eye, EyeOff, Scale } from "lucide-react";
import Link from "next/link";
import { Suspense, useMemo, useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { signinAction } from "@/app/_actions/auth-actions";
import { useSessionStore } from "@/app/_store/auth-store";
import { useNotificationStore } from "@/app/_store/notification.store";

import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { SignInSchema } from "@/app/(auth)/_types/auth.schema";
import type { InferOutput } from "valibot";

function LoginFormContent() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const updateSession = useSessionStore(state => state.updateSession);
  const [showPassword, setShowPassword] = useState(false);

  type SignInValues = InferOutput<typeof SignInSchema>;
  // const [formState, action] = useFormState(signinAction, null);


  const showNotification = useNotificationStore(
    (state) => state.showNotification
);

  const form = useForm<SignInValues>({
    resolver: valibotResolver(SignInSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // 294535756 156000000 17/1/1405
  // 294535756 110000000 11/1/1405
  //294472976 161700000 3/1/1405
  

  const isDisabled = useMemo(() => isPending, [isPending]);

  const onSubmit = (values: SignInValues) => {
    startTransition(async () => {
      try {
        const result = await signinAction(values);
        console.log("login result",result)
        if (result?.success) {
          await updateSession();
          showNotification({
            message: "ورود موفقیت آمیز",
            type: "info",
        });
          const raw = searchParams.get("callbackUrl");
          const safe =
            raw && raw.startsWith("/") && !raw.startsWith("//")
              ? raw
              : "/dashboard";
          router.push(safe);
          return;
        }
        showNotification({
          message: "خطا در ورود",
          type: "error",
      });

        // toast({
        //   title: "خطا",
        //   description: result?.error || "نام کاربری یا رمز عبور اشتباه است",
        //   variant: "destructive",
        // });
      } catch (error: unknown) {
        console.log("login error ", error)
        toast({
          title: "خطا",
          description: error instanceof Error ? error.message : "خطا در ورود",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="flex h-dvh items-center justify-center overflow-y-auto p-4 bg-linear-to-br from-background via-background to-muted/20 shadow-2xl">
     {/* <div className="flex flex-col xl:fixed xl:left-1/2 xl:-translate-x-1/2 xl:top-1/2 xl:-translate-y-1/2 fade-in items-center container  xl:max-w-[500px] self-stretch xl:bg-secondary-870 xl:p-8 xl:rounded-lg xl:shadow-xl xl:shadow-black/5"> */}
      <Card className="w-full max-w-md border-none">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center">
            <Scale className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">ورود به رهیار </CardTitle>
          <CardDescription>
            ورود با نام کاربری و رمز عبور
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">نام کاربری</Label>
              <Input
                id="username"
                placeholder="username"
                autoComplete="username"
                disabled={isDisabled}
                {...form.register("username")}
              />
              {form.formState.errors.username?.message && (
                <p className="text-sm text-destructive">{String(form.formState.errors.username.message)}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">رمز عبور</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  autoComplete="current-password"
                  disabled={isDisabled}
                  className="pl-10"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((s) => !s)}
                  disabled={isDisabled}
                  aria-label={showPassword ? "مخفی کردن رمز عبور" : "نمایش رمز عبور"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.password?.message && (
                <p className="text-sm text-destructive">{String(form.formState.errors.password.message)}</p>
              )}
            </div>

            <Button type="submit" className="w-full bg-primary" disabled={isDisabled}>
              {isPending ? "در حال ورود..." : "ورود"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">حساب کاربری ندارید؟ </span>
            <Link href="/register" className="text-blue-600 hover:underline font-medium">
              ثبت‌نام کنید
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center p-4 text-sm text-muted-foreground">
          در حال بارگذاری...
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
