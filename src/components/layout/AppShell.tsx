import { LogOut, MessageSquare, Search, Settings, Users } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { toast } from 'sonner';

import { useAuthStore } from '@/stores/authStore';

const navItems = [
  { to: '/chat', label: '会话', icon: MessageSquare, end: true },
  { to: '/settings', label: '设置', icon: Settings, end: false },
] as const;

export function AppShell() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const displayName = user?.displayName ?? user?.username ?? '用户';
  const initial = displayName.slice(0, 1).toUpperCase();

  const handleLogout = async () => {
    await logout();
    toast.success('已退出登录');
  };

  return (
    <div className="flex h-dvh flex-col bg-slate-100">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <Link to="/chat" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
            B
          </span>
          <span className="text-sm font-semibold text-slate-900">BSW 聊天</span>
        </Link>
        <Link
          to="/settings"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          aria-label="设置"
        >
          <Settings className="size-5" aria-hidden="true" />
        </Link>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-80 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
          <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
              B
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">BSW 聊天</p>
              <p className="text-xs text-slate-500">Web 预览版</p>
            </div>
          </div>

          <div className="px-3 py-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400">
              <Search className="size-4" aria-hidden="true" />
              <span>搜索会话</span>
            </div>
          </div>

          <nav className="flex gap-1 px-3 pb-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                    isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100',
                  ].join(' ')
                }
              >
                <item.icon className="size-3.5" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
            <span className="flex cursor-not-allowed items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400">
              <Users className="size-3.5" aria-hidden="true" />
              联系人
            </span>
          </nav>

          <div className="min-h-0 flex-1 overflow-y-auto border-t border-slate-100 px-4 py-6">
            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center">
              <p className="text-sm font-medium text-slate-700">会话列表待接入</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                W4 接入 <code className="rounded bg-slate-100 px-1">GET /conversations</code>
                ，并解析私聊对方信息。
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                  {initial}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-700">{displayName}</p>
                  <p className="truncate text-[11px] text-slate-500">@{user?.username ?? '—'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                aria-label="退出登录"
                title="退出登录"
              >
                <LogOut className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
