import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";
import { readFileAsDataUrl } from "../utils/file";

export const documentService = {
  async getDocuments() {
    const { data } = await api.get(ENDPOINTS.DOCUMENTS.BASE);
    return data;
  },

  async getDocumentById(id) {
    const { data } = await api.get(ENDPOINTS.DOCUMENTS.BY_ID(id));
    return data;
  },

  async createDocument(payload, onProgress) {
    const { data } = await api.post(ENDPOINTS.DOCUMENTS.BASE, payload, {
      onUploadProgress: (event) => {
        if (event.total && typeof onProgress === "function") {
          const percent = 90 + Math.round((event.loaded / event.total) * 10);
          onProgress(Math.min(percent, 100));
        }
      },
    });
    return data;
  },

  async uploadDocumentFromFile({ appId, docType, file, onProgress }) {
    if (!appId) {
      throw new Error("Application ID is required before document upload.");
    }
    if (!file) {
      throw new Error("Please select a file.");
    }

    const fileUrl = await readFileAsDataUrl(file, onProgress);

    const payload = {
      application: {
        appId,
      },
      docType,
      fileUrl,
    };

    const data = await this.createDocument(payload, onProgress);
    if (typeof onProgress === "function") {
      onProgress(100);
    }

    return data;
  },

  async updateDocument(id, payload) {
    const { data } = await api.put(ENDPOINTS.DOCUMENTS.BY_ID(id), payload);
    return data;
  },

  async deleteDocument(id) {
    const { data } = await api.delete(ENDPOINTS.DOCUMENTS.BY_ID(id));
    return data;
  },
};
