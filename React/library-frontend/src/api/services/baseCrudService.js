import axiosClient from "../axiosClient";

export function createCrudService(basePath, options = {}) {
  const { hasGetById = true } = options;

  const service = {
    async list() {
      const response = await axiosClient.get(basePath);
      return Array.isArray(response.data) ? response.data : [];
    },

    async create(payload) {
      const response = await axiosClient.post(basePath, payload);
      return response.data;
    },

    async update(id, payload) {
      const response = await axiosClient.put(`${basePath}/${id}`, payload);
      return response.data;
    },

    async remove(id) {
      const response = await axiosClient.delete(`${basePath}/${id}`);
      return response.data;
    },
  };

  if (hasGetById) {
    service.getById = async (id) => {
      const response = await axiosClient.get(`${basePath}/${id}`);
      return response.data;
    };
  }

  return service;
}
