import { statusLabel } from "../../utils/format";
export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={"badge " + status}>{statusLabel[status] || status}</span>
  );
}
