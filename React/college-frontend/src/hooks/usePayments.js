import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentService } from "../services/paymentService";

export const usePaymentsQuery = () =>
  useQuery({
    queryKey: ["payments"],
    queryFn: paymentService.getPayments,
  });

export const useApplicationPaymentsQuery = (appId) =>
  useQuery({
    queryKey: ["payments", "application", appId],
    queryFn: paymentService.getPayments,
    enabled: Boolean(appId),
    select: (payments) =>
      payments.filter((item) => Number(item?.application?.appId) === Number(appId)),
  });

export const useCreatePaymentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: paymentService.createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
};
