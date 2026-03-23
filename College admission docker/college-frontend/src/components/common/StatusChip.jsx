import { Chip } from "@mui/material";
import { APPLICATION_STATUS } from "../../constants/appConstants";

const colorMap = {
  [APPLICATION_STATUS.DRAFT]: "default",
  [APPLICATION_STATUS.SUBMITTED]: "info",
  [APPLICATION_STATUS.UNDER_REVIEW]: "warning",
  [APPLICATION_STATUS.ACCEPTED]: "success",
  [APPLICATION_STATUS.REJECTED]: "error",
  [APPLICATION_STATUS.CANCELLED]: "default",
};

const StatusChip = ({ status }) => (
  <Chip
    size="small"
    label={status || "Unknown"}
    color={colorMap[status] || "default"}
    variant={status === APPLICATION_STATUS.DRAFT ? "outlined" : "filled"}
  />
);

export default StatusChip;
