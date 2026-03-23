import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import { toast } from 'react-toastify';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { getBalance } from '../api/balanceApi';
import { getCategories } from '../api/categoriesApi';
import { getExpenses } from '../api/expensesApi';
import { getIncome } from '../api/incomeApi';
import Loading from '../components/Loading';
import { useActiveUser } from '../context/ActiveUserContext';
import {
  belongsToUser,
  formatCurrency,
  formatDate,
  getErrorMessage,
  getFirstDefined,
  getId,
  getMonthKey,
  normalizeArray,
  toNumber
} from '../utils/format';

const pieColors = ['#1f5aa6', '#f57c00', '#2e7d32', '#7b1fa2', '#d84315', '#00838f', '#5d4037', '#558b2f'];

const SummaryCard = ({ title, value, subtitle, tone = 'primary' }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      border: '1px solid',
      borderColor: 'divider',
      background: tone === 'balance' ? 'linear-gradient(135deg, #f2f9ff, #ffffff)' : '#fff'
    }}
  >
    <Typography variant="body2" color="text.secondary" gutterBottom>
      {title}
    </Typography>
    <Typography variant="h5" sx={{ fontWeight: 800 }}>
      {value}
    </Typography>
    {subtitle && (
      <Typography variant="caption" color="text.secondary">
        {subtitle}
      </Typography>
    )}
  </Paper>
);

const Dashboard = () => {
  const { activeUser } = useActiveUser();
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);

    const [incomeResult, expenseResult, categoryResult, balanceResult] = await Promise.allSettled([
      getIncome(),
      getExpenses(),
      getCategories(),
      getBalance()
    ]);

    if (incomeResult.status === 'fulfilled') {
      const records = normalizeArray(incomeResult.value.data)
        .filter((item) => belongsToUser(item, activeUser?.id));
      setIncomes(records);
    } else {
      setIncomes([]);
      toast.error(`Income: ${getErrorMessage(incomeResult.reason)}`);
    }

    if (expenseResult.status === 'fulfilled') {
      const records = normalizeArray(expenseResult.value.data)
        .filter((item) => belongsToUser(item, activeUser?.id));
      setExpenses(records);
    } else {
      setExpenses([]);
      toast.error(`Expenses: ${getErrorMessage(expenseResult.reason)}`);
    }

    if (categoryResult.status === 'fulfilled') {
      const records = normalizeArray(categoryResult.value.data)
        .filter((item) => belongsToUser(item, activeUser?.id));
      setCategories(records);
    } else {
      setCategories([]);
      toast.error(`Categories: ${getErrorMessage(categoryResult.reason)}`);
    }

    if (balanceResult.status === 'fulfilled') {
      const records = normalizeArray(balanceResult.value.data)
        .filter((item) => belongsToUser(item, activeUser?.id));
      setBalances(records);
    } else {
      setBalances([]);
      toast.error(`Balance: ${getErrorMessage(balanceResult.reason)}`);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchDashboard();
  }, [activeUser?.id]);

  const totals = useMemo(() => {
    const totalIncome = incomes.reduce((sum, item) => sum + toNumber(getFirstDefined(item, ['amount', 'incomeAmount', 'value'], 0)), 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + toNumber(getFirstDefined(item, ['amount', 'expenseAmount', 'value'], 0)), 0);
    const computedBalance = totalIncome - totalExpenses;

    const backendBalanceRecord = balances.find((item) => belongsToUser(item, activeUser?.id)) || balances[0] || null;
    const backendBalance = backendBalanceRecord
      ? toNumber(getFirstDefined(backendBalanceRecord, ['balance', 'currentBalance', 'amount'], computedBalance))
      : computedBalance;

    return {
      totalIncome,
      totalExpenses,
      computedBalance,
      backendBalance,
      hasBackendBalance: Boolean(backendBalanceRecord)
    };
  }, [activeUser?.id, balances, expenses, incomes]);

  const categoryTotals = useMemo(() => {
    const grouped = {};

    expenses.forEach((expense) => {
      const categoryId = getFirstDefined(expense, ['categoryId'], expense?.category?.id ?? null);
      const categoryName = getFirstDefined(expense, ['categoryName'], expense?.category?.name || expense?.category || 'Uncategorized');
      const amount = toNumber(getFirstDefined(expense, ['amount', 'expenseAmount', 'value'], 0));

      let label = categoryName || 'Uncategorized';

      if (categoryId !== null && categoryId !== undefined) {
        const match = categories.find((category) => String(getId(category)) === String(categoryId));

        if (match?.name) {
          label = match.name;
        }
      }

      grouped[label] = (grouped[label] || 0) + amount;
    });

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [categories, expenses]);

  const monthlyTrend = useMemo(() => {
    const grouped = {};

    incomes.forEach((income) => {
      const month = getMonthKey(getFirstDefined(income, ['date', 'incomeDate', 'createdAt'], ''));

      if (!grouped[month]) {
        grouped[month] = { month, income: 0, expenses: 0 };
      }

      grouped[month].income += toNumber(getFirstDefined(income, ['amount', 'incomeAmount', 'value'], 0));
    });

    expenses.forEach((expense) => {
      const month = getMonthKey(getFirstDefined(expense, ['date', 'expenseDate', 'createdAt'], ''));

      if (!grouped[month]) {
        grouped[month] = { month, income: 0, expenses: 0 };
      }

      grouped[month].expenses += toNumber(getFirstDefined(expense, ['amount', 'expenseAmount', 'value'], 0));
    });

    return Object.values(grouped)
      .filter((item) => item.month !== 'unknown')
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [expenses, incomes]);

  const recentTransactions = useMemo(() => {
    const incomeItems = incomes.map((income) => ({
      id: `income-${getId(income)}`,
      type: 'Income',
      label: getFirstDefined(income, ['source', 'type', 'name', 'title'], 'Income'),
      amount: toNumber(getFirstDefined(income, ['amount', 'incomeAmount', 'value'], 0)),
      date: getFirstDefined(income, ['date', 'incomeDate', 'createdAt'], '')
    }));

    const expenseItems = expenses.map((expense) => ({
      id: `expense-${getId(expense)}`,
      type: 'Expense',
      label: getFirstDefined(
        expense,
        ['categoryName', 'description', 'expenseCategory'],
        expense?.category?.name || expense?.category || 'Expense'
      ),
      amount: toNumber(getFirstDefined(expense, ['amount', 'expenseAmount', 'value'], 0)),
      date: getFirstDefined(expense, ['date', 'expenseDate', 'createdAt'], '')
    }));

    return [...incomeItems, ...expenseItems]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }, [expenses, incomes]);

  if (loading) {
    return <Loading message="Preparing dashboard..." fullHeight />;
  }

  return (
    <Stack spacing={2.5}>
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Dashboard Overview
          </Typography>
          <Typography color="text.secondary">
            Welcome back, {activeUser?.name || activeUser?.email || 'User'}. Here is your budget summary.
          </Typography>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <SummaryCard title="Total Income" value={formatCurrency(totals.totalIncome)} />
        </Grid>
        <Grid item xs={12} md={4}>
          <SummaryCard title="Total Expenses" value={formatCurrency(totals.totalExpenses)} />
        </Grid>
        <Grid item xs={12} md={4}>
          <SummaryCard
            title="Balance"
            value={formatCurrency(totals.computedBalance)}
            subtitle={
              totals.hasBackendBalance ? `Backend /balance value: ${formatCurrency(totals.backendBalance)}` : 'Calculated as income - expenses'
            }
            tone="balance"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Expense by Category
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {categoryTotals.length === 0 ? (
                <Alert severity="info">No expense category data available.</Alert>
              ) : (
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryTotals} dataKey="value" nameKey="name" outerRadius={100} label>
                        {categoryTotals.map((entry, index) => (
                          <Cell key={`${entry.name}-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Trend
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {monthlyTrend.length === 0 ? (
                <Alert severity="info">Not enough dated records for trend chart.</Alert>
              ) : (
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="income" fill="#1f5aa6" name="Income" />
                      <Bar dataKey="expenses" fill="#f57c00" name="Expenses" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Transactions
          </Typography>
          <Divider sx={{ mb: 1 }} />
          {recentTransactions.length === 0 ? (
            <Alert severity="info">No transactions found yet. Add income or expense records to see recent activity.</Alert>
          ) : (
            <List dense>
              {recentTransactions.map((entry) => (
                <ListItem key={entry.id} divider>
                  <ListItemText
                    primary={`${entry.type}: ${entry.label}`}
                    secondary={formatDate(entry.date)}
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                  <Typography color={entry.type === 'Income' ? 'success.main' : 'error.main'} fontWeight={700}>
                    {entry.type === 'Income' ? '+' : '-'} {formatCurrency(entry.amount)}
                  </Typography>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
};

export default Dashboard;