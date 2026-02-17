import appConfig from "../config/appConfig";
import { diffInDays, parseDate } from "./dateUtils";
import { getBorrowId, getStatus, pickFieldValue, recordMatchesMember } from "./entityMappers";
import { filterFinesForMember } from "./fineUtils";

export function buildMemberNotifications({ memberId, borrows, fines, daysAhead = appConfig.dueSoonDays }) {
  const notifications = [];

  (Array.isArray(borrows) ? borrows : []).forEach((borrow) => {
    if (!recordMatchesMember(borrow, memberId)) {
      return;
    }

    const dueDateValue = pickFieldValue(borrow, ["dueDate", "due_date", "returnDueDate"]);
    const dueDate = parseDate(dueDateValue);
    if (!dueDate) {
      return;
    }

    const hasReturnDate = Boolean(pickFieldValue(borrow, ["returnDate", "returnedAt"]));
    if (hasReturnDate) {
      return;
    }

    const days = diffInDays(new Date(), dueDate);
    if (days < 0) {
      notifications.push({
        id: `overdue-${getBorrowId(borrow)}`,
        severity: "error",
        title: "Overdue borrow",
        description: `Borrow #${getBorrowId(borrow)} is overdue by ${Math.abs(days)} day(s).`,
      });
      return;
    }

    if (days <= daysAhead) {
      notifications.push({
        id: `due-soon-${getBorrowId(borrow)}`,
        severity: "warning",
        title: "Due soon",
        description: `Borrow #${getBorrowId(borrow)} is due in ${days} day(s).`,
      });
    }
  });

  const myFines = filterFinesForMember(fines, borrows, memberId);
  myFines.forEach((fine) => {
    const status = String(getStatus(fine) || "").toLowerCase();
    if (status === "paid") {
      return;
    }

    notifications.push({
      id: `fine-${fine.id ?? Math.random()}`,
      severity: "info",
      title: "Outstanding fine",
      description: `Fine #${fine.id ?? "N/A"} has amount ${fine.amount ?? 0}.`,
    });
  });

  return notifications;
}
