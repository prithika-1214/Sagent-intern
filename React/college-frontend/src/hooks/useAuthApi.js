import { useMutation, useQuery } from "@tanstack/react-query";
import { authService } from "../services/authService";

export const useRegisterStudentMutation = () =>
  useMutation({
    mutationFn: authService.registerStudent,
  });

export const useRegisterOfficerMutation = () =>
  useMutation({
    mutationFn: authService.registerOfficer,
  });

export const useStudentLoginMutation = () =>
  useMutation({
    mutationFn: authService.loginStudent,
  });

export const useOfficerLoginMutation = () =>
  useMutation({
    mutationFn: authService.loginOfficer,
  });

export const useUsersQuery = () =>
  useQuery({
    queryKey: ["users"],
    queryFn: authService.getUsers,
  });
