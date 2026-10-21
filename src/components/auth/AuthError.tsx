import { useAuthStore } from '@/stores/authStore';

export function AuthError() {
  const error = useAuthStore((state) => state.error);
  const errorCode = useAuthStore((state) => state.errorCode);
  const requestId = useAuthStore((state) => state.errorRequestId);

  if (!error) {
    return null;
  }

  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      <p>{error}</p>
      {errorCode ? (
        <p className="mt-1 font-mono text-[11px] text-red-500">
          {errorCode}
          {requestId ? ` · requestId: ${requestId}` : ''}
        </p>
      ) : null}
    </div>
  );
}
