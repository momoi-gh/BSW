import { ArrowLeft, MessageSquare } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { EmptyState } from '@/components/common/EmptyState';
import { PhaseBadge } from '@/components/common/PhaseBadge';

export function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();

  if (!conversationId) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="选择一个会话"
        description="会话列表将在 W4 接入；聊天页会在 W5 支持历史分页与发送。"
      >
        <Link
          to="/settings"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          查看项目状态
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4">
        <Link
          to="/chat"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="返回会话列表"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-900">会话详情</p>
            <PhaseBadge phase="W5" />
          </div>
          <p className="truncate font-mono text-xs text-slate-500">{conversationId}</p>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4">
        <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
          <p className="text-sm font-medium text-slate-700">消息区域待接入</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            历史分页（<code className="rounded bg-slate-100 px-1">before/nextBefore</code>
            ）、乐观发送与删除将在 W5 实现。
          </p>
        </div>
      </div>

      <footer className="shrink-0 border-t border-slate-200 bg-white p-3">
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <textarea
            disabled
            rows={1}
            placeholder="消息输入框（W5 接入）"
            className="min-h-10 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400"
          />
          <button
            type="button"
            disabled
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white opacity-50"
          >
            发送
          </button>
        </div>
      </footer>
    </div>
  );
}
