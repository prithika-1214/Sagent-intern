const FALLBACK_PREFIX = "grocery_mock_";

const now = () => new Date().toISOString();

const defaultData = {
  users: [],
  categories: [
    { id: 1, name: "Fruits" },
    { id: 2, name: "Vegetables" },
    { id: 3, name: "Dairy" },
    { id: 4, name: "Bakery" },
  ],
  products: [
    {
      id: 1,
      name: "Apple",
      price: 120,
      available: true,
      categoryId: 1,
      createdAt: now(),
    },
    {
      id: 2,
      name: "Banana",
      price: 60,
      available: true,
      categoryId: 1,
      createdAt: now(),
    },
    {
      id: 3,
      name: "Tomato",
      price: 40,
      available: true,
      categoryId: 2,
      createdAt: now(),
    },
    {
      id: 4,
      name: "Spinach",
      price: 35,
      available: true,
      categoryId: 2,
      createdAt: now(),
    },
    {
      id: 5,
      name: "Milk",
      price: 55,
      available: true,
      categoryId: 3,
      createdAt: now(),
    },
  ],
  carts: [],
  cartItems: [],
  orders: [],
  payments: [],
  deliveries: [],
  agents: [
    { id: 1, name: "Rahul", phone: "9876543210", vehicleNo: "DL01AB1234" },
    { id: 2, name: "Meera", phone: "9876543211", vehicleNo: "DL01AB5678" },
  ],
  notifications: [],
  stores: [{ id: 1, name: "Fresh Basket", location: "Main Market", contact: "9998887776" }],
};

const deepCopy = (value) => JSON.parse(JSON.stringify(value));

const toStorageKey = (resource) => `${FALLBACK_PREFIX}${resource}`;

const ensureSeeded = (resource) => {
  const key = toStorageKey(resource);
  const existing = localStorage.getItem(key);
  if (!existing) {
    localStorage.setItem(key, JSON.stringify(deepCopy(defaultData[resource] || [])));
  }
};

const readCollection = (resource) => {
  ensureSeeded(resource);
  const raw = localStorage.getItem(toStorageKey(resource));
  return raw ? JSON.parse(raw) : [];
};

const writeCollection = (resource, items) => {
  localStorage.setItem(toStorageKey(resource), JSON.stringify(items));
};

const nextId = (items) => {
  const max = items.reduce((highest, current) => Math.max(highest, Number(current.id || 0)), 0);
  return max + 1;
};

export const shouldUseFallback = (error) => {
  const status = error?.response?.status;
  return !error?.response || status === 404 || status === 405 || status === 501 || error?.code === "ERR_NETWORK";
};

export const fallbackList = (resource) => readCollection(resource);

export const fallbackGetById = (resource, id) => {
  const items = readCollection(resource);
  return items.find((item) => Number(item.id) === Number(id)) || null;
};

export const fallbackCreate = (resource, payload) => {
  const items = readCollection(resource);
  const record = {
    ...payload,
    id: nextId(items),
  };
  const updated = [...items, record];
  writeCollection(resource, updated);
  return record;
};

export const fallbackUpdate = (resource, payload) => {
  const items = readCollection(resource);
  const updated = items.map((item) =>
    Number(item.id) === Number(payload.id) ? { ...item, ...payload } : item,
  );
  writeCollection(resource, updated);
  return updated.find((item) => Number(item.id) === Number(payload.id)) || payload;
};

export const fallbackDelete = (resource, id) => {
  const items = readCollection(resource);
  const updated = items.filter((item) => Number(item.id) !== Number(id));
  writeCollection(resource, updated);
  return "Deleted (fallback)";
};
