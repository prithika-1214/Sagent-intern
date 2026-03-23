import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
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
import { createMember } from "../../api/membersService";
import { createLibrarian } from "../../api/librariansService";

const schema = z.object({
  role: z.enum(["MEMBER", "LIBRARIAN"]),
  name: z.string().min(2, "Name is required."),
  email: z.string().email("Enter a valid email."),
  password: z.string().min(4, "Password must be at least 4 characters."),
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const [libraryId, setLibraryId] = useState(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      role: "MEMBER",
      name: "",
      email: "",
      password: "",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (values) => {
    try {
      const payload = {
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        contact: "",
      };

      const created =
        values.role === "LIBRARIAN" ? await createLibrarian(payload) : await createMember(payload);

      setLibraryId(created?.id ?? null);
      toast.success(`${values.role === "LIBRARIAN" ? "Librarian" : "Member"} registration successful.`);

      setTimeout(() => navigate("/login"), 1800);
    } catch (error) {
      toast.error(error.message || "Unable to register.");
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card elevation={0} sx={{ border: "1px solid #e4e8f0", borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {selectedRole === "LIBRARIAN" ? "Librarian Registration" : "Member Registration"}
          </Typography>
          <Typography color="text.secondary" mb={3}>
            Create your account to get a Library ID.
          </Typography>

          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={2.2}>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel id="register-role-label">Role</InputLabel>
                    <Select labelId="register-role-label" label="Role" {...field}>
                      <MenuItem value="MEMBER">Member</MenuItem>
                      <MenuItem value="LIBRARIAN">Librarian</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
              <TextField
                label="Name"
                fullWidth
                {...register("name")}
                error={Boolean(errors.name)}
                helperText={errors.name?.message}
              />
              <TextField
                label="Email"
                fullWidth
                {...register("email")}
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                {...register("password")}
                error={Boolean(errors.password)}
                helperText={errors.password?.message}
              />
              <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                Register
              </Button>
              <Button variant="text" onClick={() => navigate("/login")}>
                Continue to Login
              </Button>
            </Stack>
          </Box>

          {libraryId ? (
            <Alert severity="success" sx={{ mt: 3 }}>
              Your {selectedRole === "LIBRARIAN" ? "Librarian" : "Library"} ID: <strong>{libraryId}</strong>
            </Alert>
          ) : null}
        </CardContent>
      </Card>
    </Container>
  );
}
