import { cn } from "@/lib/utils/format";

// Minimal Card primitive — ShadCN-compatible API so it can be swapped later.
export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-xl border border-neutral-200 bg-white shadow-sm", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("border-b border-neutral-100 px-5 py-3", className)}>{children}</div>;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-neutral-800">{children}</h3>;
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}
