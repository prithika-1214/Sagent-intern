import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../../auth/AuthContext";

const schema = z.object({
  rolePreference: z.enum(["AUTO", "MEMBER", "LIBRARIAN"]),
  identifier: z.string().min(1, "Library ID, Email, or User ID is required"),
  password: z.string().optional(),
});

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, role } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      rolePreference: "AUTO",
      identifier: "",
      password: "",
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate(role === "LIBRARIAN" ? "/librarian" : "/member", { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const onSubmit = async (values) => {
    try {
      const authResult = await login(values);
      toast.success("Login successful");
      const fallbackPath = authResult.role === "LIBRARIAN" ? "/librarian" : "/member";
      const requestedPath = location.state?.from?.pathname;
      navigate(requestedPath || fallbackPath, { replace: true });
    } catch (error) {
      toast.error(error.message || "Login failed");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        p: 2,
        background: "linear-gradient(120deg, #eceff1 0%, #ffffff 50%, #f0f4c3 100%)",
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 460 }}>
        <CardContent>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Library Login
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Sign in with Library ID, Email, or User ID. Password is checked when available in backend data.
          </Typography>

          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={2}>
              <TextField
                label="Login Mode"
                select
                defaultValue="AUTO"
                error={Boolean(errors.rolePreference)}
                helperText={errors.rolePreference?.message}
                {...register("rolePreference")}
              >
                <MenuItem value="AUTO">Auto Detect</MenuItem>
                <MenuItem value="MEMBER">Member</MenuItem>
                <MenuItem value="LIBRARIAN">Librarian</MenuItem>
              </TextField>

              <TextField
                label="Library ID / Email / User ID"
                error={Boolean(errors.identifier)}
                helperText={errors.identifier?.message}
                {...register("identifier")}
              />

              <TextField
                label="Password"
                type="password"
                error={Boolean(errors.password)}
                helperText={errors.password?.message || "Optional for ID-based fallback login"}
                {...register("password")}
              />

              <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                Sign In
              </Button>
            </Stack>
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            No auth endpoint found in backend controllers, so this app uses local auth fallback from `/members` and `/librarians`.
          </Alert>

          <Typography variant="body2" sx={{ mt: 2 }}>
            New member? <Link to="/register">Register here</Link>
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            New librarian? <Link to="/register/librarian">Register here</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default LoginPage;
