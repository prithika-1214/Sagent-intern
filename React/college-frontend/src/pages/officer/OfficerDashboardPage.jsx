import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import EmptyState from "../../components/common/EmptyState";
import LoadingScreen from "../../components/common/LoadingScreen";
import StatusChip from "../../components/common/StatusChip";
import { APPLICATION_STATUS } from "../../constants/appConstants";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCoursesQuery } from "../../hooks/useCourses";
import { useDocumentsQuery } from "../../hooks/useDocuments";
import {
  useAddReviewNoteMutation,
  useOfficerApplicationsQuery,
  useReviewNotesQuery,
  useUpdateStatusMutation,
} from "../../hooks/useOfficer";
import { usePaymentsQuery } from "../../hooks/usePayments";
import { formatDateOrDateTime, formatDateTime } from "../../utils/date";
import { openDocument } from "../../utils/file";

const statusOptions = [
  APPLICATION_STATUS.SUBMITTED,
  APPLICATION_STATUS.UNDER_REVIEW,
  APPLICATION_STATUS.ACCEPTED,
  APPLICATION_STATUS.REJECTED,
];

const OfficerDashboardPage = () => {
  const { user } = useAuth();
  const { data: courses = [] } = useCoursesQuery();
  const { data: documents = [] } = useDocumentsQuery();
  const { data: payments = [] } = usePaymentsQuery();

  const updateStatusMutation = useUpdateStatusMutation();
  const addReviewNoteMutation = useAddReviewNoteMutation();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [courseFilter, setCourseFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });

  const [selectedApp, setSelectedApp] = useState(null);
  const [nextStatus, setNextStatus] = useState(APPLICATION_STATUS.UNDER_REVIEW);
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, [debouncedSearch, statusFilter, courseFilter, dateFrom, dateTo]);

  const {
    data: applicationsPage,
    isLoading,
    isFetching,
  } = useOfficerApplicationsQuery({
    page: paginationModel.page,
    pageSize: paginationModel.pageSize,
    search: debouncedSearch,
    status: statusFilter,
    courseId: courseFilter,
    dateFrom,
    dateTo,
    excludeDraft: true,
  });

  const applications = applicationsPage?.content ?? [];
  const totalApplications = Number(applicationsPage?.totalElements) || 0;

  const { data: reviewNotes = [] } = useReviewNotesQuery(selectedApp?.appId);

  const columns = useMemo(
    () => [
      { field: "appId", headerName: "App ID", width: 110 },
      {
        field: "student",
        headerName: "Student",
        width: 180,
        valueGetter: (_, row) => row.user?.name || "-",
      },
      {
        field: "email",
        headerName: "Email",
        flex: 1,
        minWidth: 180,
        valueGetter: (_, row) => row.user?.email || "-",
      },
      {
        field: "course",
        headerName: "Course",
        width: 190,
        valueGetter: (_, row) => row.course?.courseName || "-",
      },
      {
        field: "status",
        headerName: "Status",
        width: 160,
        renderCell: (params) => <StatusChip status={params.row.status} />,
      },
      {
        field: "submittedDate",
        headerName: "Submitted",
        width: 180,
        valueFormatter: (value) => formatDateTime(value),
      },
      {
        field: "action",
        headerName: "Action",
        width: 120,
        sortable: false,
        renderCell: (params) => (
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setSelectedApp(params.row);
              setNextStatus(params.row.status || APPLICATION_STATUS.UNDER_REVIEW);
              setNewNote("");
            }}
          >
            Review
          </Button>
        ),
      },
    ],
    [],
  );

  const selectedDocuments = useMemo(
    () => documents.filter((item) => Number(item.application?.appId) === Number(selectedApp?.appId)),
    [documents, selectedApp?.appId],
  );

  const selectedPayments = useMemo(
    () => payments.filter((item) => Number(item.application?.appId) === Number(selectedApp?.appId)),
    [payments, selectedApp?.appId],
  );

  const handleStatusUpdate = async () => {
    if (!selectedApp) {
      return;
    }
    try {
      const updated = await updateStatusMutation.mutateAsync({
        application: selectedApp,
        status: nextStatus,
      });
      setSelectedApp(updated);
      toast.success("Application status updated.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not update status.");
    }
  };

  const handleAddNote = async () => {
    if (!selectedApp || !newNote.trim()) {
      return;
    }

    try {
      await addReviewNoteMutation.mutateAsync({
        appId: selectedApp.appId,
        officerName: user?.name || "Officer",
        note: newNote.trim(),
      });
      setNewNote("");
      toast.success("Review note added.");
    } catch {
      toast.error("Could not add review note.");
    }
  };

  if (isLoading) {
    return <LoadingScreen label="Loading officer dashboard" />;
  }

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h4">Officer Dashboard</Typography>
        <Typography color="text.secondary">
          Review applications, filter records, update status, and add notes.
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Search"
                placeholder="App ID, student, course"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={(event) => setStatusFilter(event.target.value)}>
                  <MenuItem value="ALL">All</MenuItem>
                  {statusOptions.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Course</InputLabel>
                <Select value={courseFilter} label="Course" onChange={(event) => setCourseFilter(event.target.value)}>
                  <MenuItem value="ALL">All</MenuItem>
                  {courses.map((course) => (
                    <MenuItem key={course.courseId} value={course.courseId}>
                      {course.courseName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                fullWidth
                type="date"
                label="From"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                fullWidth
                type="date"
                label="To"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {applications.length === 0 && !isFetching ? (
            <EmptyState title="No applications match filters" subtitle="Adjust status/course/date/search and try again." />
          ) : (
            <Box sx={{ height: 620 }}>
              <DataGrid
                rows={applications}
                columns={columns}
                getRowId={(row) => row.appId}
                loading={isFetching}
                paginationMode="server"
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                rowCount={totalApplications}
                pageSizeOptions={[10]}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedApp)}
        fullWidth
        maxWidth="md"
        onClose={() => setSelectedApp(null)}
      >
        <DialogTitle>Application Review #{selectedApp?.appId}</DialogTitle>
        <DialogContent dividers>
          {!selectedApp ? null : (
            <Stack spacing={2}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Student
                  </Typography>
                  <Typography>{selectedApp.user?.name}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Course
                  </Typography>
                  <Typography>{selectedApp.course?.courseName}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Percentage
                  </Typography>
                  <Typography>{selectedApp.percentage ?? "-"}%</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Current Status
                  </Typography>
                  <StatusChip status={selectedApp.status} />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Update Status</InputLabel>
                    <Select
                      value={nextStatus}
                      label="Update Status"
                      onChange={(event) => setNextStatus(event.target.value)}
                    >
                      <MenuItem value={APPLICATION_STATUS.UNDER_REVIEW}>Under Review</MenuItem>
                      <MenuItem value={APPLICATION_STATUS.ACCEPTED}>Accepted</MenuItem>
                      <MenuItem value={APPLICATION_STATUS.REJECTED}>Rejected</MenuItem>
                      <MenuItem value={APPLICATION_STATUS.SUBMITTED}>Submitted</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Button
                    sx={{ mt: { xs: 0, md: 0.8 } }}
                    onClick={handleStatusUpdate}
                    disabled={updateStatusMutation.isPending}
                  >
                    {updateStatusMutation.isPending ? "Updating..." : "Save Status"}
                  </Button>
                </Grid>
              </Grid>

              <Stack spacing={1}>
                <Typography variant="h6">Documents</Typography>
                {selectedDocuments.length === 0 ? (
                  <Alert severity="info">No documents available.</Alert>
                ) : (
                  <List>
                    {selectedDocuments.map((doc) => (
                      <ListItem
                        key={doc.documentId}
                        secondaryAction={
                          <Button size="small" onClick={() => openDocument(doc.fileUrl)}>
                            Open
                          </Button>
                        }
                      >
                        <ListItemText primary={doc.docType} secondary={`ID: ${doc.documentId}`} />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Stack>

              <Stack spacing={1}>
                <Typography variant="h6">Payments</Typography>
                {selectedPayments.length === 0 ? (
                  <Alert severity="info">No payments found.</Alert>
                ) : (
                  <List>
                    {selectedPayments.map((payment) => (
                      <ListItem key={payment.paymentId}>
                        <ListItemText
                          primary={`₹${payment.amount} via ${payment.payMethod}`}
                          secondary={`Status: ${payment.status} | ${formatDateOrDateTime(
                            payment.transactionDate,
                          )}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Stack>

              <Stack spacing={1}>
                <Typography variant="h6">Review Notes</Typography>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  placeholder="Add officer note"
                  value={newNote}
                  onChange={(event) => setNewNote(event.target.value)}
                />
                <Button onClick={handleAddNote} disabled={addReviewNoteMutation.isPending || !newNote.trim()}>
                  Add Note
                </Button>

                {reviewNotes.length === 0 ? (
                  <Alert severity="info">No review notes yet. Add a note to begin review history.</Alert>
                ) : (
                  <List>
                    {reviewNotes.map((note) => (
                      <ListItem key={note.id}>
                        <ListItemText
                          primary={note.note}
                          secondary={`${note.officerName} | ${formatDateTime(note.createdAt)}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setSelectedApp(null)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default OfficerDashboardPage;
