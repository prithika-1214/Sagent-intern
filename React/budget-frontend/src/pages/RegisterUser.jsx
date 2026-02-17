import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { toast } from 'react-toastify';
import { createUser, getUsers } from '../api/usersApi';
import { isValidEmail, normalizeArray, required, getErrorMessage } from '../utils/format';
import { useActiveUser } from '../context/ActiveUserContext';

const initialForm = {
  name: '',
  email: '',
  password: ''
};

const RegisterUser = () => {
  const navigate = useNavigate();
  const { setActiveUser } = useActiveUser();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const nextErrors = {};

    if (!required(form.name)) {
      nextErrors.name = 'Name is required';
    }

    if (!required(form.email)) {
      nextErrors.email = 'Email is required';
    } else if (!isValidEmail(form.email)) {
      nextErrors.email = 'Enter a valid email address';
    }

    if (!required(form.password)) {
      nextErrors.password = 'Password is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password
      };

      const response = await createUser(payload);
      let createdUser = response?.data;

      if (!createdUser?.id) {
        const usersResponse = await getUsers();
        const users = normalizeArray(usersResponse.data);
        createdUser = users.find((user) => String(user.email).toLowerCase() === payload.email.toLowerCase()) || users.at(-1);
      }

      if (createdUser) {
        setActiveUser(createdUser);
      }

      toast.success('User created successfully and set as active user.');
      setForm(initialForm);
      navigate('/users');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card elevation={2}>
      <CardContent>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h5" gutterBottom>
              Register User
            </Typography>
            <Typography color="text.secondary">
              Create a new user profile. The new profile becomes the active user for income, expense, budget, and savings
              tracking.
            </Typography>
          </Box>

          <Alert severity="info">No authentication is required. User selection is managed using localStorage.</Alert>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  name="name"
                  label="Name"
                  value={form.name}
                  onChange={onChange}
                  error={Boolean(errors.name)}
                  helperText={errors.name}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  name="email"
                  type="email"
                  label="Email"
                  value={form.email}
                  onChange={onChange}
                  error={Boolean(errors.email)}
                  helperText={errors.email}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  name="password"
                  type="password"
                  label="Password"
                  value={form.password}
                  onChange={onChange}
                  error={Boolean(errors.password)}
                  helperText={errors.password}
                />
              </Grid>

              <Grid item xs={12}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <Button type="submit" variant="contained" disabled={loading}>
                    {loading ? 'Creating...' : 'Create User'}
                  </Button>
                  <Button variant="outlined" onClick={() => navigate('/users')}>
                    Go To Users List
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default RegisterUser;