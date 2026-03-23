import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  MenuItem,
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
import { createExpense, deleteExpense, getExpenses, updateExpense } from '../api/expensesApi';
import { getCategories } from '../api/categoriesApi';
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
  amount: '',
  date: toDateInputValue(new Date()),
  categoryId: '',
  description: ''
};

const Expenses = () => {
  const { activeUser } = useActiveUser();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [monthFilter, setMonthFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchData = async () => {
    setLoading(true);

    try {
      const [expenseResponse, categoriesResponse] = await Promise.all([getExpenses(), getCategories()]);

      const expenseRecords = normalizeArray(expenseResponse.data)
        .filter((item) => belongsToUser(item, activeUser?.id));

      const categoryRecords = normalizeArray(categoriesResponse.data)
        .filter((item) => belongsToUser(item, activeUser?.id));

      setExpenses(sortByDateDesc(expenseRecords, ['date', 'expenseDate', 'createdAt']));
      setCategories(categoryRecords);
    } catch (error) {
      toast.error(getErrorMessage(error));
      setExpenses([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeUser?.id]);

  const filteredExpenses = useMemo(() => {
    if (!monthFilter) {
      return expenses;
    }

    return expenses.filter((entry) => getMonthKey(getFirstDefined(entry, ['date', 'expenseDate', 'createdAt'], '')) === monthFilter);
  }, [expenses, monthFilter]);

  const totalExpenses = useMemo(
    () => filteredExpenses.reduce((sum, entry) => sum + toNumber(getFirstDefined(entry, ['amount', 'expenseAmount', 'value'], 0)), 0),
    [filteredExpenses]
  );
  const hasCategories = categories.length > 0;

  const findCategoryLabel = (expense) => {
    const rawCategory = expense?.category;
    const explicitName = getFirstDefined(expense, ['categoryName', 'expenseCategory', 'catName'], '');
    const categoryId = getFirstDefined(expense, ['categoryId', 'catId'], rawCategory?.id ?? rawCategory?.catId ?? null);

    if (rawCategory?.name || rawCategory?.catName) {
      return rawCategory.name || rawCategory.catName;
    }

    if (explicitName) {
      return explicitName;
    }

    if (typeof rawCategory === 'string') {
      return rawCategory;
    }

    if (categoryId !== null && categoryId !== undefined) {
      const match = categories.find((category) => String(getId(category)) === String(categoryId));
      return match?.name || match?.catName || String(categoryId);
    }

    return '-';
  };

  const resolveCategoryId = (expense) => {
    const directCategoryId = getFirstDefined(expense, ['categoryId', 'catId'], null);

    if (directCategoryId !== null && directCategoryId !== undefined) {
      return String(directCategoryId);
    }

    if (expense?.category?.id !== undefined && expense?.category?.id !== null) {
      return String(expense.category.id);
    }

    if (expense?.category?.catId !== undefined && expense?.category?.catId !== null) {
      return String(expense.category.catId);
    }

    const name = getFirstDefined(expense, ['categoryName', 'catName'], typeof expense?.category === 'string' ? expense.category : '');

    if (!name) {
      return '';
    }

    const match = categories.find(
      (category) => String(category.name || category.catName || '').toLowerCase() === String(name).toLowerCase()
    );

    return match ? String(getId(match)) : '';
  };

  const validate = () => {
    const nextErrors = {};

    if (!required(form.amount)) {
      nextErrors.amount = 'Amount is required';
    } else if (!isPositiveNumber(form.amount)) {
      nextErrors.amount = 'Amount must be numeric and non-negative';
    }

    if (!required(form.date)) {
      nextErrors.date = 'Date is required';
    }

    if (!required(form.categoryId)) {
      nextErrors.categoryId = 'Category is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetForm = () => {
    setForm(initialForm);
    setErrors({});
    setEditingId(null);
  };

  const buildExpensePayloads = () => {
    const selectedCategory = categories.find((category) => String(getId(category)) === String(form.categoryId));
    const categoryIdAsNumber = Number(form.categoryId);
    const categoryIdValue = Number.isNaN(categoryIdAsNumber) ? form.categoryId : categoryIdAsNumber;
    const expenseType = required(form.description) ? form.description.trim() : 'Expense';

    const basePayload = {
      amount: Number(form.amount),
      date: form.date,
      expenseDate: form.date,
      expenseType
    };

    if (required(form.description)) {
      basePayload.description = form.description.trim();
    }

    const categoryPayloads = [
      { ...basePayload, categoryId: categoryIdValue },
      { ...basePayload, category: { id: categoryIdValue } },
      { ...basePayload, category: { catId: categoryIdValue } },
      { ...basePayload, catId: categoryIdValue }
    ];

    if (selectedCategory?.name || selectedCategory?.catName) {
      const selectedName = selectedCategory.name || selectedCategory.catName;
      categoryPayloads.push({ ...basePayload, categoryName: selectedName });
      categoryPayloads.push({ ...basePayload, catName: selectedName });
    }

    return categoryPayloads.flatMap((payload) => buildUserAwarePayloads(payload, activeUser, expenses[0]));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setSaving(true);

    try {
      const payloads = buildExpensePayloads();

      await runWithPayloadFallbacks(
        (payload) => (editingId ? updateExpense(editingId, payload) : createExpense(payload)),
        payloads
      );

      toast.success(editingId ? 'Expense updated.' : 'Expense added.');
      resetForm();
      await fetchData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (entry) => {
    setEditingId(getId(entry));
    setForm({
      amount: String(getFirstDefined(entry, ['amount', 'expenseAmount', 'value'], '')),
      date: toDateInputValue(getFirstDefined(entry, ['date', 'expenseDate', 'createdAt'], '')),
      categoryId: resolveCategoryId(entry),
      description: getFirstDefined(entry, ['description', 'note', 'notes'], '')
    });
    setErrors({});
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteExpense(getId(deleteTarget));
      toast.success('Expense deleted.');
      setDeleteTarget(null);
      await fetchData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (loading) {
    return <Loading message="Loading expenses..." fullHeight />;
  }

  return (
    <Stack spacing={2.5}>
      <Card elevation={2}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5">Expense Logging</Typography>
            <Typography color="text.secondary">Track daily spending by category and monitor total expenses.</Typography>

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
                <Alert severity="error">
                  Total expenses {monthFilter ? `for ${monthFilter}` : '(all records)'}: <strong>{formatCurrency(totalExpenses)}</strong>
                </Alert>
              </Grid>
            </Grid>

            {!hasCategories && (
              <Alert severity="warning">No categories found for your account. Please create a category first.</Alert>
            )}

            <Divider />

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Amount"
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
                    select
                    fullWidth
                    label="Category"
                    value={form.categoryId}
                    onChange={(event) => {
                      setForm((prev) => ({ ...prev, categoryId: event.target.value }));
                      setErrors((prev) => ({ ...prev, categoryId: '' }));
                    }}
                    error={Boolean(errors.categoryId)}
                    helperText={errors.categoryId || (!hasCategories ? 'Create categories in the Categories page first.' : '')}
                    disabled={!hasCategories}
                  >
                    {!hasCategories && <MenuItem value="" disabled>No categories available</MenuItem>}
                    {categories.map((category) => (
                      <MenuItem key={getId(category)} value={String(getId(category))}>
                        {category.name || category.catName || `Category ${getId(category)}`}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={form.description}
                    onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <Button variant="contained" type="submit" disabled={saving}>
                      {saving ? 'Saving...' : editingId ? 'Update Expense' : 'Add Expense'}
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
            Expense Entries
          </Typography>

          {filteredExpenses.length === 0 ? (
            <Alert severity="info">No expense entries found for the selected criteria.</Alert>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Amount</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredExpenses.map((entry) => (
                    <TableRow key={getId(entry)} hover>
                      <TableCell>{formatCurrency(getFirstDefined(entry, ['amount', 'expenseAmount', 'value'], 0))}</TableCell>
                      <TableCell>{formatDate(getFirstDefined(entry, ['date', 'expenseDate', 'createdAt'], ''))}</TableCell>
                      <TableCell>{findCategoryLabel(entry)}</TableCell>
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
        title="Delete Expense"
        message="Are you sure you want to delete this expense entry?"
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  );
};

export default Expenses;
