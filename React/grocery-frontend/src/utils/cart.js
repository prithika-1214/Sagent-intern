export const calculateCartTotals = (items = []) => {
  const cartTotal = items.reduce(
    (sum, item) => sum + Number(item.priceAtTime || item.price || 0) * Number(item.quantity || 0),
    0,
  );

  const discount = cartTotal > 200 ? 25 : 0;
  const finalTotal = Math.max(cartTotal - discount, 0);

  return {
    cartTotal,
    discount,
    finalTotal,
  };
};
