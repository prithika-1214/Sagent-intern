import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../../auth/AuthContext";
import { getLibraryId } from "../../utils/entityMappers";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(4, "Password must be at least 4 characters"),
  advancedJson: z
    .string()
    .optional()
    .refine((value) => {
      if (!value || !value.trim()) {
        return true;
      }
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    }, "Advanced JSON must be valid JSON"),
});

function RegisterPage() {
  const [registeredMember, setRegisteredMember] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const { registerMember } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      advancedJson: "",
    },
  });

  useEffect(() => {
    const subscription = watch(() => {
      if (submitError) {
        setSubmitError("");
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, submitError]);

  const onSubmit = async (values) => {
    setSubmitError("");
    try {
      let advancedPayload = {};
      try {
        advancedPayload = values.advancedJson?.trim() ? JSON.parse(values.advancedJson) : {};
      } catch {
        throw new Error("Advanced JSON is invalid.");
      }
      const createdMember = await registerMember({
        name: values.name,
        email: values.email,
        password: values.password,
        ...advancedPayload,
      });
      setRegisteredMember(createdMember);
      toast.success("Registration successful");
      reset();
    } catch (error) {
      const message = error.message || "Registration failed";
      setSubmitError(message);
    }
  };

  const libraryId = registeredMember ? getLibraryId(registeredMember) : null;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        p: 2,
        background: "linear-gradient(140deg, #e3f2fd 0%, #ffffff 60%, #fff8e1 100%)",
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 500 }}>
        <CardContent>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Member Registration
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Creates a member record via `POST /members`.
          </Typography>

          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={2}>
              <TextField
                label="Full Name"
                error={Boolean(errors.name)}
                helperText={errors.name?.message}
                {...register("name")}
              />
              <TextField
                label="Email"
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
                {...register("email")}
              />
              <TextField
                label="Password"
                type="password"
                error={Boolean(errors.password)}
                helperText={errors.password?.message}
                {...register("password")}
              />
              <TextField
                label="Advanced JSON (optional)"
                multiline
                minRows={4}
                error={Boolean(errors.advancedJson)}
                helperText={
                  errors.advancedJson?.message ||
                  "Add backend-specific required fields if your Member entity has extra columns."
                }
                {...register("advancedJson")}
              />
              <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                Create Account
              </Button>
            </Stack>
          </Box>

          {submitError ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {submitError}
            </Alert>
          ) : null}

          {registeredMember ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              Registration completed. Your Library ID is: <strong>{libraryId ?? "(check returned payload)"}</strong>
            </Alert>
          ) : null}

          <Typography variant="body2" sx={{ mt: 2 }}>
            Librarian signup? <Link to="/register/librarian">Register librarian</Link>
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Already have an account? <Link to="/login">Sign in</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default RegisterPage;
