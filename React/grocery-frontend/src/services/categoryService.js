import endpoints from "./endpoints";
import { createCrudService } from "./crudFactory";

const categoryService = createCrudService("categories", endpoints.categories);

export default categoryService;
