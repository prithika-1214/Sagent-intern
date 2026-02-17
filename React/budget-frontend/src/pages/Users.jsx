import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { toast } from 'react-toastify';
import { deleteUser, getUserById, getUsers, updateUser } from '../api/usersApi';
import ConfirmDialog from '../components/ConfirmDialog';
import Loading from '../components/Loading';
import { getErrorMessage, getId, isValidEmail, normalizeArray, required } from '../utils/format';
import { useActiveUser } from '../context/ActiveUserContext';

const initialEditState = {
  id: null,
  name: '',
  email: '',
  password: ''
};

const Users = () => {
  const navigate = useNavigate();
  const { activeUser, setActiveUser, clearActiveUser } = useActiveUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editState, setEditState] = useState(initialEditState);
  const [editErrors, setEditErrors] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const findMatchingUser = (allUsers, currentUser) => {
    if (!currentUser) {
      return null;
    }

    const normalizedEmail = String(currentUser.email || '').trim().toLowerCase();
    const normalizedName = String(currentUser.name || '').trim().toLowerCase();

    if (normalizedEmail) {
      const emailMatch = allUsers.find((user) => String(user.email || '').trim().toLowerCase() === normalizedEmail);

      if (emailMatch) {
        return emailMatch;
      }
    }

    if (normalizedName) {
      const nameMatch = allUsers.find((user) => String(user.name || '').trim().toLowerCase() === normalizedName);

      if (nameMatch) {
        return nameMatch;
      }
    }

    return null;
  };

  const fetchUsers = async () => {
    setLoading(true);

    try {
      if (!activeUser) {
        setUsers([]);
        return;
      }

      if (activeUser?.id) {
        const response = await getUserById(activeUser.id);
        const singleUser = response?.data;

        if (singleUser && !Array.isArray(singleUser)) {
          setUsers([singleUser]);
          return;
        }
      }

      const allUsersResponse = await getUsers();
      const allUsers = normalizeArray(allUsersResponse.data);
      const matchedUser = findMatchingUser(allUsers, activeUser);

      if (matchedUser) {
        setActiveUser(matchedUser);
        setUsers([matchedUser]);
        return;
      }

      setUsers([activeUser]);
    } catch (error) {
      toast.error(getErrorMessage(error));
      setUsers(activeUser ? [activeUser] : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [activeUser?.id, activeUser?.email, activeUser?.name]);

  const activeUserId = useMemo(() => String(activeUser?.id ?? ''), [activeUser]);

  const handleOpenEdit = (user) => {
    setEditState({
      id: getId(user),
      name: user.name || '',
      email: user.email || '',
      password: ''
    });
    setEditErrors({});
    setDialogOpen(true);
  };

  const validateEdit = () => {
    const nextErrors = {};

    if (!required(editState.name)) {
      nextErrors.name = 'Name is required';
    }

    if (!required(editState.email)) {
      nextErrors.email = 'Email is required';
    } else if (!isValidEmail(editState.email)) {
      nextErrors.email = 'Enter a valid email address';
    }

    setEditErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSaveEdit = async () => {
    if (!editState.id) {
      toast.error('Cannot update user because user id is missing. Please clear and reselect active user.');
      return;
    }

    if (!validateEdit()) {
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: editState.name.trim(),
        email: editState.email.trim()
      };

      if (required(editState.password)) {
        payload.password = editState.password;
      }

      await updateUser(editState.id, payload);
      toast.success('User updated.');
      setDialogOpen(false);
      setEditState(initialEditState);
      await fetchUsers();

      if (String(activeUser?.id) === String(editState.id)) {
        setActiveUser({ ...(activeUser || {}), ...payload, id: editState.id });
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) {
      return;
    }

    if (!getId(deleteTarget)) {
      toast.error('Cannot delete user because user id is missing.');
      setDeleteTarget(null);
      return;
    }

    try {
      await deleteUser(getId(deleteTarget));

      if (String(activeUser?.id) === String(getId(deleteTarget))) {
        clearActiveUser();
      }

      toast.success('User deleted.');
      setDeleteTarget(null);
      await fetchUsers();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (loading) {
    return <Loading message="Loading users..." fullHeight />;
  }

  return (
    <Card elevation={2}>
      <CardContent>
        <Stack spacing={2.5}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="h5" gutterBottom>
                Users List
              </Typography>
              <Typography color="text.secondary">Only the signed-in active user profile is visible.</Typography>
            </Box>
            <Button variant="contained" onClick={() => navigate('/auth')}>
              Login / Register
            </Button>
          </Box>

          <Alert severity={activeUser ? 'success' : 'warning'}>
            {activeUser
              ? 'Showing only the signed-in active user profile.'
              : 'No active user selected. Register/sign in to continue.'}
          </Alert>

          {users.length === 0 ? (
            <Alert severity="warning">No user profile available. Register/sign in to continue.</Alert>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => {
                    const userId = getId(user);
                    const isActive = activeUser ? true : String(userId) === activeUserId;
                    const canMutate = Boolean(userId);

                    return (
                      <TableRow key={String(userId || user.email || user.name || 'active-user')} hover>
                        <TableCell>{user.name || '-'}</TableCell>
                        <TableCell>{user.email || '-'}</TableCell>
                        <TableCell>{isActive ? <Chip label="Active" color="success" size="small" /> : '-'}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button size="small" disabled={!canMutate} onClick={() => handleOpenEdit(user)}>
                              Edit
                            </Button>
                            <Button size="small" color="error" disabled={!canMutate} onClick={() => setDeleteTarget(user)}>
                              Delete
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          )}
        </Stack>
      </CardContent>

      <Dialog open={dialogOpen} onClose={saving ? undefined : () => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Name"
              name="name"
              value={editState.name}
              onChange={(event) => {
                const value = event.target.value;
                setEditState((prev) => ({ ...prev, name: value }));
                setEditErrors((prev) => ({ ...prev, name: '' }));
              }}
              error={Boolean(editErrors.name)}
              helperText={editErrors.name}
              fullWidth
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={editState.email}
              onChange={(event) => {
                const value = event.target.value;
                setEditState((prev) => ({ ...prev, email: value }));
                setEditErrors((prev) => ({ ...prev, email: '' }));
              }}
              error={Boolean(editErrors.email)}
              helperText={editErrors.email}
              fullWidth
            />
            <TextField
              label="Password (optional)"
              name="password"
              type="password"
              value={editState.password}
              onChange={(event) => setEditState((prev) => ({ ...prev, password: event.target.value }))}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={saving} onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSaveEdit} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete User"
        message={`Delete ${deleteTarget?.name || deleteTarget?.email || 'this user'}? This action cannot be undone.`}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteUser}
      />
    </Card>
  );
};

export default Users;
