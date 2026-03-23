import endpoints from "./endpoints";
import { createCrudService } from "./crudFactory";

const cartCrud = createCrudService("carts", endpoints.carts);

const cartService = {
  ...cartCrud,

  async getByUserId(userId) {
    const carts = await cartCrud.getAll();
    return carts.find((cart) => Number(cart.userId) === Number(userId)) || null;
  },

  async getOrCreateByUserId(userId) {
    const existing = await this.getByUserId(userId);
    if (existing) return existing;

    return cartCrud.create({
      userId,
      createdAt: new Date().toISOString(),
    });
  },
};

export default cartService;
