import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { PhaseBadge } from '@/components/common/PhaseBadge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';

const phases = [
  { id: 'W1', label: '工程骨架', state: '已完成' },
  { id: 'W2', label: '登录 / 注册', state: '进行中' },
  { id: 'W3', label: 'API 客户端 + 单飞刷新', state: '待确认' },
  { id: 'W4', label: '会话列表', state: '待开始' },
  { id: 'W5', label: '聊天页', state: '待开始' },
  { id: 'W6', label: 'WebSocket', state: '待开始' },
];

export function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const displayName = user?.displayName ?? user?.username ?? '用户';

  const handleLogout = async () => {
    await logout();
    toast.success('已退出登录');
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <header className="flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4">
        <div>
          <h1 className="text-sm font-semibold text-slate-900">设置</h1>
          <p className="text-xs text-slate-500">项目状态与阶段进度</p>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-4 p-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">当前环境</h2>
            <PhaseBadge phase="W1" />
          </div>
          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">API 基址</dt>
              <dd className="font-mono text-xs text-slate-700">
                {import.meta.env.VITE_API_BASE_URL ?? '/api'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">WebSocket 路径</dt>
              <dd className="font-mono text-xs text-slate-700">
                {import.meta.env.VITE_SOCKET_PATH ?? '/socket.io'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">构建模式</dt>
              <dd className="font-mono text-xs text-slate-700">{import.meta.env.MODE}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">阶段进度</h2>
          <ul className="mt-3 divide-y divide-slate-100">
            {phases.map((phase) => (
              <li key={phase.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-700">
                  <span className="mr-2 font-mono text-xs text-slate-400">{phase.id}</span>
                  {phase.label}
                </span>
                <span className="text-xs text-slate-500">{phase.state}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">账号</h2>
            <PhaseBadge phase="W2" />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
              {displayName.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <p className="text-sm font-medium text-slate-900">{displayName}</p>
              <p className="text-xs text-slate-500">@{user?.username ?? '—'}</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="button" variant="outline" onClick={handleLogout}>
              退出登录
            </Button>
            <Link
              to="/chat"
              className="inline-flex h-8 items-center rounded-lg border border-slate-200 px-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              回到聊天
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
