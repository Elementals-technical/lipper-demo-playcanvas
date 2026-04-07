import { useMemo } from 'react';
import { useDatatableParts, DatatablePart } from './useDatatableParts';

export type NotificationItem = DatatablePart & {
  maintenanceInterval: string;
  maintenanceTask: string;
  commonIssues: string;
};

export function useNotifications() {
  const { parts, isLoading, error } = useDatatableParts();

  const notifications = useMemo<NotificationItem[]>(
    () =>
      parts
        .filter((p) => p.maintenance)
        .map((p) => ({
          ...p,
          maintenanceInterval: p.maintenance!.interval,
          maintenanceTask: p.maintenance!.task,
          commonIssues: p.maintenance!.commonIssues,
        })),
    [parts],
  );

  return { notifications, isLoading, error };
}
