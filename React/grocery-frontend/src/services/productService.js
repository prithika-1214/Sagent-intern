import endpoints from "./endpoints";
import { createCrudService } from "./crudFactory";

const productService = createCrudService("products", endpoints.products);

export default productService;
