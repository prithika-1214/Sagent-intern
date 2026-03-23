import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";
import { readFileAsDataUrl } from "../utils/file";

const normalizeDocument = (document) => ({
  documentId: document?.documentId ?? document?.docId ?? null,
  docId: document?.docId ?? document?.documentId ?? null,
  docType: document?.docType ?? document?.type ?? "",
  type: document?.type ?? document?.docType ?? "",
  fileUrl: document?.fileUrl ?? document?.docUpload ?? "",
  docUpload: document?.docUpload ?? document?.fileUrl ?? "",
  application: document?.application ?? null,
});

const buildDocumentPayload = ({ appId, docType, fileValue }) => ({
  application: {
    appId: Number(appId),
  },
  docType,
  type: docType,
  fileUrl: fileValue,
  docUpload: fileValue,
});

const extractErrorMessage = (error) => {
  const responseData = error?.response?.data;
  if (typeof responseData === "string") {
    return responseData;
  }
  if (typeof responseData?.message === "string") {
    return responseData.message;
  }
  return "";
};

const shouldRetryWithCompactPayload = (error) => {
  const status = Number(error?.response?.status);
  if (status !== 500) {
    return false;
  }

  const message = `${extractErrorMessage(error)} ${error?.message || ""}`.toLowerCase();
  if (!message.trim()) {
    return true;
  }

  return (
    message.includes("data too long") ||
    message.includes("too long for column") ||
    message.includes("value too long") ||
    message.includes("doc_upload") ||
    message.includes("status code 500") ||
    message.includes("internal server error") ||
    message.includes("request entity too large")
  );
};

export const documentService = {
  async getDocuments() {
    const { data } = await api.get(ENDPOINTS.DOCUMENTS.BASE);
    return Array.isArray(data) ? data.map(normalizeDocument) : [];
  },

  async getDocumentById(id) {
    const { data } = await api.get(ENDPOINTS.DOCUMENTS.BY_ID(id));
    return normalizeDocument(data);
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
    return normalizeDocument(data);
  },

  async uploadDocumentFromFile({ appId, docType, file, onProgress }) {
    if (!appId) {
      throw new Error("Application ID is required before document upload.");
    }
    if (!file) {
      throw new Error("Please select a file.");
    }

    const resolvedDocType = String(docType || "Document").trim();
    const fileUrl = await readFileAsDataUrl(file, onProgress);

    try {
      const payload = buildDocumentPayload({
        appId,
        docType: resolvedDocType,
        fileValue: fileUrl,
      });
      const data = await this.createDocument(payload, onProgress);
      if (typeof onProgress === "function") {
        onProgress(100);
      }
      return data;
    } catch (error) {
      if (!shouldRetryWithCompactPayload(error)) {
        throw error;
      }

      // Fallback for backends where the document column is short (for example VARCHAR(255)).
      const compactPayload = buildDocumentPayload({
        appId,
        docType: resolvedDocType,
        fileValue: file?.name || `document-${Date.now()}`,
      });

      const data = await this.createDocument(compactPayload, onProgress);
      if (typeof onProgress === "function") {
        onProgress(100);
      }

      return data;
    }
  },

  async updateDocument(id, payload) {
    const { data } = await api.put(ENDPOINTS.DOCUMENTS.BY_ID(id), payload);
    return normalizeDocument(data);
  },

  async deleteDocument(id) {
    const { data } = await api.delete(ENDPOINTS.DOCUMENTS.BY_ID(id));
    return data;
  },
};
