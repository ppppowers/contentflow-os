export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-lg font-semibold tracking-tight">ContentFlow OS</h1>
          <p className="text-sm text-neutral-500">Content agency operating system</p>
        </div>
        {children}
      </div>
    </div>
  );
}
