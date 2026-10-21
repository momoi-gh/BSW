import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-slate-900 text-lg font-semibold text-white">
            B
          </div>
          <h1 className="text-xl font-semibold text-slate-900">BSW 聊天</h1>
          <p className="mt-1 text-sm text-slate-500">Web 端 · 后端 v0.1.0</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
