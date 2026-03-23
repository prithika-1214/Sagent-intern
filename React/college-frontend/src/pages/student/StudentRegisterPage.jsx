import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import * as yup from "yup";
import { useRegisterStudentMutation } from "../../hooks/useAuthApi";

const formatDobInput = (value) => {
  const digits = String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 8);

  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

const parseDob = (value) => {
  const [day, month, year] = String(value ?? "").split("/");
  const dd = Number(day);
  const mm = Number(month);
  const yyyy = Number(year);

  if (!Number.isInteger(dd) || !Number.isInteger(mm) || !Number.isInteger(yyyy)) {
    return null;
  }

  const parsed = new Date(Date.UTC(yyyy, mm - 1, dd));
  if (
    parsed.getUTCFullYear() !== yyyy ||
    parsed.getUTCMonth() + 1 !== mm ||
    parsed.getUTCDate() !== dd
  ) {
    return null;
  }

  const iso = `${String(yyyy).padStart(4, "0")}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  return { date: parsed, iso };
};

const isDobNotInFuture = (value) => {
  const parsed = parseDob(value);
  if (!parsed) {
    return false;
  }

  const today = new Date();
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return parsed.date.getTime() <= todayUtc;
};

const schema = yup.object({
  name: yup.string().trim().min(2).required("Name is required"),
  email: yup.string().email().required("Email is required"),
  dob: yup
    .string()
    .required("Date of birth is required")
    .matches(/^\d{2}\/\d{2}\/\d{4}$/, "Use DD/MM/YYYY")
    .test("valid-dob", "Enter a valid date of birth", (value) => (value ? Boolean(parseDob(value)) : false))
    .test("dob-not-future", "Date of birth cannot be in the future", (value) =>
      value ? isDobNotInFuture(value) : false,
    ),
  password: yup.string().min(6).required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords do not match")
    .required("Confirm your password"),
});

const StudentRegisterPage = () => {
  const navigate = useNavigate();
  const registerMutation = useRegisterStudentMutation();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      dob: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values) => {
    try {
      const parsedDob = parseDob(values.dob);
      if (!parsedDob) {
        toast.error("Enter a valid date of birth.");
        return;
      }

      await registerMutation.mutateAsync({
        name: values.name,
        email: values.email,
        dob: parsedDob.iso,
        password: values.password,
      });
      toast.success("Registration successful. Please log in.");
      navigate("/student/login");
    } catch (error) {
      const backendMessage =
        typeof error?.response?.data === "string"
          ? error.response.data
          : error?.response?.data?.message;
      toast.error(
        backendMessage ||
          error?.message ||
          "Registration failed. Backend returned unauthorized.",
      );
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", py: 6 }}>
      <Container maxWidth="sm">
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
              <Typography variant="h4">Student Registration</Typography>
              <Typography color="text.secondary">Create your account to start admission.</Typography>

              <TextField
                label="Full Name"
                {...register("name")}
                error={Boolean(errors.name)}
                helperText={errors.name?.message}
              />
              <TextField
                label="Email"
                {...register("email")}
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
              />
              <Controller
                name="dob"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Date of Birth"
                    placeholder="DD/MM/YYYY"
                    value={field.value || ""}
                    onChange={(event) => field.onChange(formatDobInput(event.target.value))}
                    error={Boolean(errors.dob)}
                    helperText={errors.dob?.message || "Format: DD/MM/YYYY"}
                    inputProps={{ inputMode: "numeric", maxLength: 10 }}
                  />
                )}
              />
              <TextField
                label="Password"
                type="password"
                {...register("password")}
                error={Boolean(errors.password)}
                helperText={errors.password?.message}
              />
              <TextField
                label="Confirm Password"
                type="password"
                {...register("confirmPassword")}
                error={Boolean(errors.confirmPassword)}
                helperText={errors.confirmPassword?.message}
              />

              <Button type="submit" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? "Creating..." : "Create Account"}
              </Button>

              <Typography variant="body2">
                Already registered? <Link component={RouterLink} to="/student/login">Student Login</Link>
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default StudentRegisterPage;
