import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  LinearProgress,
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
import { createSavings, deleteSavings, getSavings, updateSavings } from '../api/savingsApi';
import ConfirmDialog from '../components/ConfirmDialog';
import Loading from '../components/Loading';
import { useActiveUser } from '../context/ActiveUserContext';
import {
  belongsToUser,
  buildUserAwarePayloads,
  formatCurrency,
  formatDate,
  getErrorMessage,
  getFirstDefined,
  getId,
  isPositiveNumber,
  normalizeArray,
  required,
  runWithPayloadFallbacks,
  sortByDateDesc,
  toDateInputValue,
  toNumber
} from '../utils/format';

const initialForm = {
  goalName: '',
  targetAmount: '',
  savedAmount: '',
  deadline: ''
};

const Savings = () => {
  const { activeUser } = useActiveUser();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchGoals = async () => {
    setLoading(true);

    try {
      const response = await getSavings();
      const records = normalizeArray(response.data)
        .filter((item) => belongsToUser(item, activeUser?.id));

      setGoals(sortByDateDesc(records, ['deadline', 'targetDate', 'dueDate', 'createdAt']));
    } catch (error) {
      toast.error(getErrorMessage(error));
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [activeUser?.id]);

  const validate = () => {
    const nextErrors = {};

    if (!required(form.goalName)) {
      nextErrors.goalName = 'Goal name is required';
    }

    if (!required(form.targetAmount)) {
      nextErrors.targetAmount = 'Target amount is required';
    } else if (!isPositiveNumber(form.targetAmount) || toNumber(form.targetAmount) <= 0) {
      nextErrors.targetAmount = 'Target amount must be a positive number';
    }

    if (required(form.savedAmount) && !isPositiveNumber(form.savedAmount)) {
      nextErrors.savedAmount = 'Saved amount must be numeric and non-negative';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetForm = () => {
    setForm(initialForm);
    setErrors({});
    setEditingId(null);
  };

  const buildSavingsPayloads = () => {
    const goalName = form.goalName.trim();
    const targetAmount = Number(form.targetAmount);
    const savedAmount = required(form.savedAmount) ? Number(form.savedAmount) : 0;

    const primaryPayload = {
      goalName,
      targetAmount,
      savedAmount
    };

    const alternatePayload = {
      name: goalName,
      target: targetAmount,
      saved: savedAmount
    };

    const thirdPayload = {
      goalName,
      targetAmount,
      currentAmount: savedAmount
    };

    if (required(form.deadline)) {
      primaryPayload.deadline = form.deadline;
      alternatePayload.targetDate = form.deadline;
      thirdPayload.dueDate = form.deadline;
    }

    return [primaryPayload, alternatePayload, thirdPayload].flatMap((payload) =>
      buildUserAwarePayloads(payload, activeUser, goals[0])
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setSaving(true);

    try {
      const payloads = buildSavingsPayloads();

      await runWithPayloadFallbacks(
        (payload) => (editingId ? updateSavings(editingId, payload) : createSavings(payload)),
        payloads
      );

      toast.success(editingId ? 'Savings goal updated.' : 'Savings goal created.');
      resetForm();
      await fetchGoals();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (goal) => {
    setEditingId(getId(goal));
    setForm({
      goalName: getFirstDefined(goal, ['goalName', 'name', 'title'], ''),
      targetAmount: String(getFirstDefined(goal, ['targetAmount', 'target', 'goalAmount'], '')),
      savedAmount: String(getFirstDefined(goal, ['savedAmount', 'saved', 'currentAmount'], '')),
      deadline: toDateInputValue(getFirstDefined(goal, ['deadline', 'targetDate', 'dueDate'], ''))
    });
    setErrors({});
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteSavings(getId(deleteTarget));
      toast.success('Savings goal deleted.');
      setDeleteTarget(null);
      await fetchGoals();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const totalSaved = useMemo(
    () => goals.reduce((sum, goal) => sum + toNumber(getFirstDefined(goal, ['savedAmount', 'saved', 'currentAmount'], 0)), 0),
    [goals]
  );

  if (loading) {
    return <Loading message="Loading savings goals..." fullHeight />;
  }

  return (
    <Stack spacing={2.5}>
      <Card elevation={2}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5">Savings Goals</Typography>
            <Typography color="text.secondary">
              Track savings targets with progress percentages and optional deadlines.
            </Typography>

            <Alert severity="success">
              Total saved across all goals: <strong>{formatCurrency(totalSaved)}</strong>
            </Alert>

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Goal Name"
                    value={form.goalName}
                    onChange={(event) => {
                      setForm((prev) => ({ ...prev, goalName: event.target.value }));
                      setErrors((prev) => ({ ...prev, goalName: '' }));
                    }}
                    error={Boolean(errors.goalName)}
                    helperText={errors.goalName}
                    placeholder="Emergency Fund"
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Target Amount"
                    value={form.targetAmount}
                    onChange={(event) => {
                      setForm((prev) => ({ ...prev, targetAmount: event.target.value }));
                      setErrors((prev) => ({ ...prev, targetAmount: '' }));
                    }}
                    error={Boolean(errors.targetAmount)}
                    helperText={errors.targetAmount}
                  />
                </Grid>

                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Saved Amount"
                    value={form.savedAmount}
                    onChange={(event) => {
                      setForm((prev) => ({ ...prev, savedAmount: event.target.value }));
                      setErrors((prev) => ({ ...prev, savedAmount: '' }));
                    }}
                    error={Boolean(errors.savedAmount)}
                    helperText={errors.savedAmount}
                  />
                </Grid>

                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Deadline"
                    value={form.deadline}
                    onChange={(event) => setForm((prev) => ({ ...prev, deadline: event.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} md={2}>
                  <Stack direction={{ xs: 'column', sm: 'row', md: 'column' }} spacing={1}>
                    <Button variant="contained" type="submit" disabled={saving}>
                      {saving ? 'Saving...' : editingId ? 'Update Goal' : 'Add Goal'}
                    </Button>
                    {editingId && (
                      <Button variant="outlined" onClick={resetForm}>
                        Cancel
                      </Button>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Goal Progress
          </Typography>

          {goals.length === 0 ? (
            <Alert severity="info">No savings goals found. Add your first goal to start tracking.</Alert>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Goal</TableCell>
                    <TableCell>Saved</TableCell>
                    <TableCell>Target</TableCell>
                    <TableCell>Deadline</TableCell>
                    <TableCell sx={{ minWidth: 180 }}>Progress</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {goals.map((goal) => {
                    const target = toNumber(getFirstDefined(goal, ['targetAmount', 'target', 'goalAmount'], 0));
                    const saved = toNumber(getFirstDefined(goal, ['savedAmount', 'saved', 'currentAmount'], 0));
                    const progress = target > 0 ? Math.min(100, (saved / target) * 100) : 0;

                    return (
                      <TableRow key={getId(goal)} hover>
                        <TableCell>{getFirstDefined(goal, ['goalName', 'name', 'title'], '-')}</TableCell>
                        <TableCell>{formatCurrency(saved)}</TableCell>
                        <TableCell>{formatCurrency(target)}</TableCell>
                        <TableCell>{formatDate(getFirstDefined(goal, ['deadline', 'targetDate', 'dueDate'], ''))}</TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <LinearProgress
                              variant="determinate"
                              value={progress}
                              color={progress >= 100 ? 'success' : progress >= 70 ? 'warning' : 'primary'}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {progress.toFixed(0)}%
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button size="small" onClick={() => handleEdit(goal)}>
                              Edit
                            </Button>
                            <Button size="small" color="error" onClick={() => setDeleteTarget(goal)}>
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
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Savings Goal"
        message="Are you sure you want to delete this savings goal?"
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  );
};

export default Savings;