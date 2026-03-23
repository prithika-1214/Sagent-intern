import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { applicationService } from "../services/applicationService";

export const useApplicationsQuery = (options = {}) =>
  useQuery({
    queryKey: ["applications"],
    queryFn: applicationService.getApplications,
    ...options,
  });

export const useApplicationByIdQuery = (appId) =>
  useQuery({
    queryKey: ["applications", appId],
    queryFn: () => applicationService.getApplicationById(appId),
    enabled: Boolean(appId),
  });

export const useStudentApplicationsQuery = (userId) =>
  useQuery({
    queryKey: ["applications", "student", userId],
    queryFn: applicationService.getApplications,
    enabled: Boolean(userId),
    select: (apps) => apps.filter((app) => Number(app?.user?.userId) === Number(userId)),
  });

export const useCreateApplicationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: applicationService.createApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
};

export const useUpdateApplicationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ appId, payload }) => applicationService.updateApplication(appId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["applications", variables.appId] });
    },
  });
};

export const useDeleteApplicationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: applicationService.deleteApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
};
