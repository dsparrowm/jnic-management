import { Prisma } from "@repo/database";
import { ReportStatus } from "@repo/types";
import { formatReportDate } from "@repo/types";

type WeeklyReportWithRelations = Prisma.WeeklyReportGetPayload<{
  include: {
    branch: { select: { id: true; name: true } };
    submittedBy: { select: { id: true; name: true; email: true } };
    attendance: true;
    finance: true;
  };
}>;

function decimalToNumber(value: Prisma.Decimal): number {
  return Number(value);
}

export function toWeeklyReportView(
  report: WeeklyReportWithRelations,
  options?: { editableForUserId?: string },
) {
  const editable =
    report.status === ReportStatus.SUBMITTED &&
    options?.editableForUserId === report.submittedById;

  return {
    id: report.id,
    branchId: report.branchId,
    serviceDate: formatReportDate(report.serviceDate),
    weekOf: formatReportDate(report.weekOf),
    status: report.status,
    submittedById: report.submittedById,
    branch: { id: report.branch.id, name: report.branch.name },
    submittedBy: report.submittedBy,
    attendance: report.attendance
      ? {
          adultCount: report.attendance.adultCount,
          teenageCount: report.attendance.teenageCount,
          childrenCount: report.attendance.childrenCount,
        }
      : null,
    finance: report.finance
      ? {
          tithe: decimalToNumber(report.finance.tithe),
          offering: decimalToNumber(report.finance.offering),
          other: decimalToNumber(report.finance.other),
          currency: report.finance.currency,
        }
      : null,
    editable,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };
}

export const weeklyReportInclude = {
  branch: {
    select: {
      id: true,
      name: true,
      zoneId: true,
      zone: { select: { id: true, name: true, stateId: true } },
    },
  },
  submittedBy: { select: { id: true, name: true, email: true } },
  attendance: true,
  finance: true,
} as const;
