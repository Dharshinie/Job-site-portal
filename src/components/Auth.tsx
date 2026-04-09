import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Briefcase, CheckCircle2, Eye, EyeOff, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type UserRole = 'job_seeker' | 'recruiter' | 'admin';

const initialRole: UserRole = 'job_seeker';

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>(initialRole);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { signIn, signUp, resetPassword, updatePassword, isRecoveryMode } = useAuth();

  useEffect(() => {
    const savedMode = window.localStorage.getItem('auth_mode');
    const savedRole = window.localStorage.getItem('auth_role') as UserRole | null;

    if (!isRecoveryMode && savedMode) {
      setIsLogin(savedMode === 'login');
    }

    if (savedRole === 'job_seeker' || savedRole === 'recruiter' || savedRole === 'admin') {
      setRole(savedRole);
    }
  }, [isRecoveryMode]);

  useEffect(() => {
    if (!isRecoveryMode) {
      window.localStorage.setItem('auth_mode', isLogin ? 'login' : 'signup');
    }
  }, [isLogin, isRecoveryMode]);

  useEffect(() => {
    window.localStorage.setItem('auth_role', role);
  }, [role]);

  useEffect(() => {
    setError('');
    setSuccess('');
  }, [isLogin, role, isRecoveryMode, showForgotPassword]);

  const passwordChecks = useMemo(
    () => [
      { label: 'At least 8 characters', valid: password.length >= 8 },
      { label: 'One uppercase letter', valid: /[A-Z]/.test(password) },
      { label: 'One lowercase letter', valid: /[a-z]/.test(password) },
      { label: 'One number', valid: /\d/.test(password) },
    ],
    [password]
  );

  const passwordStrength = passwordChecks.filter((item) => item.valid).length;
  const passwordStrengthLabel =
    passwordStrength <= 1 ? 'Weak' : passwordStrength <= 3 ? 'Medium' : 'Strong';
  const passwordStrengthColor =
    passwordStrength <= 1
      ? 'bg-red-500'
      : passwordStrength <= 3
        ? 'bg-amber-500'
        : 'bg-emerald-500';

  const isAdmin = role === 'admin';
  const isSignup = !isLogin && !isRecoveryMode;
  const accentClasses = isAdmin
    ? {
        button: 'bg-red-600 hover:bg-red-700',
        toggle: 'bg-red-600 text-white shadow-lg shadow-red-200',
        link: 'text-red-600 hover:text-red-700',
        ring: 'focus:ring-red-500',
      }
    : {
        button: 'bg-blue-600 hover:bg-blue-700',
        toggle: 'bg-blue-600 text-white shadow-lg shadow-blue-200',
        link: 'text-blue-600 hover:text-blue-700',
        ring: 'focus:ring-blue-500',
      };

  const resetForm = (nextLoginState: boolean) => {
    setIsLogin(nextLoginState);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setRole(initialRole);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowForgotPassword(false);
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    const trimmedEmail = email.trim();
    const trimmedName = fullName.trim();

    if (!trimmedEmail) {
      return 'Email is required.';
    }

    if (isRecoveryMode) {
      if (password !== confirmPassword) {
        return 'Passwords do not match.';
      }

      if (passwordStrength < passwordChecks.length) {
        return 'Please choose a stronger password that meets all requirements.';
      }

      return '';
    }

    if (showForgotPassword) {
      return '';
    }

    if (isSignup) {
      if (trimmedName.length < 3) {
        return 'Full name should be at least 3 characters.';
      }

      if (password !== confirmPassword) {
        return 'Passwords do not match.';
      }

      if (passwordStrength < passwordChecks.length) {
        return 'Please choose a stronger password that meets all requirements.';
      }
    } else if (!password) {
      return 'Password is required.';
    }

    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    setError(validationError);
    setSuccess('');

    if (validationError) {
      return;
    }

    setLoading(true);

    try {
      if (isRecoveryMode) {
        await updatePassword(password);
        setSuccess('Your password has been updated. You can sign in with the new password now.');
        setPassword('');
        setConfirmPassword('');
        setIsLogin(true);
      } else if (showForgotPassword) {
        await resetPassword(email.trim());
        setSuccess('Password reset email sent. Open the email link to set a new password.');
      } else if (isLogin) {
        await signIn(email.trim(), password);
      } else {
        const { requiresEmailConfirmation } = await signUp(email.trim(), password, fullName.trim(), role);

        if (requiresEmailConfirmation) {
          setSuccess('Account created. Check your email to confirm your account before signing in.');
          setPassword('');
          setConfirmPassword('');
          setIsLogin(true);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const authTitle = isRecoveryMode
    ? 'Set New Password'
    : isLogin
      ? isAdmin
        ? 'Admin Login'
        : 'Welcome Back'
      : isAdmin
        ? 'Create Admin Account'
        : 'Create Account';

  const authSubtitle = isRecoveryMode
    ? 'Enter a new password to finish recovering your account.'
    : showForgotPassword
      ? 'We will send a password reset link to your email address.'
      : isLogin
        ? isAdmin
          ? 'Sign in to access the admin dashboard.'
          : 'Sign in to continue to your dashboard.'
        : isAdmin
          ? 'Register a new admin account.'
          : 'Choose your role and create your account.';

  const handleRoleChange = (nextRole: UserRole) => {
    setRole(nextRole);
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#f8fafc_45%,_#e0e7ff_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[32px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.16)] ring-1 ring-slate-200 lg:max-h-[92vh] lg:grid-cols-[0.92fr,1.08fr]">
          <div className="hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="max-w-md">
              <div className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-blue-100">
                Smart hiring and job search, in one place
              </div>
              <h1 className="mt-8 text-4xl font-bold leading-[1.05] tracking-tight">
                {isAdmin ? 'Secure admin access for your hiring workspace.' : 'Build your next career move with confidence.'}
              </h1>
              <p className="mt-5 text-base leading-7 text-slate-300">
                {isRecoveryMode
                  ? 'Password recovery is active for this session. Choose a strong new password to complete the process.'
                  : isLogin
                    ? 'Return to your dashboard faster with cleaner sign-in and recovery support.'
                    : 'Create an account with better validation, a stronger password, and a clearer onboarding flow.'}
              </p>
            </div>

            <div className="mt-10 space-y-4">
              {[
                'Real-time password checks during signup',
                'Role-aware onboarding for job seekers, recruiters, and admins',
                'Recovery flow for forgotten passwords',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="max-h-[92vh] overflow-y-auto p-6 sm:p-8 lg:p-10">
            <div className="mx-auto w-full max-w-xl">
              <div className="mb-8 flex items-center justify-center">
                {isAdmin ? (
                  <Shield className="mr-3 h-10 w-10 text-red-600" />
                ) : (
                  <Briefcase className="mr-3 h-10 w-10 text-blue-600" />
                )}
                <h1 className="text-3xl font-bold text-slate-900">
                  {isAdmin ? 'Admin Portal' : 'JobPortal'}
                </h1>
              </div>

              {!isRecoveryMode && (
                <div className="mb-6 rounded-2xl bg-slate-100 p-1.5">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleRoleChange('job_seeker')}
                      className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        role === 'job_seeker'
                          ? accentClasses.toggle
                          : 'bg-transparent text-slate-700 hover:bg-white'
                      }`}
                    >
                      Job Seeker
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleChange('recruiter')}
                      className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        role === 'recruiter'
                          ? accentClasses.toggle
                          : 'bg-transparent text-slate-700 hover:bg-white'
                      }`}
                    >
                      Recruiter
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleChange('admin')}
                      className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        role === 'admin'
                          ? accentClasses.toggle
                          : 'bg-transparent text-slate-700 hover:bg-white'
                      }`}
                    >
                      Admin
                    </button>
                  </div>
                </div>
              )}

              <div className="mb-6 text-center">
                <h2 className="text-3xl font-semibold text-slate-900">{authTitle}</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{authSubtitle}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignup && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                        className={`w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 ${accentClasses.ring}`}
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Account Type
                      </label>
                      <select
                        value={role}
                        onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                        className={`w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 ${accentClasses.ring}`}
                      >
                        <option value="job_seeker">Job Seeker</option>
                        <option value="recruiter">Recruiter</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                )}

                {!isRecoveryMode && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className={`w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 ${accentClasses.ring}`}
                      required
                    />
                  </div>
                )}

                {!showForgotPassword && (
                  <>
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <label className="block text-sm font-medium text-slate-700">
                          {isRecoveryMode ? 'New Password' : 'Password'}
                        </label>
                        {isLogin && !isRecoveryMode && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowForgotPassword(true);
                              setPassword('');
                              setConfirmPassword('');
                            }}
                            className={`text-xs font-medium ${accentClasses.link}`}
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={isRecoveryMode ? 'Create a new password' : 'Enter your password'}
                          className={`w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 focus:border-transparent focus:outline-none focus:ring-2 ${accentClasses.ring}`}
                          required={!showForgotPassword}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 hover:text-slate-700"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    {(isSignup || isRecoveryMode) && (
                      <div className="grid gap-4 lg:grid-cols-[1fr,1.02fr] lg:items-start">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">
                            Confirm Password
                          </label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Re-enter your password"
                              className={`w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 focus:border-transparent focus:outline-none focus:ring-2 ${accentClasses.ring}`}
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword((current) => !current)}
                              className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 hover:text-slate-700"
                              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                            >
                              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700">Password strength</span>
                            <span className="text-sm font-semibold text-slate-900">{passwordStrengthLabel}</span>
                          </div>
                          <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className={`h-full rounded-full transition-all ${passwordStrengthColor}`}
                              style={{ width: `${(passwordStrength / passwordChecks.length) * 100}%` }}
                            />
                          </div>
                          <div className="grid gap-2 text-sm text-slate-600">
                            {passwordChecks.map((item) => (
                              <div key={item.label} className="flex items-center gap-2">
                                <CheckCircle2
                                  className={`h-4 w-4 ${item.valid ? 'text-emerald-500' : 'text-slate-300'}`}
                                />
                                <span>{item.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {error && (
                  <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    <span>{success}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full rounded-xl py-3.5 px-4 font-medium text-white transition disabled:opacity-50 ${accentClasses.button}`}
                >
                  {loading
                    ? 'Please wait...'
                    : isRecoveryMode
                      ? 'Update Password'
                      : showForgotPassword
                        ? 'Send Reset Link'
                        : isLogin
                          ? 'Sign In'
                          : 'Sign Up'}
                </button>
              </form>

              {!isRecoveryMode && (
                <div className="mt-6 text-center text-sm text-slate-600">
                  {showForgotPassword ? (
                    <>
                      Remembered your password?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setError('');
                          setSuccess('');
                        }}
                        className={`font-medium ${accentClasses.link}`}
                      >
                        Back to sign in
                      </button>
                    </>
                  ) : (
                    <>
                      {isLogin ? "Don't have an account? " : 'Already have an account? '}
                      <button
                        type="button"
                        onClick={() => resetForm(!isLogin)}
                        className={`font-medium ${accentClasses.link}`}
                      >
                        {isLogin ? 'Sign Up' : 'Sign In'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
