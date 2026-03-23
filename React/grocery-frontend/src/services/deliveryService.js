import endpoints from "./endpoints";
import { createCrudService } from "./crudFactory";

const deliveryCrud = createCrudService("deliveries", endpoints.deliveries);

const deliveryService = {
  ...deliveryCrud,

  async getByOrderId(orderId) {
    const all = await deliveryCrud.getAll();
    return all.find((delivery) => Number(delivery.orderId) === Number(orderId)) || null;
  },

  async getByAgentId(agentId) {
    const all = await deliveryCrud.getAll();
    return all.filter((delivery) => Number(delivery.agentId) === Number(agentId));
  },
};

export default deliveryService;
