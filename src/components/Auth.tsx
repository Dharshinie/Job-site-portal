import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Briefcase, Shield } from 'lucide-react';

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'job_seeker' | 'recruiter' | 'admin'>('job_seeker');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, fullName, role);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = (nextLoginState: boolean) => {
    setIsLogin(nextLoginState);
    setEmail('');
    setPassword('');
    setFullName('');
    setRole('job_seeker');
    setError('');
  };

  const authTitle = isLogin
    ? role === 'admin'
      ? 'Admin Login'
      : 'Welcome Back'
    : role === 'admin'
      ? 'Create Admin Account'
      : 'Create Account';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
        <div className="flex items-center justify-center mb-8">
          {role === 'admin' ? (
            <Shield className="w-10 h-10 text-red-600 mr-2" />
          ) : (
            <Briefcase className="w-10 h-10 text-blue-600 mr-2" />
          )}
          <h1 className="text-3xl font-bold text-gray-900">
            {role === 'admin' ? 'Admin Portal' : 'JobPortal'}
          </h1>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6">
          <button
            type="button"
            onClick={() => setRole('job_seeker')}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              role === 'job_seeker'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Job Seeker
          </button>
          <button
            type="button"
            onClick={() => setRole('recruiter')}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              role === 'recruiter'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Recruiter
          </button>
          <button
            type="button"
            onClick={() => setRole('admin')}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              role === 'admin'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Admin
          </button>
        </div>

        <h2 className="text-2xl font-semibold text-center mb-2">{authTitle}</h2>
        <p className="text-center text-sm text-gray-500 mb-6">
          {isLogin
            ? role === 'admin'
              ? 'Sign in to access the admin dashboard.'
              : 'Sign in to continue to your dashboard.'
            : role === 'admin'
              ? 'Register a new admin account.'
              : 'Choose your role and create your account.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  I am a
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'job_seeker' | 'recruiter' | 'admin')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="job_seeker">Job Seeker</option>
                  <option value="recruiter">Recruiter</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
          >
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-600">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => resetForm(!isLogin)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}
