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
import { useForm } from "react-hook-form";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import * as yup from "yup";
import { useRegisterStudentMutation } from "../../hooks/useAuthApi";

const schema = yup.object({
  name: yup.string().trim().min(2).required("Name is required"),
  email: yup.string().email().required("Email is required"),
  dob: yup.string().required("Date of birth is required"),
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
      await registerMutation.mutateAsync({
        name: values.name,
        email: values.email,
        dob: values.dob,
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
              <TextField
                type="date"
                label="Date of Birth"
                InputLabelProps={{ shrink: true }}
                {...register("dob")}
                error={Boolean(errors.dob)}
                helperText={errors.dob?.message}
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
