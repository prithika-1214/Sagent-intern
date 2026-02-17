import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import PaymentIcon from "@mui/icons-material/Payment";
import SendIcon from "@mui/icons-material/Send";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import * as yup from "yup";
import EmptyState from "../../components/common/EmptyState";
import LoadingScreen from "../../components/common/LoadingScreen";
import {
  APPLICATION_STATUS,
  DEFAULT_APPLICATION_FEE,
  DOCUMENT_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
} from "../../constants/appConstants";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  useCreateApplicationMutation,
  useUpdateApplicationMutation,
} from "../../hooks/useApplications";
import { useCoursesQuery } from "../../hooks/useCourses";
import { useApplicationDocumentsQuery, useUploadDocumentMutation } from "../../hooks/useDocuments";
import { useApplicationPaymentsQuery, useCreatePaymentMutation } from "../../hooks/usePayments";
import { formatDateTime } from "../../utils/date";

const steps = ["Personal", "Academic", "Course", "Documents", "Fee Payment", "Review & Submit"];

const schema = yup.object({
  dob: yup.string().required("Date of birth is required"),
  address: yup.string().trim().min(5).required("Address is required"),
  percentage: yup.number().typeError("Percentage is required").min(0).max(100).required(),
  subjects: yup.string().trim().required("Subjects are required"),
  courseId: yup.number().typeError("Select a course").required("Select a course"),
  payMethod: yup.string().required("Payment method is required"),
  amount: yup.number().typeError("Amount is required").positive().required(),
});

const stepFields = {
  0: ["dob", "address"],
  1: ["percentage", "subjects"],
  2: ["courseId"],
  3: [],
  4: ["payMethod", "amount"],
  5: [],
};

const NewApplicationPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeStep, setActiveStep] = useState(0);
  const [draftApp, setDraftApp] = useState(null);
  const [docType, setDocType] = useState(DOCUMENT_TYPES[0]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lastPayment, setLastPayment] = useState(null);

  const { data: courses = [], isLoading: coursesLoading } = useCoursesQuery();
  const { data: documents = [] } = useApplicationDocumentsQuery(draftApp?.appId);
  const { data: payments = [] } = useApplicationPaymentsQuery(draftApp?.appId);

  const createApplicationMutation = useCreateApplicationMutation();
  const updateApplicationMutation = useUpdateApplicationMutation();
  const uploadDocumentMutation = useUploadDocumentMutation();
  const createPaymentMutation = useCreatePaymentMutation();

  const {
    control,
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      dob: "",
      address: "",
      percentage: "",
      subjects: "",
      courseId: "",
      payMethod: PAYMENT_METHODS[0],
      amount: DEFAULT_APPLICATION_FEE,
    },
  });

  const watchedCourseId = watch("courseId");

  const selectedCourse = useMemo(
    () => courses.find((item) => Number(item.courseId) === Number(watchedCourseId)),
    [courses, watchedCourseId],
  );

  const ensureDraftApplication = async () => {
    if (draftApp?.appId) {
      return draftApp;
    }

    const values = getValues();
    const payload = {
      user: { userId: user?.userId },
      course: { courseId: Number(values.courseId) },
      dob: values.dob,
      address: values.address,
      percentage: Number(values.percentage),
      status: APPLICATION_STATUS.DRAFT,
    };

    const created = await createApplicationMutation.mutateAsync(payload);
    setDraftApp(created);
    toast.info(`Draft application created (#${created.appId})`);
    return created;
  };

  const handleNext = async () => {
    const fields = stepFields[activeStep] || [];
    const valid = fields.length ? await trigger(fields) : true;
    if (!valid) {
      return;
    }

    if (activeStep === 2) {
      try {
        await ensureDraftApplication();
      } catch (error) {
        toast.error(error?.response?.data?.message || "Could not create application draft.");
        return;
      }
    }

    if (activeStep === 3 && documents.length === 0) {
      toast.error("Upload at least one document to continue.");
      return;
    }

    if (activeStep === 4 && payments.length === 0 && !lastPayment) {
      toast.error("Complete application fee payment before final submit.");
      return;
    }

    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => setActiveStep((prev) => Math.max(prev - 1, 0));

  const handleUploadDocument = async () => {
    if (!selectedFile) {
      toast.error("Select a file to upload.");
      return;
    }

    try {
      const app = await ensureDraftApplication();
      setUploadProgress(1);
      await uploadDocumentMutation.mutateAsync({
        appId: app.appId,
        docType,
        file: selectedFile,
        onProgress: setUploadProgress,
      });
      setSelectedFile(null);
      setUploadProgress(0);
      toast.success("Document uploaded.");
    } catch (error) {
      setUploadProgress(0);
      toast.error(error?.message || "Document upload failed.");
    }
  };

  const handleProcessPayment = async () => {
    const valid = await trigger(stepFields[4]);
    if (!valid) {
      return;
    }

    try {
      const app = await ensureDraftApplication();
      const values = getValues();

      const payment = await createPaymentMutation.mutateAsync({
        application: { appId: app.appId },
        payMethod: values.payMethod,
        amount: Number(values.amount),
        status: PAYMENT_STATUS.SUCCESS,
      });
      setLastPayment(payment);
      toast.success("Payment successful.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Payment could not be processed.");
    }
  };

  const handleFinalSubmit = async (values) => {
    try {
      const app = await ensureDraftApplication();
      const submitted = await updateApplicationMutation.mutateAsync({
        appId: app.appId,
        payload: {
          status: APPLICATION_STATUS.SUBMITTED,
          percentage: Number(values.percentage),
          address: values.address,
        },
      });

      toast.success(`Application submitted. ID: ${submitted.appId}`);
      navigate(`/student/applications/${submitted.appId}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not submit application.");
    }
  };

  if (coursesLoading) {
    return <LoadingScreen label="Loading course catalog" />;
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4">New Application</Typography>
            <Typography color="text.secondary">
              Complete all steps, upload documents, make payment, and submit.
            </Typography>
          </Box>

          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Stack spacing={2} component="form" onSubmit={handleSubmit(handleFinalSubmit)}>
            {activeStep === 0 && (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth label="Name" value={user?.name || ""} InputProps={{ readOnly: true }} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth label="Email" value={user?.email || ""} InputProps={{ readOnly: true }} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Date of Birth"
                    InputLabelProps={{ shrink: true }}
                    {...register("dob")}
                    error={Boolean(errors.dob)}
                    helperText={errors.dob?.message}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    label="Address"
                    {...register("address")}
                    error={Boolean(errors.address)}
                    helperText={errors.address?.message}
                  />
                </Grid>
              </Grid>
            )}

            {activeStep === 1 && (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Overall Percentage"
                    {...register("percentage")}
                    error={Boolean(errors.percentage)}
                    helperText={errors.percentage?.message}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    label="Subjects"
                    placeholder="Physics, Chemistry, Mathematics"
                    {...register("subjects")}
                    error={Boolean(errors.subjects)}
                    helperText={errors.subjects?.message}
                  />
                </Grid>
              </Grid>
            )}

            {activeStep === 2 && (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 7 }}>
                  <Controller
                    name="courseId"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={Boolean(errors.courseId)}>
                        <InputLabel id="course-select-label">Select Course</InputLabel>
                        <Select
                          labelId="course-select-label"
                          label="Select Course"
                          value={field.value || ""}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                        >
                          {courses.map((course) => (
                            <MenuItem key={course.courseId} value={course.courseId}>
                              {course.courseName} ({course.courseType})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                  {errors.courseId && (
                    <Typography variant="caption" color="error">
                      {errors.courseId.message}
                    </Typography>
                  )}
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Alert severity="info">
                    Draft application will be generated once you proceed to document upload.
                  </Alert>
                </Grid>
                {selectedCourse && (
                  <Grid size={{ xs: 12 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight={700}>
                          Selected Course Summary
                        </Typography>
                        <Typography>
                          {selectedCourse.courseName} | {selectedCourse.courseType} | Duration: {selectedCourse.duration}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            )}

            {activeStep === 3 && (
              <Stack spacing={2}>
                {draftApp?.appId ? (
                  <Alert severity="success">Draft Application ID: #{draftApp.appId}</Alert>
                ) : (
                  <Alert severity="warning">Please go back and complete previous steps first.</Alert>
                )}

                <Grid container spacing={2} alignItems="center">
                  <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth>
                      <InputLabel id="doc-type-label">Document Type</InputLabel>
                      <Select
                        labelId="doc-type-label"
                        label="Document Type"
                        value={docType}
                        onChange={(event) => setDocType(event.target.value)}
                      >
                        {DOCUMENT_TYPES.map((type) => (
                          <MenuItem key={type} value={type}>
                            {type}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 5 }}>
                    <TextField
                      fullWidth
                      type="file"
                      InputLabelProps={{ shrink: true }}
                      onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                      inputProps={{ accept: ".pdf,.png,.jpg,.jpeg" }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Button
                      fullWidth
                      startIcon={<CloudUploadIcon />}
                      onClick={handleUploadDocument}
                      disabled={uploadDocumentMutation.isPending || !selectedFile}
                    >
                      Upload
                    </Button>
                  </Grid>
                </Grid>

                {uploadProgress > 0 && <LinearProgress variant="determinate" value={uploadProgress} />}

                {documents.length === 0 ? (
                  <EmptyState
                    title="No uploaded documents"
                    subtitle="Upload at least one marksheet or ID proof to continue."
                  />
                ) : (
                  <List>
                    {documents.map((item) => (
                      <ListItem key={item.documentId}>
                        <ListItemText
                          primary={item.docType}
                          secondary={`Document ID: ${item.documentId}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Stack>
            )}

            {activeStep === 4 && (
              <Stack spacing={2}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="payMethod"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel id="pay-method-label">Payment Method</InputLabel>
                          <Select
                            labelId="pay-method-label"
                            label="Payment Method"
                            value={field.value}
                            onChange={(event) => field.onChange(event.target.value)}
                          >
                            {PAYMENT_METHODS.map((method) => (
                              <MenuItem key={method} value={method}>
                                {method}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                    {errors.payMethod && (
                      <Typography variant="caption" color="error">
                        {errors.payMethod.message}
                      </Typography>
                    )}
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Fee Amount"
                      {...register("amount")}
                      error={Boolean(errors.amount)}
                      helperText={errors.amount?.message}
                    />
                  </Grid>
                </Grid>

                <Button
                  startIcon={<PaymentIcon />}
                  onClick={handleProcessPayment}
                  disabled={createPaymentMutation.isPending}
                >
                  {createPaymentMutation.isPending ? "Processing..." : "Pay Application Fee"}
                </Button>

                {payments.length > 0 && (
                  <List>
                    {payments.map((payment) => (
                      <ListItem key={payment.paymentId}>
                        <ListItemText
                          primary={`₹${payment.amount} | ${payment.payMethod}`}
                          secondary={`Status: ${payment.status} | ${formatDateTime(
                            payment.transactionDate,
                          )}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Stack>
            )}

            {activeStep === 5 && (
              <Stack spacing={2}>
                <Alert severity="info">
                  Review and submit. Backend final submission is mapped to updating the draft status to
                  <strong> Submitted</strong>.
                </Alert>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Applicant
                    </Typography>
                    <Typography>{user?.name}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Application ID
                    </Typography>
                    <Typography>{draftApp?.appId || "Will be generated"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Course
                    </Typography>
                    <Typography>{selectedCourse?.courseName || "-"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Documents Uploaded
                    </Typography>
                    <Typography>{documents.length}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Payment Records
                    </Typography>
                    <Typography>{payments.length}</Typography>
                  </Grid>
                </Grid>

                <Button
                  type="submit"
                  startIcon={<SendIcon />}
                  disabled={updateApplicationMutation.isPending}
                >
                  {updateApplicationMutation.isPending ? "Submitting..." : "Submit Application"}
                </Button>
              </Stack>
            )}

            <Stack direction="row" justifyContent="space-between">
              <Button variant="outlined" onClick={handleBack} disabled={activeStep === 0}>
                Back
              </Button>

              {activeStep < steps.length - 1 && (
                <Button onClick={handleNext}>Next</Button>
              )}
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default NewApplicationPage;


