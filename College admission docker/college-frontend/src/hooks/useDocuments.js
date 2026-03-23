import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { documentService } from "../services/documentService";

export const useDocumentsQuery = () =>
  useQuery({
    queryKey: ["documents"],
    queryFn: documentService.getDocuments,
  });

export const useApplicationDocumentsQuery = (appId) =>
  useQuery({
    queryKey: ["documents", "application", appId],
    queryFn: documentService.getDocuments,
    enabled: Boolean(appId),
    select: (documents) =>
      documents.filter((item) => Number(item?.application?.appId) === Number(appId)),
  });

export const useUploadDocumentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: documentService.uploadDocumentFromFile.bind(documentService),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
};

export const useDeleteDocumentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: documentService.deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
};
