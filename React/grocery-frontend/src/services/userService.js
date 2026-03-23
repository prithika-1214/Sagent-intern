import endpoints from "./endpoints";
import { createCrudService } from "./crudFactory";
import storeService from "./storeService";
import deliveryAgentService from "./deliveryAgentService";
import { generateLocalToken } from "../utils/format";
import { ROLES } from "../utils/constants";

const userCrud = createCrudService("users", endpoints.users);
const normalize = (value) => String(value || "").trim().toLowerCase();

const userService = {
  ...userCrud,

  async login({ contact, name, role }) {
    const selectedRole = role || ROLES.CUSTOMER;
    const matchesName = (candidateName) => !name || normalize(candidateName) === normalize(name);

    if (selectedRole === ROLES.STORE) {
      const stores = await storeService.getAll();
      const match = stores.find(
        (store) => normalize(store.contact) === normalize(contact) && matchesName(store.name),
      );

      if (!match) {
        throw new Error("No store account found for provided details.");
      }

      return {
        token: generateLocalToken(`store-${match.id}`),
        user: {
          id: match.id,
          name: match.name,
          contact: match.contact,
          address: match.location || "",
          role: selectedRole,
        },
      };
    }

    if (selectedRole === ROLES.DELIVERY_AGENT) {
      const agents = await deliveryAgentService.getAll();
      const match = agents.find(
        (agent) =>
          (normalize(agent.phone) === normalize(contact) ||
            normalize(agent.contact) === normalize(contact)) &&
          matchesName(agent.name),
      );

      if (!match) {
        throw new Error("No delivery agent account found for provided details.");
      }

      return {
        token: generateLocalToken(`agent-${match.id}`),
        user: {
          id: match.id,
          name: match.name,
          contact: match.phone || contact,
          vehicleNo: match.vehicleNo,
          address: "",
          role: selectedRole,
        },
      };
    }

    const users = await userCrud.getAll();
    const match = users.find(
      (user) => normalize(user.contact) === normalize(contact) && matchesName(user.name),
    );

    if (!match) {
      throw new Error("No customer account found for provided details.");
    }

    return {
      token: generateLocalToken(match.id),
      user: { ...match, role: selectedRole },
    };
  },
};

export default userService;
