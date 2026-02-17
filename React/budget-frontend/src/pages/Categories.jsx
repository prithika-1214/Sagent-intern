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
import { createCategory, deleteCategory, getCategories, updateCategory } from '../api/categoriesApi';
import { getExpenses } from '../api/expensesApi';
import ConfirmDialog from '../components/ConfirmDialog';
import Loading from '../components/Loading';
import { useActiveUser } from '../context/ActiveUserContext';
import {
  belongsToUser,
  buildUserAwarePayloads,
  formatCurrency,
  getErrorMessage,
  getFirstDefined,
  getId,
  isPositiveNumber,
  normalizeArray,
  required,
  runWithPayloadFallbacks,
  toNumber
} from '../utils/format';

const initialForm = {
  name: '',
  limit: ''
};

const Categories = () => {
  const { activeUser } = useActiveUser();
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchData = async () => {
    setLoading(true);

    try {
      const [categoryResponse, expenseResponse] = await Promise.all([getCategories(), getExpenses()]);

      const categoryRecords = normalizeArray(categoryResponse.data)
        .filter((item) => belongsToUser(item, activeUser?.id));

      const expenseRecords = normalizeArray(expenseResponse.data)
        .filter((item) => belongsToUser(item, activeUser?.id));

      setCategories(categoryRecords);
      setExpenses(expenseRecords);
    } catch (error) {
      toast.error(getErrorMessage(error));
      setCategories([]);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeUser?.id]);

  const getCategoryLimit = (category) =>
    toNumber(getFirstDefined(category, ['limit', 'limitAmount', 'budgetLimit', 'monthlyLimit', 'budget', 'spendingLimit'], 0));

  const spendingMap = useMemo(() => {
    const map = {};

    categories.forEach((category) => {
      const categoryId = String(getId(category));
      const categoryName = String(getFirstDefined(category, ['name', 'categoryName', 'catName'], '')).toLowerCase();

      const spent = expenses.reduce((sum, expense) => {
        const amount = toNumber(getFirstDefined(expense, ['amount', 'expenseAmount', 'value'], 0));
        const expenseCategoryId = getFirstDefined(expense, ['categoryId', 'catId'], expense?.category?.id ?? expense?.category?.catId ?? null);
        const expenseCategoryName = String(
          getFirstDefined(expense, ['categoryName', 'expenseCategory', 'catName'], expense?.category?.name || expense?.category?.catName || expense?.category || '')
        ).toLowerCase();

        const idMatches = expenseCategoryId !== null && String(expenseCategoryId) === categoryId;
        const nameMatches = expenseCategoryName && categoryName && expenseCategoryName === categoryName;

        return idMatches || nameMatches ? sum + amount : sum;
      }, 0);

      map[categoryId] = spent;
    });

    return map;
  }, [categories, expenses]);

  const validate = () => {
    const nextErrors = {};

    if (!required(form.name)) {
      nextErrors.name = 'Category name is required';
    }

    if (required(form.limit) && !isPositiveNumber(form.limit)) {
      nextErrors.limit = 'Limit must be numeric and non-negative';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetForm = () => {
    setForm(initialForm);
    setErrors({});
    setEditingId(null);
  };

  const buildCategoryPayloads = () => {
    const normalizedName = form.name.trim();
    const limitValue = required(form.limit) ? Number(form.limit) : null;

    const namePayloads = [{ catName: normalizedName }, { name: normalizedName }, { categoryName: normalizedName }];

    const payloads = [];

    namePayloads.forEach((payload) => {
      payloads.push(payload);

      if (limitValue !== null) {
        payloads.push({ ...payload, limitAmount: limitValue });
        payloads.push({ ...payload, limit: limitValue });
        payloads.push({ ...payload, budgetLimit: limitValue });
        payloads.push({ ...payload, monthlyLimit: limitValue });
      }
    });

    return payloads.flatMap((payload) => buildUserAwarePayloads(payload, activeUser, categories[0]));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setSaving(true);

    try {
      const payloads = buildCategoryPayloads();

      await runWithPayloadFallbacks(
        (payload) => (editingId ? updateCategory(editingId, payload) : createCategory(payload)),
        payloads
      );

      toast.success(editingId ? 'Category updated.' : 'Category created.');
      resetForm();
      await fetchData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category) => {
    setEditingId(getId(category));
    setForm({
      name: getFirstDefined(category, ['name', 'categoryName', 'catName'], ''),
      limit: String(getCategoryLimit(category) || '')
    });
    setErrors({});
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteCategory(getId(deleteTarget));
      toast.success('Category deleted.');
      setDeleteTarget(null);
      await fetchData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (loading) {
    return <Loading message="Loading categories..." fullHeight />;
  }

  return (
    <Stack spacing={2.5}>
      <Card elevation={2}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5">Categories & Budgets</Typography>
            <Typography color="text.secondary">
              Create categories and set monthly spending limits. Progress bars show spending against each limit.
            </Typography>

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Grid container spacing={2}>
                <Grid item xs={12} md={5}>
                  <TextField
                    fullWidth
                    label="Category Name"
                    value={form.name}
                    onChange={(event) => {
                      setForm((prev) => ({ ...prev, name: event.target.value }));
                      setErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    error={Boolean(errors.name)}
                    helperText={errors.name}
                    placeholder="Food / Travel / Shopping"
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Monthly Budget Limit"
                    value={form.limit}
                    onChange={(event) => {
                      setForm((prev) => ({ ...prev, limit: event.target.value }));
                      setErrors((prev) => ({ ...prev, limit: '' }));
                    }}
                    error={Boolean(errors.limit)}
                    helperText={errors.limit || 'Optional if backend category has no budget field'}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <Stack direction={{ xs: 'column', sm: 'row', md: 'column' }} spacing={1}>
                    <Button variant="contained" type="submit" disabled={saving}>
                      {saving ? 'Saving...' : editingId ? 'Update Category' : 'Add Category'}
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
            Category Budgets
          </Typography>

          {categories.length === 0 ? (
            <Alert severity="info">No categories found. Create one to start categorizing expenses.</Alert>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell>Spent</TableCell>
                    <TableCell>Limit</TableCell>
                    <TableCell sx={{ minWidth: 180 }}>Usage</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.map((category) => {
                    const categoryId = String(getId(category));
                    const spent = toNumber(spendingMap[categoryId] || 0);
                    const limit = getCategoryLimit(category);
                    const usage = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;

                    return (
                      <TableRow key={categoryId} hover>
                        <TableCell>{getFirstDefined(category, ['name', 'categoryName', 'catName'], `Category ${categoryId}`)}</TableCell>
                        <TableCell>{formatCurrency(spent)}</TableCell>
                        <TableCell>{limit > 0 ? formatCurrency(limit) : '-'}</TableCell>
                        <TableCell>
                          {limit > 0 ? (
                            <Stack spacing={0.5}>
                              <LinearProgress
                                variant="determinate"
                                value={usage}
                                color={usage >= 90 ? 'error' : usage >= 70 ? 'warning' : 'primary'}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {usage.toFixed(0)}%
                              </Typography>
                            </Stack>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              No limit set
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button size="small" onClick={() => handleEdit(category)}>
                              Edit
                            </Button>
                            <Button size="small" color="error" onClick={() => setDeleteTarget(category)}>
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
        title="Delete Category"
        message="Delete this category? Related expenses may lose their category mapping."
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  );
};

export default Categories;
