import { applicationService } from "./applicationService";
import { authService } from "./authService";

export const officerService = {
  getAllApplications: (params = {}) => applicationService.getApplicationsPaginated(params),
  getAllUsers: authService.getUsers,

  async updateApplicationStatus(application, status) {
    return applicationService.updateApplication(application.appId, {
      status,
      percentage: application.percentage,
      address: application.address,
    });
  },
};
