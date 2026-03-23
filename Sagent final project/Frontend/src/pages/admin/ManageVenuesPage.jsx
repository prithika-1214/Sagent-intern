import { useCallback, useMemo, useState } from 'react';
import AdminCrudPage from '../../components/admin/AdminCrudPage';
import { createVenue, deleteVenue, getVenues, updateVenue } from '../../api/venuesApi';
import { getValue } from '../../utils/entity';

const columns = [
  { key: 'venueId', label: 'Venue ID', render: (row) => getValue(row, ['venueId', 'venue_id', 'id']) },
  { key: 'venueName', label: 'Venue Name', render: (row) => getValue(row, ['venueName', 'venue_name']) },
  { key: 'venueType', label: 'Venue Type', render: (row) => getValue(row, ['venueType', 'venue_type']) },
  { key: 'address', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' }
];

const VENUE_TYPE_OPTIONS = [
  { value: 'MOVIE_VENUE', label: 'MOVIE_VENUE' },
  { value: 'CONCERT_VENUE', label: 'CONCERT_VENUE' },
  { value: 'HALL_VENUE', label: 'HALL_VENUE' }
];

const fields = [
  { name: 'venueName', label: 'Venue Name', required: true },
  {
    name: 'venueType',
    label: 'Venue Type',
    type: 'select',
    required: true,
    defaultValue: 'MOVIE_VENUE',
    options: VENUE_TYPE_OPTIONS
  },
  { name: 'address', label: 'Address', required: true },
  { name: 'city', label: 'City', required: true },
  { name: 'state', label: 'State', required: true }
];

const ManageVenuesPage = () => {
  const [venueNameQuery, setVenueNameQuery] = useState('');
  const normalizedVenueNameQuery = useMemo(() => venueNameQuery.trim().toLowerCase(), [venueNameQuery]);

  const filterRows = useCallback(
    (rows = []) => {
      if (!normalizedVenueNameQuery) {
        return rows;
      }

      return rows.filter((row) =>
        String(getValue(row, ['venueName', 'venue_name', 'name'], '')).trim().toLowerCase().includes(normalizedVenueNameQuery)
      );
    },
    [normalizedVenueNameQuery]
  );

  const renderFilters = useCallback(
    () => (
      <div className="filter-grid single">
        <label className="field-group">
          <span className="field-label">Search Venue Name</span>
          <input
            className="field-input"
            value={venueNameQuery}
            onChange={(event) => setVenueNameQuery(event.target.value)}
            placeholder="Enter venue name"
          />
        </label>
      </div>
    ),
    [venueNameQuery]
  );

  return (
    <AdminCrudPage
      title="Manage Venues"
      columns={columns}
      fields={fields}
      fetchAll={getVenues}
      createItem={createVenue}
      updateItem={updateVenue}
      deleteItem={deleteVenue}
      idKeys={['venueId', 'venue_id', 'id']}
      renderFilters={renderFilters}
      filterRows={filterRows}
      filterEmptyTitle="No venues found"
      filterEmptyDescription={
        normalizedVenueNameQuery ? `No venues match "${venueNameQuery.trim()}".` : undefined
      }
      pageSize={10}
    />
  );
};

export default ManageVenuesPage;
