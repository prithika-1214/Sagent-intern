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
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material';
import { toast } from 'react-toastify';
import { createUser, getUsers } from '../api/usersApi';
import { useActiveUser } from '../context/ActiveUserContext';
import { getErrorMessage, isValidEmail, normalizeArray, required } from '../utils/format';

const initialLogin = {
  email: '',
  password: ''
};

const initialRegister = {
  name: '',
  email: '',
  password: ''
};

const Auth = () => {
  const navigate = useNavigate();
  const { setActiveUser } = useActiveUser();

  const [tab, setTab] = useState(0);
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [loginErrors, setLoginErrors] = useState({});
  const [registerErrors, setRegisterErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateLogin = () => {
    const nextErrors = {};

    if (!required(loginForm.email)) {
      nextErrors.email = 'Email is required';
    } else if (!isValidEmail(loginForm.email)) {
      nextErrors.email = 'Enter a valid email address';
    }

    if (!required(loginForm.password)) {
      nextErrors.password = 'Password is required';
    }

    setLoginErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateRegister = () => {
    const nextErrors = {};

    if (!required(registerForm.name)) {
      nextErrors.name = 'Name is required';
    }

    if (!required(registerForm.email)) {
      nextErrors.email = 'Email is required';
    } else if (!isValidEmail(registerForm.email)) {
      nextErrors.email = 'Enter a valid email address';
    }

    if (!required(registerForm.password)) {
      nextErrors.password = 'Password is required';
    }

    setRegisterErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!validateLogin()) {
      return;
    }

    setLoading(true);

    try {
      const response = await getUsers();
      const users = normalizeArray(response.data);
      const email = loginForm.email.trim().toLowerCase();
      const password = loginForm.password;

      const matched = users.find(
        (user) => String(user.email || '').trim().toLowerCase() === email && String(user.password || '') === password
      );

      if (!matched) {
        toast.error('Invalid email or password.');
        return;
      }

      setActiveUser(matched);
      toast.success('Login successful.');
      navigate('/');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    if (!validateRegister()) {
      return;
    }

    setLoading(true);

    try {
      const email = registerForm.email.trim().toLowerCase();
      const usersResponse = await getUsers();
      const users = normalizeArray(usersResponse.data);

      const existing = users.find((user) => String(user.email || '').trim().toLowerCase() === email);

      if (existing) {
        toast.error('Email already exists. Please login.');
        setTab(0);
        setLoginForm((prev) => ({ ...prev, email: registerForm.email }));
        return;
      }

      const payload = {
        name: registerForm.name.trim(),
        email: registerForm.email.trim(),
        password: registerForm.password
      };

      const createResponse = await createUser(payload);
      let createdUser = createResponse?.data;

      if (!createdUser?.id && !createdUser?.userId) {
        const refreshUsersResponse = await getUsers();
        const refreshedUsers = normalizeArray(refreshUsersResponse.data);
        createdUser =
          refreshedUsers.find((user) => String(user.email || '').trim().toLowerCase() === email) || refreshedUsers.at(-1);
      }

      if (createdUser) {
        setActiveUser(createdUser);
      }

      toast.success('Registration successful.');
      navigate('/');
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
              User Access
            </Typography>
            <Typography color="text.secondary">
              Login with your existing account or register a new account to continue.
            </Typography>
          </Box>

          <Alert severity="info">User session is stored in localStorage. This app uses backend users endpoints only.</Alert>

          <Tabs value={tab} onChange={(_, next) => setTab(next)}>
            <Tab label="Login" />
            <Tab label="Register" />
          </Tabs>

          {tab === 0 ? (
            <Box component="form" onSubmit={handleLogin} noValidate>
              <Grid container spacing={2}>
                <Grid item xs={12} md={5}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={loginForm.email}
                    onChange={(event) => {
                      setLoginForm((prev) => ({ ...prev, email: event.target.value }));
                      setLoginErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    error={Boolean(loginErrors.email)}
                    helperText={loginErrors.email}
                  />
                </Grid>

                <Grid item xs={12} md={5}>
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={loginForm.password}
                    onChange={(event) => {
                      setLoginForm((prev) => ({ ...prev, password: event.target.value }));
                      setLoginErrors((prev) => ({ ...prev, password: '' }));
                    }}
                    error={Boolean(loginErrors.password)}
                    helperText={loginErrors.password}
                  />
                </Grid>

                <Grid item xs={12} md={2}>
                  <Button fullWidth type="submit" variant="contained" disabled={loading} sx={{ height: '56px' }}>
                    {loading ? 'Please wait...' : 'Login'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleRegister} noValidate>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={registerForm.name}
                    onChange={(event) => {
                      setRegisterForm((prev) => ({ ...prev, name: event.target.value }));
                      setRegisterErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    error={Boolean(registerErrors.name)}
                    helperText={registerErrors.name}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={registerForm.email}
                    onChange={(event) => {
                      setRegisterForm((prev) => ({ ...prev, email: event.target.value }));
                      setRegisterErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    error={Boolean(registerErrors.email)}
                    helperText={registerErrors.email}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={registerForm.password}
                    onChange={(event) => {
                      setRegisterForm((prev) => ({ ...prev, password: event.target.value }));
                      setRegisterErrors((prev) => ({ ...prev, password: '' }));
                    }}
                    error={Boolean(registerErrors.password)}
                    helperText={registerErrors.password}
                  />
                </Grid>

                <Grid item xs={12} md={1}>
                  <Button fullWidth type="submit" variant="contained" disabled={loading} sx={{ height: '56px' }}>
                    {loading ? '...' : 'Go'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default Auth;