import appConfig from "../config/appConfig";
import { diffInDays, parseDate } from "./dateUtils";
import { getBorrowId, getMemberId, pickFieldValue, recordMatchesMember } from "./entityMappers";

export function calculateFineForBorrow(borrow, perDay = appConfig.finePerDay) {
  const dueDate = parseDate(pickFieldValue(borrow, ["dueDate", "due_date", "returnDueDate"]));
  if (!dueDate) {
    return { overdueDays: 0, amount: 0 };
  }

  const returnDate = parseDate(pickFieldValue(borrow, ["returnDate", "returnedAt"]));
  const endDate = returnDate || new Date();
  const overdueDays = Math.max(0, diffInDays(dueDate, endDate));
  const amount = Number((overdueDays * perDay).toFixed(2));

  return { overdueDays, amount };
}

export function findFineForBorrow(fines, borrowId) {
  const targetBorrowId = String(borrowId ?? "");
  return (
    (Array.isArray(fines) ? fines : []).find((fine) => String(getBorrowId(fine)) === targetBorrowId) ||
    null
  );
}

export function filterFinesForMember(fines, borrows, memberId) {
  const borrowMap = new Map(
    (Array.isArray(borrows) ? borrows : []).map((borrow) => [String(getBorrowId(borrow)), borrow])
  );

  return (Array.isArray(fines) ? fines : []).filter((fine) => {
    if (recordMatchesMember(fine, memberId)) {
      return true;
    }

    const relatedBorrow = borrowMap.get(String(getBorrowId(fine)));
    return relatedBorrow ? recordMatchesMember(relatedBorrow, memberId) : false;
  });
}

export function buildFinePayload({ borrow, memberId, amount }) {
  return {
    borrowId: getBorrowId(borrow),
    memberId: getMemberId(borrow) || memberId,
    amount,
    status: "UNPAID",
    issuedDate: new Date().toISOString().slice(0, 10),
  };
}
