import { getValue } from './entity';

export const CONVENIENCE_FEE_PER_TICKET = 12;
export const GST_PERCENTAGE = 18;

const toMoney = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.round(parsed * 100) / 100;
};

const toQuantity = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }

  return Math.floor(parsed);
};

export const buildPricingBreakdown = ({
  subtotal = 0,
  quantity = 0,
  discountAmount = 0,
  convenienceFeePerTicket = CONVENIENCE_FEE_PER_TICKET,
  gstPercentage = GST_PERCENTAGE
} = {}) => {
  const normalizedSubtotal = Math.max(0, toMoney(subtotal));
  const normalizedQuantity = toQuantity(quantity);
  const normalizedDiscount = Math.min(normalizedSubtotal, Math.max(0, toMoney(discountAmount)));
  const normalizedConvenienceFeePerTicket = Math.max(0, toMoney(convenienceFeePerTicket));
  const normalizedGstPercentage = Math.max(0, toMoney(gstPercentage));
  const convenienceFee = toMoney(normalizedConvenienceFeePerTicket * normalizedQuantity);
  const gstAmount = toMoney((normalizedSubtotal * normalizedGstPercentage) / 100);
  const discountedSubtotal = toMoney(Math.max(0, normalizedSubtotal - normalizedDiscount));
  const total = toMoney(discountedSubtotal + convenienceFee + gstAmount);

  return {
    subtotal: normalizedSubtotal,
    quantity: normalizedQuantity,
    discount: normalizedDiscount,
    discountedSubtotal,
    convenienceFeePerTicket: normalizedConvenienceFeePerTicket,
    convenienceFee,
    gstPercentage: normalizedGstPercentage,
    gstAmount,
    total
  };
};

export const calculateBookingPricing = ({
  selectedSeats = [],
  ticketSelection = null,
  discountAmount = 0
} = {}) => {
  const isConcertBooking = Boolean(ticketSelection);
  const quantity = isConcertBooking
    ? Number(getValue(ticketSelection, ['quantity'], 0))
    : selectedSeats.length;
  const subtotal = isConcertBooking
    ? Number(getValue(ticketSelection, ['price'], 0)) * quantity
    : selectedSeats.reduce((sum, seat) => sum + Number(getValue(seat, ['seat_price'], 0)), 0);

  return buildPricingBreakdown({
    subtotal,
    quantity,
    discountAmount
  });
};

export const calculatePersistedPaymentPricing = ({
  payment = null,
  quantity = 0,
  gstPercentage = GST_PERCENTAGE
} = {}) => {
  const amount = Math.max(0, toMoney(getValue(payment, ['amount'], 0)));
  const discount = Math.max(0, toMoney(getValue(payment, ['discount_amount', 'discountAmount'], 0)));
  const convenienceFee = Math.max(0, toMoney(getValue(payment, ['convenience_fee', 'convenienceFee'], 0)));
  const storedGstPercentage = Math.max(
    0,
    toMoney(getValue(payment, ['gst_percentage', 'gstPercentage'], gstPercentage))
  );
  const gstAmount = Math.max(0, toMoney(getValue(payment, ['gst_amount', 'gstAmount'], 0)));
  const subtotal = toMoney(Math.max(0, amount - convenienceFee - gstAmount + discount));

  return {
    ...buildPricingBreakdown({
      subtotal,
      quantity,
      discountAmount: discount,
      gstPercentage: storedGstPercentage
    }),
    convenienceFee,
    gstAmount,
    total: amount
  };
};
