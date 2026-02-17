import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { officerService } from "../services/officerService";
import { reviewService } from "../services/reviewService";

export const useOfficerApplicationsQuery = () =>
  useQuery({
    queryKey: ["officer", "applications"],
    queryFn: officerService.getAllApplications,
    refetchInterval: 30000,
  });

export const useOfficerUsersQuery = () =>
  useQuery({
    queryKey: ["officer", "users"],
    queryFn: officerService.getAllUsers,
  });

export const useUpdateStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ application, status }) =>
      officerService.updateApplicationStatus(application, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["officer", "applications"] });
    },
  });
};

export const useReviewNotesQuery = (appId) =>
  useQuery({
    queryKey: ["officer", "review-notes", appId],
    queryFn: () => reviewService.getNotesByAppId(appId),
    enabled: Boolean(appId),
  });

export const useAddReviewNoteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reviewService.addNote,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["officer", "review-notes", variables.appId],
      });
    },
  });
};
