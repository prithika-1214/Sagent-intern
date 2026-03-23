import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import toast from "react-hot-toast";
import { useAuth } from "../../auth/AuthContext";

const schema = z.object({
  role: z.enum(["MEMBER", "LIBRARIAN"]),
  libraryId: z
    .string()
    .min(1, "Library ID is required.")
    .regex(/^\d+$/, "Library ID must be numeric."),
  email: z.string().optional().refine((value) => !value || /\S+@\S+\.\S+/.test(value), {
    message: "Enter a valid email.",
  }),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticating } = useAuth();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      role: "MEMBER",
      libraryId: "",
      email: "",
    },
  });

  const onSubmit = async (values) => {
    try {
      const user = await login({
        role: values.role,
        libraryId: Number(values.libraryId),
        email: values.email?.trim(),
      });

      toast.success(`Welcome ${user.name}`);
      navigate(user.role === "LIBRARIAN" ? "/librarian/dashboard" : "/member/dashboard", {
        replace: true,
      });
    } catch (error) {
      toast.error(error.message || "Login failed.");
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card elevation={0} sx={{ border: "1px solid #e4e8f0", borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Library Login
          </Typography>
          <Typography color="text.secondary" mb={3}>
            Use your Library ID. Email is optional for extra validation.
          </Typography>

          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={2.2}>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel id="role-label">Role</InputLabel>
                    <Select labelId="role-label" label="Role" {...field}>
                      <MenuItem value="MEMBER">Member</MenuItem>
                      <MenuItem value="LIBRARIAN">Librarian</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />

              <TextField
                label="Library ID"
                fullWidth
                {...register("libraryId")}
                error={Boolean(errors.libraryId)}
                helperText={errors.libraryId?.message}
              />

              <TextField
                label="Email (optional)"
                fullWidth
                {...register("email")}
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
              />

              <Button type="submit" variant="contained" size="large" disabled={isAuthenticating}>
                {isAuthenticating ? "Signing In..." : "Login"}
              </Button>

              <Button variant="text" onClick={() => navigate("/register")}>
                New member? Register
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
