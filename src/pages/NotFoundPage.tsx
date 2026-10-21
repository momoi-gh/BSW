import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-slate-100 px-6 text-center">
      <p className="text-5xl font-semibold text-slate-300">404</p>
      <h1 className="text-lg font-semibold text-slate-900">页面不存在</h1>
      <p className="text-sm text-slate-500">链接可能已失效，或者地址输入有误。</p>
      <Link
        to="/chat"
        className="mt-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        回到聊天
      </Link>
    </div>
  );
}
