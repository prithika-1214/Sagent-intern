import { getValue, normalizeArray } from './entity';

export const LOYALTY_POINTS_PER_BOOKING = 10;
export const LOYALTY_REDEMPTION_BLOCK_POINTS = 10;
export const LOYALTY_REDEMPTION_BLOCK_DISCOUNT = 5;
export const LOYALTY_POINTS_PER_RUPEE = LOYALTY_REDEMPTION_BLOCK_POINTS / LOYALTY_REDEMPTION_BLOCK_DISCOUNT;

const NON_ELIGIBLE_BOOKING_STATUSES = new Set(['CANCELLED']);
const NON_ELIGIBLE_PAYMENT_STATUSES = new Set(['REFUNDED', 'FAILED', 'CANCELLED']);

const normalizeId = (value) => String(value ?? '').trim();

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getLoyaltyDiscount = (availablePoints = 0, subtotal = 0) => {
  const normalizedPoints = Math.max(0, toNumber(availablePoints));
  const normalizedSubtotal = Math.max(0, toNumber(subtotal));
  const maxDiscountByPoints =
    Math.floor(normalizedPoints / LOYALTY_REDEMPTION_BLOCK_POINTS) * LOYALTY_REDEMPTION_BLOCK_DISCOUNT;
  return Math.min(normalizedSubtotal, maxDiscountByPoints);
};

export const getPointsForDiscount = (discountAmount = 0, availablePoints = Number.POSITIVE_INFINITY) => {
  const pointsRequired = Math.max(0, Math.round(toNumber(discountAmount) * LOYALTY_POINTS_PER_RUPEE));
  const pointsCap = toNumber(availablePoints);

  if (!Number.isFinite(Number(availablePoints))) {
    return pointsRequired;
  }

  return Math.min(pointsRequired, Math.max(0, pointsCap));
};

export const calculateUserLoyalty = ({ bookings = [], payments = [], userId }) => {
  const normalizedUserId = normalizeId(userId);
  if (!normalizedUserId) {
    return {
      bookingCount: 0,
      earnedPoints: 0,
      redeemedPoints: 0,
      availablePoints: 0,
      redeemedDiscount: 0
    };
  }

  const eligibleBookings = normalizeArray(bookings).filter((booking) => {
    const bookingUserId = normalizeId(getValue(booking, ['user_id', 'userId']));
    const bookingStatus = String(getValue(booking, ['booking_status', 'bookingStatus'], '')).toUpperCase();
    return bookingUserId === normalizedUserId && !NON_ELIGIBLE_BOOKING_STATUSES.has(bookingStatus);
  });

  const eligibleBookingIds = new Set(
    eligibleBookings
      .map((booking) => normalizeId(getValue(booking, ['booking_id', 'bookingId', 'id'])))
      .filter(Boolean)
  );

  const redeemedDiscount = normalizeArray(payments).reduce((sum, payment) => {
    const bookingId = normalizeId(getValue(payment, ['booking_id', 'bookingId']));
    if (!eligibleBookingIds.has(bookingId)) {
      return sum;
    }

    const paymentStatus = String(getValue(payment, ['payment_status', 'paymentStatus'], '')).toUpperCase();
    if (NON_ELIGIBLE_PAYMENT_STATUSES.has(paymentStatus)) {
      return sum;
    }

    return sum + toNumber(getValue(payment, ['discount_amount', 'discountAmount'], 0));
  }, 0);

  const bookingCount = eligibleBookings.length;
  const earnedPoints = bookingCount * LOYALTY_POINTS_PER_BOOKING;
  const redeemedPoints = getPointsForDiscount(redeemedDiscount);
  const availablePoints = Math.max(0, earnedPoints - redeemedPoints);

  return {
    bookingCount,
    earnedPoints,
    redeemedPoints,
    availablePoints,
    redeemedDiscount
  };
};
