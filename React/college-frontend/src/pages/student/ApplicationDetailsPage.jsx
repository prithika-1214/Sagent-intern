import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CancelIcon from "@mui/icons-material/Cancel";
import DownloadIcon from "@mui/icons-material/Download";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import EmptyState from "../../components/common/EmptyState";
import LoadingScreen from "../../components/common/LoadingScreen";
import StatusChip from "../../components/common/StatusChip";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  useApplicationByIdQuery,
  useDeleteApplicationMutation,
} from "../../hooks/useApplications";
import { useApplicationDocumentsQuery } from "../../hooks/useDocuments";
import { useReviewNotesQuery } from "../../hooks/useOfficer";
import { useApplicationPaymentsQuery } from "../../hooks/usePayments";
import { formatDate, formatDateTime } from "../../utils/date";
import { openDocument } from "../../utils/file";

const ApplicationDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: application, isLoading, error } = useApplicationByIdQuery(id);
  const { data: documents = [] } = useApplicationDocumentsQuery(id);
  const { data: payments = [] } = useApplicationPaymentsQuery(id);
  const { data: notes = [] } = useReviewNotesQuery(id);
  const cancelMutation = useDeleteApplicationMutation();

  const timeline = useMemo(() => {
    const events = [];
    if (application?.submittedDate) {
      events.push({
        label: "Application Created",
        at: application.submittedDate,
      });
    }

    payments.forEach((payment) => {
      events.push({
        label: `Payment ${payment.status || "Processed"}`,
        at: payment.transactionDate,
      });
    });

    notes.forEach((note) => {
      events.push({
        label: `Officer Note: ${note.note}`,
        at: note.createdAt,
      });
    });

    events.push({
      label: `Current Status: ${application?.status || "Unknown"}`,
      at: application?.submittedDate,
    });

    return events
      .filter((item) => Boolean(item.at))
      .sort((a, b) => new Date(a.at) - new Date(b.at));
  }, [application, notes, payments]);

  const canView = Number(application?.user?.userId) === Number(user?.userId);

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync(Number(id));
      toast.success("Application cancelled.");
      navigate("/student/applications");
    } catch (cancelError) {
      toast.error(cancelError?.response?.data || "Could not cancel application.");
    } finally {
      setConfirmOpen(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen label="Loading application details" />;
  }

  if (error || !application) {
    return <Alert severity="error">Application not found.</Alert>;
  }

  if (!canView) {
    return <Alert severity="warning">You are not authorized to view this application.</Alert>;
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Button startIcon={<ArrowBackIcon />} variant="outlined" onClick={() => navigate(-1)}>
          Back
        </Button>
        <Button
          color="error"
          startIcon={<CancelIcon />}
          onClick={() => setConfirmOpen(true)}
          disabled={cancelMutation.isPending}
        >
          Cancel Application
        </Button>
      </Stack>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between">
              <Box>
                <Typography variant="h5">Application #{application.appId}</Typography>
                <Typography color="text.secondary">
                  Submitted: {formatDateTime(application.submittedDate)}
                </Typography>
              </Box>
              <StatusChip status={application.status} />
            </Stack>

            <Divider />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Student Name
                </Typography>
                <Typography>{application.user?.name || "-"}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Email
                </Typography>
                <Typography>{application.user?.email || "-"}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Date of Birth
                </Typography>
                <Typography>{formatDate(application.dob)}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Course
                </Typography>
                <Typography>{application.course?.courseName || "-"}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Percentage
                </Typography>
                <Typography>{application.percentage ?? "-"}%</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Address
                </Typography>
                <Typography>{application.address || "-"}</Typography>
              </Grid>
            </Grid>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Documents
              </Typography>
              {documents.length === 0 ? (
                <EmptyState
                  title="No documents"
                  subtitle="Uploaded documents will appear here."
                />
              ) : (
                <List>
                  {documents.map((doc) => (
                    <ListItem
                      key={doc.documentId}
                      secondaryAction={
                        <Button
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={() => openDocument(doc.fileUrl)}
                        >
                          View
                        </Button>
                      }
                    >
                      <ListItemText
                        primary={doc.docType || "Document"}
                        secondary={`Document ID: ${doc.documentId}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Payments
              </Typography>
              {payments.length === 0 ? (
                <EmptyState title="No payments" subtitle="Payment records will appear here." />
              ) : (
                <List>
                  {payments.map((payment) => (
                    <ListItem key={payment.paymentId}>
                      <ListItemText
                        primary={`₹${payment.amount} via ${payment.payMethod}`}
                        secondary={`Status: ${payment.status} | Date: ${formatDateTime(
                          payment.transactionDate,
                        )}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Status Timeline
          </Typography>
          {timeline.length === 0 ? (
            <EmptyState title="No timeline events" subtitle="Status events will appear here." />
          ) : (
            <List>
              {timeline.map((item, index) => (
                <ListItem key={`${item.label}-${index}`}>
                  <ListItemText primary={item.label} secondary={formatDateTime(item.at)} />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        title="Cancel this application?"
        message="This will call the backend delete endpoint for the application."
        onConfirm={handleCancel}
        onCancel={() => setConfirmOpen(false)}
        loading={cancelMutation.isPending}
      />
    </Stack>
  );
};

export default ApplicationDetailsPage;
