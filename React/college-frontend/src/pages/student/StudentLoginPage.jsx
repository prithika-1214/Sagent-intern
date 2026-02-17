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
import { ROLES } from "../../constants/appConstants";
import { useAuth } from "../../context/AuthContext.jsx";
import { useStudentLoginMutation } from "../../hooks/useAuthApi";
import { normalizeRole } from "../../utils/authStorage";

const schema = yup.object({
  email: yup.string().email().required("Email is required"),
  password: yup.string().required("Password is required"),
});

const StudentLoginPage = () => {
  const navigate = useNavigate();
  const { loginWithUser } = useAuth();
  const loginMutation = useStudentLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values) => {
    try {
      const user = await loginMutation.mutateAsync(values);
      const role = normalizeRole(user.role);
      if (role !== ROLES.STUDENT) {
        toast.error("This account is not authorized for student portal.");
        return;
      }
      loginWithUser(user);
      toast.success("Login successful");
      navigate("/student");
    } catch (error) {
      const backendMessage =
        typeof error?.response?.data === "string"
          ? error.response.data
          : error?.response?.data?.message;
      toast.error(backendMessage || error?.message || "Login failed");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", py: 6 }}>
      <Container maxWidth="sm">
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
              <Typography variant="h4">Student Login</Typography>
              <TextField
                label="Email"
                {...register("email")}
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
              />
              <TextField
                label="Password"
                type="password"
                {...register("password")}
                error={Boolean(errors.password)}
                helperText={errors.password?.message}
              />
              <Button type="submit" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </Button>
              <Typography variant="body2">
                New student? <Link component={RouterLink} to="/student/register">Register here</Link>
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default StudentLoginPage;
