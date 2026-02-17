import { useCallback, useEffect, useMemo, useState } from "react";
import cartService from "../services/cartService";
import cartItemService from "../services/cartItemService";
import productService from "../services/productService";
import useAuth from "./useAuth";
import { calculateCartTotals } from "../utils/cart";

export default function useCart() {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadCart = useCallback(async () => {
    if (!user?.id) {
      setCart(null);
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const activeCart = await cartService.getOrCreateByUserId(user.id);
      const [cartItems, products] = await Promise.all([
        cartItemService.getByCartId(activeCart.id),
        productService.getAll(),
      ]);

      const productMap = new Map(products.map((product) => [Number(product.id), product]));

      const hydratedItems = cartItems.map((item) => {
        const product = productMap.get(Number(item.productId)) || {};
        const price = Number(item.priceAtTime ?? product.price ?? 0);
        const quantity = Number(item.quantity || 0);

        return {
          ...item,
          product,
          name: product.name || `Product #${item.productId}`,
          price,
          subtotal: price * quantity,
        };
      });

      setCart(activeCart);
      setItems(hydratedItems);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const addItem = useCallback(
    async (product, quantity = 1) => {
      if (!user?.id) {
        throw new Error("Please login to add items.");
      }

      const activeCart = cart || (await cartService.getOrCreateByUserId(user.id));
      const existingItems = await cartItemService.getByCartId(activeCart.id);
      const existing = existingItems.find(
        (item) => Number(item.productId) === Number(product.id),
      );

      if (existing) {
        await cartItemService.update({
          ...existing,
          quantity: Number(existing.quantity || 0) + Number(quantity),
        });
      } else {
        await cartItemService.create({
          cartId: activeCart.id,
          productId: product.id,
          quantity: Number(quantity),
          priceAtTime: Number(product.price || 0),
        });
      }

      await loadCart();
    },
    [user?.id, cart, loadCart],
  );

  const updateQuantity = useCallback(
    async (item, quantity) => {
      const nextQuantity = Number(quantity);
      if (nextQuantity <= 0) {
        await cartItemService.delete(item.id);
      } else {
        await cartItemService.update({ ...item, quantity: nextQuantity });
      }
      await loadCart();
    },
    [loadCart],
  );

  const removeItem = useCallback(
    async (itemId) => {
      await cartItemService.delete(itemId);
      await loadCart();
    },
    [loadCart],
  );

  const clearCart = useCallback(async () => {
    await Promise.all(items.map((item) => cartItemService.delete(item.id)));
    await loadCart();
  }, [items, loadCart]);

  const totals = useMemo(() => calculateCartTotals(items), [items]);

  return {
    cart,
    items,
    loading,
    totals,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart: loadCart,
  };
}
