import endpoints from "./endpoints";
import { createCrudService } from "./crudFactory";

const cartItemCrud = createCrudService("cartItems", endpoints.cartItems);

const cartItemService = {
  ...cartItemCrud,

  async getByCartId(cartId) {
    const all = await cartItemCrud.getAll();
    return all.filter((item) => Number(item.cartId) === Number(cartId));
  },
};

export default cartItemService;
