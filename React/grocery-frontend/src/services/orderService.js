import endpoints from "./endpoints";
import { createCrudService } from "./crudFactory";

const orderCrud = createCrudService("orders", endpoints.orders);

const orderService = {
  ...orderCrud,

  async getByUserId(userId) {
    const all = await orderCrud.getAll();
    return all.filter((order) => Number(order.userId) === Number(userId));
  },
};

export default orderService;
