import endpoints from "./endpoints";
import { createCrudService } from "./crudFactory";

const paymentService = createCrudService("payments", endpoints.payments);

export default paymentService;
