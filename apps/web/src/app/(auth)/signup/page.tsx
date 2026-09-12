'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Briefcase, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

const signUpSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
    email: z.string().email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignUpForm = z.infer<typeof signUpSchema>;

const passwordRequirements = [
  { label: '8+ characters', regex: /.{8,}/ },
  { label: 'Uppercase letter', regex: /[A-Z]/ },
  { label: 'Number', regex: /[0-9]/ },
];

export default function SignUpPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
  });

  const password = watch('password', '');

  const onSubmit = async (data: SignUpForm) => {
    setServerError(null);
    try {
      await signUp({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });
      router.push('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setServerError(
        error.response?.data?.message ?? 'Something went wrong. Please try again.',
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-10">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-500/5 blur-3xl" />
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
          <h1 className="text-2xl font-bold text-foreground mb-1">Create your account</h1>
          <p className="text-muted-foreground text-sm mb-8">
            Start your AI-powered career journey for free
          </p>

          {serverError && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-fade-in">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="firstName">
                  First name
                </label>
                <input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  placeholder="John"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl bg-muted/60 border text-foreground placeholder:text-muted-foreground',
                    'text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all duration-200',
                    errors.firstName ? 'border-destructive/50' : 'border-border',
                  )}
                  {...register('firstName')}
                />
                {errors.firstName && (
                  <p className="text-xs text-destructive">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="lastName">
                  Last name
                </label>
                <input
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Doe"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl bg-muted/60 border text-foreground placeholder:text-muted-foreground',
                    'text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all duration-200',
                    errors.lastName ? 'border-destructive/50' : 'border-border',
                  )}
                  {...register('lastName')}
                />
                {errors.lastName && (
                  <p className="text-xs text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="signup-email">
                Email address
              </label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={cn(
                  'w-full px-4 py-3 rounded-xl bg-muted/60 border text-foreground placeholder:text-muted-foreground',
                  'text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all duration-200',
                  errors.email ? 'border-destructive/50' : 'border-border',
                )}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="signup-password">
                Password
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  className={cn(
                    'w-full px-4 py-3 pr-12 rounded-xl bg-muted/60 border text-foreground placeholder:text-muted-foreground',
                    'text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all duration-200',
                    errors.password ? 'border-destructive/50' : 'border-border',
                  )}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Password requirements */}
              {password && (
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {passwordRequirements.map((req) => (
                    <div
                      key={req.label}
                      className={cn(
                        'flex items-center gap-1 text-xs transition-colors',
                        req.regex.test(password) ? 'text-green-400' : 'text-muted-foreground',
                      )}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {req.label}
                    </div>
                  ))}
                </div>
              )}
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="confirm-password">
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat your password"
                className={cn(
                  'w-full px-4 py-3 rounded-xl bg-muted/60 border text-foreground placeholder:text-muted-foreground',
                  'text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all duration-200',
                  errors.confirmPassword ? 'border-destructive/50' : 'border-border',
                )}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              id="signup-submit"
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm mt-2',
                'bg-blue-500 hover:bg-blue-400 text-white transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-blue-500/60',
                'disabled:opacity-60 disabled:cursor-not-allowed',
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By creating an account you agree to our{' '}
            <Link href="/terms" className="text-blue-400 hover:text-blue-300">Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-blue-400 hover:text-blue-300">Privacy Policy</Link>
          </p>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
