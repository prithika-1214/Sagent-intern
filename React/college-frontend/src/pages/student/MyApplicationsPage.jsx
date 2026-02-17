import VisibilityIcon from "@mui/icons-material/Visibility";
import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import EmptyState from "../../components/common/EmptyState";
import LoadingScreen from "../../components/common/LoadingScreen";
import StatusChip from "../../components/common/StatusChip";
import { useAuth } from "../../context/AuthContext.jsx";
import { useStudentApplicationsQuery } from "../../hooks/useApplications";
import { formatDateTime } from "../../utils/date";

const MyApplicationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data = [], isLoading } = useStudentApplicationsQuery(user?.userId);

  const columns = useMemo(
    () => [
      { field: "appId", headerName: "Application ID", width: 140 },
      {
        field: "course",
        headerName: "Course",
        width: 210,
        valueGetter: (_, row) => row.course?.courseName || "-",
      },
      {
        field: "percentage",
        headerName: "Percentage",
        width: 120,
        valueFormatter: (value) => (value === null || value === undefined ? "-" : `${value}%`),
      },
      {
        field: "submittedDate",
        headerName: "Submitted Date",
        flex: 1,
        minWidth: 180,
        valueFormatter: (value) => formatDateTime(value),
      },
      {
        field: "status",
        headerName: "Status",
        width: 160,
        renderCell: (params) => <StatusChip status={params.row.status} />,
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 140,
        sortable: false,
        renderCell: (params) => (
          <Button
            size="small"
            variant="outlined"
            startIcon={<VisibilityIcon />}
            onClick={() => navigate(`/student/applications/${params.row.appId}`)}
          >
            View
          </Button>
        ),
      },
    ],
    [navigate],
  );

  if (isLoading) {
    return <LoadingScreen label="Loading applications" />;
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h4">My Applications</Typography>
            <Typography color="text.secondary">View all submitted and in-progress applications.</Typography>
          </Box>

          {data.length === 0 ? (
            <EmptyState
              title="No applications found"
              subtitle="You can create your first application from the New Application page."
            />
          ) : (
            <Box sx={{ height: 560 }}>
              <DataGrid
                rows={data}
                columns={columns}
                getRowId={(row) => row.appId}
                pageSizeOptions={[5, 10, 20]}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 10, page: 0 },
                  },
                }}
              />
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default MyApplicationsPage;
