import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { useTranslation } from 'react-i18next';
import { signInWithEmailAndPassword, type AuthError } from 'firebase/auth';
import { auth } from '@/modules/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

type TLoginForm = z.infer<typeof loginSchema>;

const INVALID_CREDENTIAL_CODES = new Set([
  'auth/invalid-credential',
  'auth/invalid-login-credentials',
  'auth/wrong-password',
  'auth/user-not-found',
  'auth/invalid-email',
]);

export const LoginPage = () => {
  const { t } = useTranslation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TLoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: TLoginForm) => {
    setServerError(null);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
    } catch (err) {
      const code = (err as AuthError).code;
      if (INVALID_CREDENTIAL_CODES.has(code)) {
        setServerError(t('auth.login.invalidCredentials'));
      } else {
        setServerError(t('auth.login.genericError'));
      }
    }
  };

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t('auth.login.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-4"
          >
            <div className="space-y-1">
              <Label htmlFor="email">{t('auth.login.emailLabel')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('auth.login.emailPlaceholder')}
                autoComplete="email"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">{t('auth.login.passwordLabel')}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t('auth.login.passwordPlaceholder')}
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
            </div>
            {serverError && (
              <p className="text-sm text-destructive">{serverError}</p>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting
                ? t('auth.login.submittingButton')
                : t('auth.login.submitButton')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
