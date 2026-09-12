'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Briefcase, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

const signInSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type SignInForm = z.infer<typeof signInSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInForm) => {
    setServerError(null);
    try {
      await signIn(data.email, data.password);
      router.push('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setServerError(
        error.response?.data?.message ?? 'Invalid email or password. Please try again.',
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md mx-auto px-4 animate-fade-in">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-blue-400" />
          </div>
          <span className="text-xl font-semibold gradient-text">AI Career OS</span>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 shadow-2xl shadow-black/40">
          <h1 className="text-2xl font-bold text-foreground mb-1">Welcome back</h1>
          <p className="text-muted-foreground text-sm mb-8">
            Sign in to your career intelligence dashboard
          </p>

          {serverError && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-fade-in">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={cn(
                  'w-full px-4 py-3 rounded-xl bg-muted/60 border text-foreground placeholder:text-muted-foreground',
                  'text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all duration-200',
                  errors.email ? 'border-destructive/50' : 'border-border hover:border-border/80',
                )}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground" htmlFor="password">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className={cn(
                    'w-full px-4 py-3 pr-12 rounded-xl bg-muted/60 border text-foreground placeholder:text-muted-foreground',
                    'text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all duration-200',
                    errors.password
                      ? 'border-destructive/50'
                      : 'border-border hover:border-border/80',
                  )}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              id="signin-submit"
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm',
                'bg-blue-500 hover:bg-blue-400 text-white transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-blue-500/60',
                'disabled:opacity-60 disabled:cursor-not-allowed',
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
