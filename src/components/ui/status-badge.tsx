import { cn } from "@/lib/utils";
import { PolicyStatus } from "@/types";

interface StatusBadgeProps {
  status: PolicyStatus;
  size?: 'default' | 'sm';
  className?: string;
}

const statusStyles: Record<PolicyStatus, string> = {
  active: "bg-green-100 text-green-800 border-green-300",
  "expiring-soon": "bg-yellow-100 text-yellow-800 border-yellow-300",
  expired: "bg-red-100 text-red-800 border-red-300",
  missing: "bg-gray-100 text-gray-800 border-gray-300",
};

const statusLabels: Record<PolicyStatus, string> = {
  active: "Active",
  "expiring-soon": "Expiring Soon",
  expired: "Expired",
  missing: "Missing",
};

export function StatusBadge({ status, size = 'default', className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-1 font-medium",
        size === 'sm' ? 'text-xs' : 'text-xs',
        statusStyles[status],
        className
      )}
    >
      {statusLabels[status]}
    </span>
  );
}