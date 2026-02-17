import endpoints from "./endpoints";
import { createCrudService } from "./crudFactory";

const storeService = createCrudService("stores", endpoints.stores);

export default storeService;
