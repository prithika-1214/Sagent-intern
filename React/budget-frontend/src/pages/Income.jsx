import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
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
import { createIncome, deleteIncome, getIncome, updateIncome } from '../api/incomeApi';
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
  getMonthKey,
  isPositiveNumber,
  normalizeArray,
  required,
  runWithPayloadFallbacks,
  sortByDateDesc,
  toDateInputValue,
  toNumber
} from '../utils/format';

const initialForm = {
  source: '',
  amount: '',
  date: toDateInputValue(new Date()),
  description: ''
};

const Income = () => {
  const { activeUser } = useActiveUser();
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [monthFilter, setMonthFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchIncome = async () => {
    setLoading(true);

    try {
      const response = await getIncome();
      const records = normalizeArray(response.data)
        .filter((item) => belongsToUser(item, activeUser?.id));

      setIncomes(sortByDateDesc(records, ['date', 'incomeDate', 'createdAt']));
    } catch (error) {
      toast.error(getErrorMessage(error));
      setIncomes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncome();
  }, [activeUser?.id]);

  const filteredIncome = useMemo(() => {
    if (!monthFilter) {
      return incomes;
    }

    return incomes.filter((entry) => getMonthKey(getFirstDefined(entry, ['date', 'incomeDate', 'createdAt'], '')) === monthFilter);
  }, [incomes, monthFilter]);

  const totalIncome = useMemo(
    () => filteredIncome.reduce((sum, entry) => sum + toNumber(getFirstDefined(entry, ['amount', 'incomeAmount', 'value'], 0)), 0),
    [filteredIncome]
  );

  const validate = () => {
    const nextErrors = {};

    if (!required(form.source)) {
      nextErrors.source = 'Income source is required';
    }

    if (!required(form.amount)) {
      nextErrors.amount = 'Amount is required';
    } else if (!isPositiveNumber(form.amount)) {
      nextErrors.amount = 'Amount must be numeric and non-negative';
    }

    if (!required(form.date)) {
      nextErrors.date = 'Date is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetForm = () => {
    setForm(initialForm);
    setErrors({});
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setSaving(true);

    try {
      const basePayload = {
        source: form.source.trim(),
        amount: Number(form.amount),
        date: form.date
      };

      if (required(form.description)) {
        basePayload.description = form.description.trim();
      }

      const payloads = buildUserAwarePayloads(basePayload, activeUser, incomes[0]);

      await runWithPayloadFallbacks(
        (payload) => (editingId ? updateIncome(editingId, payload) : createIncome(payload)),
        payloads
      );

      toast.success(editingId ? 'Income updated.' : 'Income added.');
      resetForm();
      await fetchIncome();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (entry) => {
    setEditingId(getId(entry));
    setForm({
      source: getFirstDefined(entry, ['source', 'type', 'name', 'title'], ''),
      amount: String(getFirstDefined(entry, ['amount', 'incomeAmount', 'value'], '')),
      date: toDateInputValue(getFirstDefined(entry, ['date', 'incomeDate', 'createdAt'], '')),
      description: getFirstDefined(entry, ['description', 'note', 'notes'], '')
    });
    setErrors({});
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteIncome(getId(deleteTarget));
      toast.success('Income deleted.');
      setDeleteTarget(null);
      await fetchIncome();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (loading) {
    return <Loading message="Loading income records..." fullHeight />;
  }

  return (
    <Stack spacing={2.5}>
      <Card elevation={2}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5">Income Tracking</Typography>
            <Typography color="text.secondary">Manage salary, freelance, and other income entries.</Typography>

            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Filter by Month"
                  type="month"
                  value={monthFilter}
                  onChange={(event) => setMonthFilter(event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={8}>
                <Alert severity="success">
                  Total income {monthFilter ? `for ${monthFilter}` : '(all records)'}: <strong>{formatCurrency(totalIncome)}</strong>
                </Alert>
              </Grid>
            </Grid>

            <Divider />

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Source"
                    name="source"
                    value={form.source}
                    onChange={(event) => {
                      setForm((prev) => ({ ...prev, source: event.target.value }));
                      setErrors((prev) => ({ ...prev, source: '' }));
                    }}
                    error={Boolean(errors.source)}
                    helperText={errors.source}
                    placeholder="Salary / Freelance / Other"
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Amount"
                    name="amount"
                    type="number"
                    value={form.amount}
                    onChange={(event) => {
                      setForm((prev) => ({ ...prev, amount: event.target.value }));
                      setErrors((prev) => ({ ...prev, amount: '' }));
                    }}
                    error={Boolean(errors.amount)}
                    helperText={errors.amount}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Date"
                    name="date"
                    type="date"
                    value={form.date}
                    onChange={(event) => {
                      setForm((prev) => ({ ...prev, date: event.target.value }));
                      setErrors((prev) => ({ ...prev, date: '' }));
                    }}
                    InputLabelProps={{ shrink: true }}
                    error={Boolean(errors.date)}
                    helperText={errors.date}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    value={form.description}
                    onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <Button variant="contained" type="submit" disabled={saving}>
                      {saving ? 'Saving...' : editingId ? 'Update Income' : 'Add Income'}
                    </Button>
                    {editingId && (
                      <Button variant="outlined" onClick={resetForm}>
                        Cancel Edit
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
            Income Entries
          </Typography>

          {filteredIncome.length === 0 ? (
            <Alert severity="info">No income entries found for the selected criteria.</Alert>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Source</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredIncome.map((entry) => (
                    <TableRow key={getId(entry)} hover>
                      <TableCell>{getFirstDefined(entry, ['source', 'type', 'name', 'title'], '-')}</TableCell>
                      <TableCell>{formatCurrency(getFirstDefined(entry, ['amount', 'incomeAmount', 'value'], 0))}</TableCell>
                      <TableCell>{formatDate(getFirstDefined(entry, ['date', 'incomeDate', 'createdAt'], ''))}</TableCell>
                      <TableCell>{getFirstDefined(entry, ['description', 'note', 'notes'], '-')}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button size="small" onClick={() => handleEdit(entry)}>
                            Edit
                          </Button>
                          <Button size="small" color="error" onClick={() => setDeleteTarget(entry)}>
                            Delete
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Income"
        message="Are you sure you want to delete this income entry?"
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  );
};

export default Income;