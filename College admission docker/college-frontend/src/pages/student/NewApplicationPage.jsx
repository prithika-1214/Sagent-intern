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
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import * as yup from "yup";
import EmptyState from "../../components/common/EmptyState";
import LoadingScreen from "../../components/common/LoadingScreen";
import {
  APPLICATION_STATUS,
  DEFAULT_APPLICATION_FEE,
  DOCUMENT_TYPES,
  MAX_APPLICATIONS_PER_STUDENT,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
} from "../../constants/appConstants";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  useApplicationByIdQuery,
  useCreateApplicationMutation,
  useStudentApplicationsQuery,
  useUpdateApplicationMutation,
} from "../../hooks/useApplications";
import { useCoursesQuery } from "../../hooks/useCourses";
import {
  useApplicationDocumentsQuery,
  useDeleteDocumentMutation,
  useUploadDocumentMutation,
} from "../../hooks/useDocuments";
import { useApplicationPaymentsQuery, useCreatePaymentMutation } from "../../hooks/usePayments";
import { formatDateOrDateTime } from "../../utils/date";

const steps = ["Personal", "Academic", "Course", "Documents", "Fee Payment", "Review & Submit"];

const schema = yup.object({
  name: yup.string().trim().required("Name is required"),
  email: yup.string().trim().email("Enter a valid email").required("Email is required"),
  dob: yup.string().required("Date of birth is required"),
  address: yup.string().trim().min(5).required("Address is required"),
  percentage: yup.number().typeError("Percentage is required").min(0).max(100).required(),
  subjects: yup.string().trim().required("Subjects are required"),
  courseId: yup.number().typeError("Select a course").required("Select a course"),
  payMethod: yup.string().required("Payment method is required"),
  amount: yup.number().typeError("Amount is required").positive().required(),
});

const stepFields = {
  0: ["name", "email", "dob", "address"],
  1: ["percentage", "subjects"],
  2: ["courseId"],
  3: [],
  4: ["payMethod", "amount"],
  5: [],
};

const isDraftStatus = (status) =>
  String(status ?? "").trim().toLowerCase() === APPLICATION_STATUS.DRAFT.toLowerCase();

const isRejectedStatus = (status) =>
  String(status ?? "").trim().toLowerCase() === APPLICATION_STATUS.REJECTED.toLowerCase();

const buildCourseConflictMessage = (courseName, conflict) => {
  const label = courseName || "this course";
  const appIdLabel = conflict?.appId ? ` (#${conflict.appId})` : "";
  if (conflict?.isRejected) {
    return `You cannot apply again for ${label}. Your previous application${appIdLabel} was rejected.`;
  }
  return `You already applied for ${label}${appIdLabel}. Please choose a different course.`;
};

const toDateInputValue = (value) => {
  if (!value) {
    return "";
  }
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return parsed.toISOString().slice(0, 10);
};

const NewApplicationPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, updateUser } = useAuth();

  const requestedDraftId = Number(searchParams.get("draftId"));
  const isDraftEditMode = Number.isFinite(requestedDraftId) && requestedDraftId > 0;

  const [activeStep, setActiveStep] = useState(0);
  const [draftApp, setDraftApp] = useState(null);
  const [docType, setDocType] = useState(DOCUMENT_TYPES[0]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lastPayment, setLastPayment] = useState(null);
  const maxDob = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const { data: courses = [], isLoading: coursesLoading } = useCoursesQuery();
  const { data: existingDraft, isLoading: existingDraftLoading, error: existingDraftError } = useApplicationByIdQuery(
    isDraftEditMode ? requestedDraftId : null,
  );
  const { data: studentApplications = [] } = useStudentApplicationsQuery(user?.userId);
  const { data: documents = [] } = useApplicationDocumentsQuery(draftApp?.appId);
  const { data: payments = [] } = useApplicationPaymentsQuery(draftApp?.appId);

  const createApplicationMutation = useCreateApplicationMutation();
  const updateApplicationMutation = useUpdateApplicationMutation();
  const uploadDocumentMutation = useUploadDocumentMutation();
  const deleteDocumentMutation = useDeleteDocumentMutation();
  const createPaymentMutation = useCreatePaymentMutation();

  const {
    control,
    register,
    handleSubmit,
    reset,
    trigger,
    getValues,
    formState: { errors },
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      dob: toDateInputValue(user?.dob),
      address: "",
      percentage: "",
      subjects: "",
      courseId: "",
      payMethod: PAYMENT_METHODS[0],
      amount: DEFAULT_APPLICATION_FEE,
    },
  });

  const watchedCourseId = watch("courseId");
  const watchedName = watch("name");
  const watchedEmail = watch("email");

  useEffect(() => {
    if (!isDraftEditMode || existingDraftLoading) {
      return;
    }

    if (existingDraftError || !existingDraft) {
      toast.error("Draft application not found.");
      navigate("/student/applications");
    }
  }, [existingDraft, existingDraftError, existingDraftLoading, isDraftEditMode, navigate]);

  useEffect(() => {
    if (!isDraftEditMode || !existingDraft) {
      return;
    }

    if (draftApp?.appId && Number(draftApp.appId) === Number(existingDraft.appId)) {
      return;
    }

    const isOwnDraft = Number(existingDraft?.user?.userId) === Number(user?.userId);
    if (!isOwnDraft) {
      toast.error("You can edit only your own drafts.");
      navigate("/student/applications");
      return;
    }

    if (!isDraftStatus(existingDraft?.status)) {
      toast.info("Only draft applications can be edited.");
      navigate(`/student/applications/${existingDraft.appId}`);
      return;
    }

    setDraftApp(existingDraft);
    reset({
      name: user?.name || "",
      email: user?.email || "",
      dob: toDateInputValue(existingDraft?.dob || existingDraft?.user?.dob || existingDraft?.student?.dob || getValues("dob")),
      address: existingDraft?.address || "",
      percentage: existingDraft?.percentage ?? "",
      subjects: existingDraft?.subjects || getValues("subjects") || "",
      courseId: Number(existingDraft?.course?.courseId ?? existingDraft?.course?.couId) || "",
      payMethod: PAYMENT_METHODS[0],
      amount: DEFAULT_APPLICATION_FEE,
    });
  }, [draftApp?.appId, existingDraft, getValues, isDraftEditMode, navigate, reset, user?.email, user?.name, user?.userId]);

  const selectedCourse = useMemo(
    () => courses.find((item) => Number(item.courseId) === Number(watchedCourseId)),
    [courses, watchedCourseId],
  );
  const currentApplicationId = Number(draftApp?.appId || (isDraftEditMode ? requestedDraftId : null));
  const policyRelevantApplications = useMemo(
    () => studentApplications.filter((app) => Number(app?.appId) !== currentApplicationId),
    [currentApplicationId, studentApplications],
  );
  const hasReachedApplicationLimit = useMemo(
    () =>
      !currentApplicationId &&
      studentApplications.length >= MAX_APPLICATIONS_PER_STUDENT,
    [currentApplicationId, studentApplications.length],
  );
  const courseConflictMap = useMemo(() => {
    const conflicts = new Map();
    policyRelevantApplications.forEach((app) => {
      const courseId = Number(app?.course?.courseId ?? app?.course?.couId);
      if (!Number.isFinite(courseId) || courseId <= 0) {
        return;
      }

      const current = conflicts.get(courseId);
      const candidate = {
        appId: app?.appId ?? null,
        status: app?.status ?? "",
        isRejected: isRejectedStatus(app?.status),
      };
      if (!current || (candidate.isRejected && !current.isRejected)) {
        conflicts.set(courseId, candidate);
      }
    });
    return conflicts;
  }, [policyRelevantApplications]);
  const selectedCourseConflict = useMemo(() => {
    const selectedCourseId = Number(watchedCourseId);
    if (!Number.isFinite(selectedCourseId) || selectedCourseId <= 0) {
      return null;
    }
    return courseConflictMap.get(selectedCourseId) || null;
  }, [courseConflictMap, watchedCourseId]);
  const hasReachedDraftDocumentLimit = isDraftEditMode && documents.length >= 1;

  const ensureDraftApplication = async () => {
    if (draftApp?.appId) {
      return draftApp;
    }

    if (hasReachedApplicationLimit) {
      throw new Error(`You can submit a maximum of ${MAX_APPLICATIONS_PER_STUDENT} applications.`);
    }

    if (selectedCourseConflict) {
      throw new Error(buildCourseConflictMessage(selectedCourse?.courseName, selectedCourseConflict));
    }

    const values = getValues();
    const payload = {
      user: {
        userId: user?.userId,
        name: values.name,
        email: values.email,
      },
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

    if (hasReachedApplicationLimit && !draftApp?.appId) {
      toast.error(`You can submit a maximum of ${MAX_APPLICATIONS_PER_STUDENT} applications.`);
      return;
    }

    if (activeStep === 0) {
      const values = getValues();
      if (values.name !== user?.name || values.email !== user?.email || values.dob !== user?.dob) {
        updateUser({
          name: values.name,
          email: values.email,
          dob: toDateInputValue(values.dob),
        });
      }
    }

    if (activeStep === 2) {
      if (selectedCourseConflict) {
        toast.error(buildCourseConflictMessage(selectedCourse?.courseName, selectedCourseConflict));
        return;
      }
      try {
        const app = await ensureDraftApplication();
        const values = getValues();
        const updatedDraft = await updateApplicationMutation.mutateAsync({
          appId: app.appId,
          payload: {
            user: { userId: user?.userId },
            address: values.address,
            percentage: Number(values.percentage),
            course: { courseId: Number(values.courseId) },
            status: APPLICATION_STATUS.DRAFT,
          },
        });
        setDraftApp(updatedDraft);
      } catch (error) {
        const draftErrorMessage =
          error?.response?.data?.message ||
          (typeof error?.response?.data === "string" ? error.response.data : null) ||
          error?.message ||
          "Could not save application draft.";
        toast.error(draftErrorMessage);
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
    if (hasReachedDraftDocumentLimit) {
      toast.info("Only one document can be uploaded while editing a draft application.");
      return;
    }

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
      const uploadErrorMessage =
        error?.response?.data?.message ||
        (typeof error?.response?.data === "string" ? error.response.data : null) ||
        error?.message ||
        "Document upload failed.";
      toast.error(uploadErrorMessage);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!documentId) {
      return;
    }

    const confirmed = window.confirm("Delete this document?");
    if (!confirmed) {
      return;
    }

    try {
      await deleteDocumentMutation.mutateAsync(documentId);
      setSelectedFile(null);
      toast.success("Document deleted.");
    } catch (error) {
      const deleteErrorMessage =
        error?.response?.data?.message ||
        (typeof error?.response?.data === "string" ? error.response.data : null) ||
        error?.message ||
        "Document deletion failed.";
      toast.error(deleteErrorMessage);
    }
  };

  const handleProcessPayment = async () => {
    const valid = await trigger(stepFields[4]);
    if (!valid) {
      return;
    }

    if (payments.length > 0 || lastPayment) {
      toast.info("Payment already completed for this application.");
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
      const paymentErrorMessage =
        error?.response?.data?.message ||
        (typeof error?.response?.data === "string" ? error.response.data : null) ||
        error?.message ||
        "Payment could not be processed.";
      toast.error(paymentErrorMessage);
    }
  };

  const handleFinalSubmit = async (values) => {
    try {
      const app = await ensureDraftApplication();
      const submitted = await updateApplicationMutation.mutateAsync({
        appId: app.appId,
        payload: {
          user: { userId: user?.userId },
          course: { courseId: Number(values.courseId) },
          status: APPLICATION_STATUS.SUBMITTED,
          percentage: Number(values.percentage),
          address: values.address,
        },
      });

      toast.success(`Application submitted. ID: ${submitted.appId}`);
      navigate(`/student/applications/${submitted.appId}`);
    } catch (error) {
      const submitErrorMessage =
        error?.response?.data?.message ||
        (typeof error?.response?.data === "string" ? error.response.data : null) ||
        error?.message ||
        "Could not submit application.";
      toast.error(submitErrorMessage);
    }
  };

  const handleSubmitErrors = (formErrors) => {
    const fieldOrder = [
      "name",
      "email",
      "dob",
      "address",
      "percentage",
      "subjects",
      "courseId",
      "payMethod",
      "amount",
    ];
    const firstInvalidField = fieldOrder.find((field) => formErrors?.[field]);
    const fieldToStep = {
      name: 0,
      email: 0,
      dob: 0,
      address: 0,
      percentage: 1,
      subjects: 1,
      courseId: 2,
      payMethod: 4,
      amount: 4,
    };

    if (firstInvalidField !== undefined) {
      const step = fieldToStep[firstInvalidField];
      if (Number.isInteger(step)) {
        setActiveStep(step);
      }
    }

    const message =
      (firstInvalidField && formErrors?.[firstInvalidField]?.message) ||
      "Please complete all required fields before submitting.";
    toast.error(message);
  };

  if (coursesLoading || (isDraftEditMode && existingDraftLoading && !draftApp)) {
    return <LoadingScreen label={isDraftEditMode ? "Loading draft application" : "Loading course catalog"} />;
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4">
              {isDraftEditMode ? `Edit Draft Application${draftApp?.appId ? ` #${draftApp.appId}` : ""}` : "New Application"}
            </Typography>
            <Typography color="text.secondary">
              {isDraftEditMode
                ? "Continue and update your draft, then complete payment and submit."
                : "Complete all steps, upload documents, make payment, and submit."}
            </Typography>
          </Box>

          {hasReachedApplicationLimit && (
            <Alert severity="error">
              You already have {studentApplications.length} applications. Maximum allowed is{" "}
              {MAX_APPLICATIONS_PER_STUDENT}.
            </Alert>
          )}

          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Stack
            spacing={2}
            component="form"
            onSubmit={handleSubmit(handleFinalSubmit, handleSubmitErrors)}
          >
            {activeStep === 0 && (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Name"
                    {...register("name")}
                    error={Boolean(errors.name)}
                    helperText={errors.name?.message}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Email"
                    {...register("email")}
                    error={Boolean(errors.email)}
                    helperText={errors.email?.message}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="dob"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        fullWidth
                        type="date"
                        label="Date of Birth"
                        InputLabelProps={{ shrink: true }}
                        value={field.value ?? ""}
                        onChange={(event) => field.onChange(event.target.value)}
                        inputProps={{ max: maxDob }}
                        error={Boolean(errors.dob)}
                        helperText={errors.dob?.message}
                      />
                    )}
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
                          {courses.map((course) => {
                            const courseConflict = courseConflictMap.get(Number(course.courseId));
                            const conflictSuffix = courseConflict
                              ? courseConflict.isRejected
                                ? " - Rejected earlier"
                                : " - Already applied"
                              : "";
                            return (
                              <MenuItem
                                key={course.courseId}
                                value={course.courseId}
                                disabled={Boolean(courseConflict)}
                              >
                                {`${course.courseName} (${course.courseType})${conflictSuffix}`}
                              </MenuItem>
                            );
                          })}
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
                  {selectedCourseConflict ? (
                    <Alert severity={selectedCourseConflict.isRejected ? "error" : "warning"}>
                      {buildCourseConflictMessage(selectedCourse?.courseName, selectedCourseConflict)}
                    </Alert>
                  ) : (
                    <Alert severity="info">
                      Draft application will be generated once you proceed to document upload.
                    </Alert>
                  )}
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
                {hasReachedDraftDocumentLimit && (
                  <Alert severity="info">Only one document is allowed. Delete an existing document to upload another.</Alert>
                )}

                <Grid container spacing={2} alignItems="center">
                  <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth>
                      <InputLabel id="doc-type-label">Document Type</InputLabel>
                      <Select
                        labelId="doc-type-label"
                        label="Document Type"
                        value={docType}
                        disabled={hasReachedDraftDocumentLimit}
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
                      disabled={hasReachedDraftDocumentLimit}
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
                      disabled={uploadDocumentMutation.isPending || !selectedFile || hasReachedDraftDocumentLimit}
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
                      <ListItem key={item.documentId} sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                        <ListItemText
                          primary={item.docType}
                          secondary={`Document ID: ${item.documentId}`}
                        />
                        {isDraftEditMode && (
                          <Button
                            color="error"
                            variant="outlined"
                            size="small"
                            onClick={() => handleDeleteDocument(item.documentId)}
                            disabled={deleteDocumentMutation.isPending}
                          >
                            Delete
                          </Button>
                        )}
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
                      InputProps={{ readOnly: true }}
                      error={Boolean(errors.amount)}
                      helperText={errors.amount?.message}
                    />
                  </Grid>
                </Grid>

                <Button
                  startIcon={<PaymentIcon />}
                  onClick={handleProcessPayment}
                  disabled={createPaymentMutation.isPending || payments.length > 0 || Boolean(lastPayment)}
                >
                  {createPaymentMutation.isPending
                    ? "Processing..."
                    : payments.length > 0 || lastPayment
                      ? "Payment Completed"
                      : "Pay Application Fee"}
                </Button>

                {payments.length > 0 && (
                  <List>
                    {payments.map((payment) => (
                      <ListItem key={payment.paymentId}>
                        <ListItemText
                          primary={`₹${payment.amount} | ${payment.payMethod}`}
                          secondary={`Status: ${payment.status} | ${formatDateOrDateTime(
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
                    <Typography>{watchedName || "-"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography>{watchedEmail || "-"}</Typography>
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
                <Button
                  onClick={handleNext}
                  disabled={hasReachedApplicationLimit && !draftApp?.appId}
                >
                  Next
                </Button>
              )}
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default NewApplicationPage;


