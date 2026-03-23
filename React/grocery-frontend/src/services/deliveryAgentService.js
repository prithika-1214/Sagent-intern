import endpoints from "./endpoints";
import { createCrudService } from "./crudFactory";

const deliveryAgentService = createCrudService("agents", endpoints.agents);

export default deliveryAgentService;
