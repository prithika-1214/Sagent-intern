import endpoints from "./endpoints";
import { createCrudService } from "./crudFactory";

const notificationCrud = createCrudService("notifications", endpoints.notifications);

const notificationService = {
  ...notificationCrud,

  async getByUserId(userId) {
    const all = await notificationCrud.getAll();
    return all
      .filter((notification) => Number(notification.userId) === Number(userId))
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  },
};

export default notificationService;
