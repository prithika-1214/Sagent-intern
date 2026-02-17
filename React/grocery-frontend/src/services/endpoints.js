const endpoints = {
  users: {
    base: "/users",
    byId: (id) => `/users/${id}`,
  },
  products: {
    base: "/products",
    byId: (id) => `/products/${id}`,
  },
  categories: {
    base: "/categories",
    byId: (id) => `/categories/${id}`,
  },
  carts: {
    base: "/carts",
    byId: (id) => `/carts/${id}`,
  },
  cartItems: {
    base: "/cart-items",
    byId: (id) => `/cart-items/${id}`,
  },
  orders: {
    base: "/orders",
    byId: (id) => `/orders/${id}`,
  },
  payments: {
    base: "/payments",
    byId: (id) => `/payments/${id}`,
  },
  deliveries: {
    base: "/deliveries",
    byId: (id) => `/deliveries/${id}`,
  },
  agents: {
    base: "/agents",
    byId: (id) => `/agents/${id}`,
  },
  notifications: {
    base: "/notifications",
    byId: (id) => `/notifications/${id}`,
  },
  stores: {
    base: "/stores",
    byId: (id) => `/stores/${id}`,
  },
};

export default endpoints;
