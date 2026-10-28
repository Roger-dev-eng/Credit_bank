import { CheckCircle2 } from "lucide-react";

export function Notificacao({ children }: { children: React.ReactNode }) {
  return (
    <div className="notification-success" role="status" aria-live="polite">
      <CheckCircle2 size={19} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
