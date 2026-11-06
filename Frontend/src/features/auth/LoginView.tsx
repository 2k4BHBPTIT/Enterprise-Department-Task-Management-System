import React, { useRef, useState } from 'react';
import { ArrowRight, Building2, CheckCircle2, Eye, EyeOff, LoaderCircle, LockKeyhole, LogIn, Mail, ShieldCheck } from 'lucide-react';
import { authApi } from '../../services/api/auth.api';
import { useAuthStore } from '../../store/auth.store';
import { Role, User } from '../../types';

interface LoginViewProps {
  onLoggedIn: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoggedIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const login = await authApi.login(email.trim(), password);
      localStorage.setItem('accessToken', login.accessToken || login.token || '');
      const user: User = {
        id: login.userId,
        full_name: login.fullName,
        name: login.fullName,
        email: login.email,
        department_id: login.departmentId ?? 0,
        departmentId: login.departmentId ?? 0,
        system_role: login.systemRole as Role,
        role: login.systemRole as Role,
        status: 'ACTIVE',
      };
      setCurrentUser(user);
      onLoggedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Email hoặc mật khẩu không đúng');
      window.requestAnimationFrame(() => errorRef.current?.focus());
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#eef4ff] font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-300/25 blur-3xl motion-safe:animate-pulse" aria-hidden="true" />
      <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-indigo-300/20 blur-3xl motion-safe:animate-pulse" aria-hidden="true" />

      <div className="relative grid min-h-screen lg:grid-cols-[minmax(0,1.08fr)_minmax(440px,0.92fr)]">
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#0b2e6f] via-[#164ea3] to-[#2878d7] lg:flex lg:flex-col lg:justify-between lg:p-14 xl:p-16">
          <div className="absolute inset-0 opacity-[0.09]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} aria-hidden="true" />
          <div className="relative flex items-center gap-3 text-white">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur">
              <Building2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-bold tracking-tight">Enterprise Task</p>
              <p className="text-xs text-blue-100">Management Workspace</p>
            </div>
          </div>

          <div className="relative max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-50 backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Không gian làm việc an toàn
            </span>
            <h2 className="mt-6 text-4xl font-bold leading-tight text-white xl:text-5xl">
              Một nơi để đội ngũ cùng tiến nhanh hơn.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-blue-100/90">
              Theo dõi dự án, phân công công việc và kết nối mọi phòng ban trong một quy trình thống nhất.
            </p>
            <div className="mt-8 grid max-w-md grid-cols-2 gap-3">
              {['Quản lý dự án', 'Theo dõi tiến độ', 'Cập nhật tự động', 'Hiệu suất nhân sự'].map((item) => (
                <div key={item} className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.08] px-3.5 py-3 text-sm text-blue-50 backdrop-blur">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-300" aria-hidden="true" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <p className="relative text-xs text-blue-200/70">Enterprise Work & Project Management Platform</p>
        </section>

        <section className="flex items-center justify-center bg-white/70 px-5 py-10 backdrop-blur-sm sm:px-10 lg:bg-white lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-9 flex items-center gap-3 lg:hidden">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                <Building2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="font-bold text-slate-800">Enterprise Task</span>
            </div>

            <form onSubmit={submit} className="space-y-6 animate-fade-in motion-reduce:animate-none" aria-label="Đăng nhập hệ thống">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <LockKeyhole className="h-5 w-5" aria-hidden="true" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Chào mừng trở lại</h1>
                <p className="mt-2 text-sm text-slate-500">Đăng nhập để tiếp tục vào không gian làm việc.</p>
              </div>

              {error && (
                <div ref={errorRef} tabIndex={-1} role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 outline-none focus:ring-2 focus:ring-red-300">
                  {error}
                </div>
              )}

              <div className="space-y-5">
                <label htmlFor="login-email" className="block text-sm font-semibold text-slate-700">
                  Email công ty
                  <div className="relative mt-2">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" aria-hidden="true" />
                    <input
                      id="login-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      autoComplete="username"
                      required
                      placeholder="ten@congty.com"
                      className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </label>

                <label htmlFor="login-password" className="block text-sm font-semibold text-slate-700">
                  Mật khẩu
                  <div className="relative mt-2">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" aria-hidden="true" />
                    <input
                      id="login-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      placeholder="Nhập mật khẩu"
                      className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-12 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      aria-pressed={showPassword}
                      className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </div>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-200 disabled:pointer-events-none disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                {loading ? (
                  <>
                    <LoaderCircle className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
                    Đang đăng nhập...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" aria-hidden="true" />
                    Đăng nhập
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transform-none" aria-hidden="true" />
                  </>
                )}
              </button>

              <p className="text-center text-xs leading-5 text-slate-400">
                Phiên làm việc được bảo vệ bằng mã hóa và xác thực tài khoản.
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
};
