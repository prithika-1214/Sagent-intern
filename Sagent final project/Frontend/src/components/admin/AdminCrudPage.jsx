import { useEffect, useMemo, useState } from 'react';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import Loader from '../common/Loader';
import ErrorState from '../common/ErrorState';
import AdminEntityForm from './AdminEntityForm';
import { getEntityId, getValue, normalizeArray } from '../../utils/entity';
import { useToast } from '../common/ToastProvider';

const getInitialValues = (fields) =>
  fields.reduce((acc, field) => {
    acc[field.name] = field.defaultValue ?? '';
    return acc;
  }, {});

const validateForm = (fields, values) => {
  const errors = {};

  fields.forEach((field) => {
    if (!field.required) {
      return;
    }

    const value = values[field.name];
    if (value === undefined || value === null || value === '') {
      errors[field.name] = `${field.label} is required`;
    }
  });

  return errors;
};

const resolveFieldsConfig = (fields, context) => {
  const resolvedFields = typeof fields === 'function' ? fields(context) : fields;
  return Array.isArray(resolvedFields) ? resolvedFields : [];
};

const AdminCrudPage = ({
  title,
  description,
  columns,
  fields,
  fetchAll,
  createItem,
  updateItem,
  deleteItem,
  idKeys = ['id'],
  mapColumns,
  showCreateButton = true,
  showEditAction = true,
  showDeleteAction = true,
  renderActions,
  pageSize,
  renderFilters,
  filterRows,
  filterEmptyTitle,
  filterEmptyDescription
}) => {
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formValues, setFormValues] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const hasRowActions = showEditAction || showDeleteAction;
  const resolvedFields = useMemo(
    () => resolveFieldsConfig(fields, { editingItem, formValues, rows, isEditing: Boolean(editingItem) }),
    [editingItem, fields, formValues, rows]
  );
  const createInitialValues = useMemo(
    () => getInitialValues(resolveFieldsConfig(fields, { editingItem: null, formValues: {}, rows, isEditing: false })),
    [fields, rows]
  );

  const resolvedColumns = useMemo(
    () =>
      (mapColumns ? mapColumns(columns) : columns).map((column) => ({
        ...column,
        render:
          column.render ||
          ((row) => {
            const value = getValue(row, [column.key]);
            return value?.toString?.() || '-';
          })
      })),
    [columns, mapColumns]
  );

  const displayedRows = useMemo(
    () => (typeof filterRows === 'function' ? filterRows(rows) : rows),
    [filterRows, rows]
  );

  const isFilteredEmptyState = rows.length > 0 && displayedRows.length === 0;

  const resolveId = (item) => {
    const value = getValue(item, idKeys);
    return value || getEntityId(item);
  };

  const loadRows = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetchAll();
      setRows(normalizeArray(response));
    } catch (err) {
      setError(err.message || `Failed to load ${title}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreateModal = () => {
    const values = { ...createInitialValues };
    setEditingItem(null);
    setFormValues(values);
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (item) => {
    const editFields = resolveFieldsConfig(fields, { editingItem: item, formValues: {}, rows, isEditing: true });
    const values = getInitialValues(editFields);
    editFields.forEach((field) => {
      const rawValue = getValue(item, [field.name], '');
      values[field.name] = field.toFormValue ? field.toFormValue(rawValue, item) : rawValue;
    });
    setEditingItem(item);
    setFormValues(values);
    setFormErrors({});
    setShowModal(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
    setFormErrors((current) => ({ ...current, [name]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errors = validateForm(resolvedFields, formValues);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      setSaving(true);
      if (editingItem) {
        await updateItem(resolveId(editingItem), formValues);
        toast.success(`${title} updated`);
      } else if (typeof createItem === 'function') {
        await createItem(formValues);
        toast.success(`${title} created`);
      } else {
        throw new Error('Create action is not available');
      }
      setShowModal(false);
      await loadRows();
    } catch (err) {
      toast.error(err.message || 'Unable to save record');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      return;
    }

    try {
      setDeleting(true);
      await deleteItem(resolveId(confirmDelete));
      toast.success(`${title} deleted`);
      setConfirmDelete(null);
      await loadRows();
    } catch (err) {
      toast.error(err.message || 'Unable to delete record');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <Loader text={`Loading ${title}...`} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadRows} />;
  }

  return (
    <section className="admin-page">
      <div className="section-head">
        <div>
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
        </div>
        {showCreateButton ? (
          <button type="button" className="btn btn-primary" onClick={openCreateModal}>
            Add New
          </button>
        ) : null}
      </div>

      {typeof renderFilters === 'function' ? renderFilters({ rows, displayedRows }) : null}

      <DataTable
        columns={resolvedColumns}
        rows={displayedRows}
        rowKey={(row, index) => resolveId(row) || index}
        pageSize={pageSize}
        emptyTitle={isFilteredEmptyState ? filterEmptyTitle || 'No matching records' : undefined}
        emptyDescription={isFilteredEmptyState ? filterEmptyDescription : undefined}
        actions={
          renderActions
            ? (row) =>
                renderActions(row, {
                  openEdit: () => openEditModal(row),
                  openDelete: () => setConfirmDelete(row),
                  showEditAction,
                  showDeleteAction
                })
            : hasRowActions
              ? (row) => (
                  <>
                    {showEditAction ? (
                      <button type="button" className="btn btn-small btn-outline" onClick={() => openEditModal(row)}>
                        Edit
                      </button>
                    ) : null}
                    {showDeleteAction ? (
                      <button type="button" className="btn btn-small btn-danger" onClick={() => setConfirmDelete(row)}>
                        Delete
                      </button>
                    ) : null}
                  </>
                )
              : undefined
        }
      />

      <Modal
        isOpen={showModal}
        title={editingItem ? `Edit ${title}` : `Create ${title}`}
        onClose={() => setShowModal(false)}
      >
        <AdminEntityForm
          fields={resolvedFields}
          values={formValues}
          errors={formErrors}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={() => setShowModal(false)}
          loading={saving}
          submitText={editingItem ? 'Update' : 'Create'}
        />
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(confirmDelete)}
        title="Delete Record"
        message="This will permanently remove the record. Continue?"
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        loading={deleting}
      />
    </section>
  );
};

export default AdminCrudPage;
