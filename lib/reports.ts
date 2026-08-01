export type ReportPeriod = 'today' | 'week' | 'month' | 'year' | 'custom';

export function getPeriodRange(
  period: ReportPeriod,
  customFrom?: string,
  customTo?: string
): { from: Date; to: Date; label: string } {
  const now = new Date();
  let from: Date;
  let to: Date;
  let label: string;

  switch (period) {
    case 'today': {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      label = 'Today';
      break;
    }
    case 'week': {
      const day = now.getDay(); // 0 = Sunday
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
      to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 6, 23, 59, 59, 999);
      label = 'This Week';
      break;
    }
    case 'month': {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      label = 'This Month';
      break;
    }
    case 'year': {
      from = new Date(now.getFullYear(), 0, 1);
      to = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      label = 'This Year';
      break;
    }
    case 'custom':
    default: {
      from = customFrom ? new Date(customFrom + 'T00:00:00') : new Date(now.getFullYear(), now.getMonth(), now.getDate());
      to = customTo ? new Date(customTo + 'T23:59:59.999') : new Date(now);
      label = 'Custom Range';
      break;
    }
  }

  return { from, to, label };
}

export function formatDateInput(d: Date): string {
  return d.toISOString().split('T')[0];
}
