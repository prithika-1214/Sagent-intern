import { useCallback, useMemo, useState } from 'react';
import AdminCrudPage from '../../components/admin/AdminCrudPage';
import { createUser, deleteUser, getUsers, updateUser } from '../../api/usersApi';
import { getStatusClassName } from '../../utils/status';
import { getValue } from '../../utils/entity';

const columns = [
  { key: 'user_id', label: 'User ID', render: (row) => getValue(row, ['user_id', 'id']) },
  { key: 'user_name', label: 'User Name' },
  { key: 'email', label: 'Email' },
  { key: 'mobile_number', label: 'Mobile' },
  { key: 'role', label: 'Role' },
  {
    key: 'account_status',
    label: 'Account Status',
    render: (row) => {
      const status = getValue(row, ['account_status'], 'UNKNOWN');
      return <span className={getStatusClassName(status)}>{status}</span>;
    }
  }
];

const fields = [
  { name: 'user_name', label: 'User Name', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'mobile_number', label: 'Mobile Number', required: true },
  {
    name: 'role',
    label: 'Role',
    type: 'select',
    required: true,
    options: [
      { value: 'USER', label: 'USER' },
      { value: 'ADMIN', label: 'ADMIN' }
    ]
  },
  {
    name: 'account_status',
    label: 'Account Status',
    type: 'select',
    required: true,
    options: [
      { value: 'ACTIVE', label: 'ACTIVE' },
      { value: 'INACTIVE', label: 'INACTIVE' }
    ]
  }
];

const ManageUsersPage = () => {
  const [emailQuery, setEmailQuery] = useState('');
  const normalizedEmailQuery = useMemo(() => emailQuery.trim().toLowerCase(), [emailQuery]);

  const filterRows = useCallback(
    (rows = []) => {
      if (!normalizedEmailQuery) {
        return rows;
      }

      return rows.filter((row) =>
        String(getValue(row, ['email'], '')).trim().toLowerCase().includes(normalizedEmailQuery)
      );
    },
    [normalizedEmailQuery]
  );

  const renderFilters = useCallback(
    () => (
      <div className="filter-grid single">
        <label className="field-group">
          <span className="field-label">Search Email</span>
          <input
            className="field-input"
            value={emailQuery}
            onChange={(event) => setEmailQuery(event.target.value)}
            placeholder="Enter email"
          />
        </label>
      </div>
    ),
    [emailQuery]
  );

  return (
    <AdminCrudPage
      title="Manage Users"
      columns={columns}
      fields={fields}
      fetchAll={getUsers}
      createItem={createUser}
      updateItem={updateUser}
      deleteItem={deleteUser}
      idKeys={['user_id', 'id']}
      showCreateButton={false}
      renderFilters={renderFilters}
      filterRows={filterRows}
      filterEmptyTitle="No users found"
      filterEmptyDescription={normalizedEmailQuery ? `No users match "${emailQuery.trim()}".` : undefined}
      pageSize={10}
    />
  );
};

export default ManageUsersPage;
