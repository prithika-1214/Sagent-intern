import { useEffect, useMemo, useState } from 'react';
import AdminEntityForm from '../../components/admin/AdminEntityForm';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { useToast } from '../../components/common/ToastProvider';
import { createSeat, deleteSeat, getSeats, updateSeat } from '../../api/seatsApi';
import { getVenues } from '../../api/venuesApi';
import { formatCurrency } from '../../utils/format';
import { getEntityId, getValue, normalizeArray } from '../../utils/entity';

const INITIAL_FORM_VALUES = {
  venue_id: '',
  seat_number: '',
  seat_row: '',
  seat_type: 'REGULAR',
  seat_price: '220'
};

const INITIAL_ROW_FORM_VALUES = {
  seat_row: '',
  seat_count: '6',
  start_number: '1',
  seat_type: 'REGULAR',
  seat_price: '220'
};

const INITIAL_CONCERT_FORM_VALUES = {
  venue_id: '',
  concert_category_name: '',
  seat_count: '100',
  seat_price: '799'
};

const SEAT_TYPE_OPTIONS = [
  { value: 'REGULAR', label: 'REGULAR' },
  { value: 'PREMIUM', label: 'PREMIUM' },
  { value: 'VIP', label: 'VIP' },
  { value: 'BALCONY', label: 'BALCONY' },
  { value: 'COUPLE', label: 'COUPLE' }
];

const DEFAULT_SEAT_PRICES = {
  REGULAR: 220,
  PREMIUM: 320,
  VIP: 220,
  BALCONY: 220,
  COUPLE: 220
};

const toText = (value) => String(value ?? '').trim();
const toUpperText = (value) => toText(value).toUpperCase();
const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const compareText = (first, second) => first.localeCompare(second, undefined, { numeric: true, sensitivity: 'base' });

const sortSeats = (first, second) => {
  const rowCompare = compareText(toUpperText(getValue(first, ['seat_row'])), toUpperText(getValue(second, ['seat_row'])));
  if (rowCompare !== 0) {
    return rowCompare;
  }

  return compareText(toUpperText(getValue(first, ['seat_number'])), toUpperText(getValue(second, ['seat_number'])));
};

const resolveSeatId = (seat) => getValue(seat, ['seat_id', 'id']) || getEntityId(seat);
const resolveVenueId = (venue) => getValue(venue, ['venue_id', 'id']) || getEntityId(venue);

const getVenueName = (venue, venueId) => toText(getValue(venue, ['venue_name', 'name'])) || `Venue ${venueId}`;
const getVenueType = (venue) => toUpperText(getValue(venue, ['venue_type', 'venueType'])) || 'MOVIE_VENUE';
const isGroundVenue = (venue) => getVenueType(venue) === 'CONCERT_VENUE';

const getVenueLocation = (venue) =>
  [getValue(venue, ['address']), getValue(venue, ['city']), getValue(venue, ['state'])].map(toText).filter(Boolean).join(', ');

const getDefaultSeatPrice = (seatType = 'REGULAR') => DEFAULT_SEAT_PRICES[toUpperText(seatType)] ?? DEFAULT_SEAT_PRICES.REGULAR;

const getSeatPriceAmount = (seat, fallbackSeatType = 'REGULAR') => {
  const seatPrice = Number(getValue(seat, ['seat_price', 'seatPrice']));
  return Number.isFinite(seatPrice) ? seatPrice : getDefaultSeatPrice(getValue(seat, ['seat_type', 'seatType']) || fallbackSeatType);
};

const isConcertCategorySeat = (seat) => Boolean(toText(getValue(seat, ['concert_category_name', 'concertCategoryName'])));

const getConcertCategoryName = (seat) => toText(getValue(seat, ['concert_category_name', 'concertCategoryName']));

const getSeatCountAmount = (seat) => {
  const seatCount = Number(getValue(seat, ['seat_count', 'seatCount'], 0));
  return Number.isFinite(seatCount) && seatCount > 0 ? Math.floor(seatCount) : 0;
};

const sortConcertCategories = (first, second) =>
  compareText(toUpperText(getConcertCategoryName(first)), toUpperText(getConcertCategoryName(second)));

const buildFormValues = (seat) => ({
  venue_id: toText(getValue(seat, ['venue_id'])),
  seat_number: toUpperText(getValue(seat, ['seat_number'])),
  seat_row: toUpperText(getValue(seat, ['seat_row'])),
  seat_type: toUpperText(getValue(seat, ['seat_type'])) || 'REGULAR',
  seat_price: toText(getValue(seat, ['seat_price'])) || String(getSeatPriceAmount(seat))
});

const buildConcertCategoryFormValues = (seat) => ({
  venue_id: toText(getValue(seat, ['venue_id'])),
  concert_category_name: getConcertCategoryName(seat),
  seat_count: toText(getValue(seat, ['seat_count', 'seatCount'])) || '1',
  seat_price: toText(getValue(seat, ['seat_price'])) || String(getSeatPriceAmount(seat))
});

const buildPayload = (values) => {
  const venueId = toNumber(values.venue_id);
  const seatPrice = Number(values.seat_price);

  return {
    venue_id: venueId ?? values.venue_id,
    seat_number: toUpperText(values.seat_number),
    seat_row: toUpperText(values.seat_row),
    seat_type: toUpperText(values.seat_type) || 'REGULAR',
    seat_price: Number.isFinite(seatPrice) ? seatPrice : values.seat_price
  };
};

const buildConcertCategoryPayload = (values) => {
  const venueId = toNumber(values.venue_id);
  const seatPrice = Number(values.seat_price);
  const seatCount = Number(values.seat_count);

  return {
    venue_id: venueId ?? values.venue_id,
    concert_category_name: toText(values.concert_category_name),
    seat_count: Number.isFinite(seatCount) ? seatCount : values.seat_count,
    seat_price: Number.isFinite(seatPrice) ? seatPrice : values.seat_price
  };
};

const getSeatNumberSuffix = (seatNumber, seatRow) => {
  const normalizedSeatNumber = toUpperText(seatNumber);
  const normalizedSeatRow = toUpperText(seatRow);

  if (!normalizedSeatRow || !normalizedSeatNumber.startsWith(normalizedSeatRow)) {
    return null;
  }

  const suffix = normalizedSeatNumber.slice(normalizedSeatRow.length);
  const parsed = Number(suffix);
  return Number.isFinite(parsed) ? parsed : null;
};

const getNextSeatNumberForRow = (venueSeats = [], seatRow = '') => {
  const normalizedSeatRow = toUpperText(seatRow);
  if (!normalizedSeatRow) {
    return '';
  }

  const nextNumber =
    venueSeats.reduce((highest, seat) => {
      const suffix = getSeatNumberSuffix(getValue(seat, ['seat_number']), normalizedSeatRow);
      return suffix && suffix > highest ? suffix : highest;
    }, 0) + 1;

  return `${normalizedSeatRow}${nextNumber}`;
};

const getSeatTypeForRow = (rowSeats = []) => {
  const normalizedTypes = rowSeats.map((seat) => toUpperText(getValue(seat, ['seat_type'])) || 'REGULAR').filter(Boolean);
  if (!normalizedTypes.length) {
    return 'REGULAR';
  }

  return normalizedTypes.every((seatType) => seatType === normalizedTypes[0]) ? normalizedTypes[0] : normalizedTypes[0];
};

const getStartNumberForRow = (rowSeats = [], seatRow = '') => {
  const normalizedSeatRow = toUpperText(seatRow);
  const suffixes = rowSeats
    .map((seat) => getSeatNumberSuffix(getValue(seat, ['seat_number']), normalizedSeatRow))
    .filter((suffix) => Number.isInteger(suffix))
    .sort((first, second) => first - second);

  return suffixes[0] || 1;
};

const getRowSeatPrice = (rowSeats = []) => {
  if (!rowSeats.length) {
    return getDefaultSeatPrice();
  }

  return getSeatPriceAmount(rowSeats[0]);
};

const ManageSeatsPage = () => {
  const toast = useToast();

  const [seats, setSeats] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [venueSearch, setVenueSearch] = useState('');
  const [seatSearch, setSeatSearch] = useState('');
  const [seatTypeFilter, setSeatTypeFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingSeat, setEditingSeat] = useState(null);
  const [formValues, setFormValues] = useState(INITIAL_FORM_VALUES);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showRowModal, setShowRowModal] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [rowFormValues, setRowFormValues] = useState(INITIAL_ROW_FORM_VALUES);
  const [rowFormErrors, setRowFormErrors] = useState({});
  const [savingRow, setSavingRow] = useState(false);
  const [showConcertModal, setShowConcertModal] = useState(false);
  const [editingConcertCategory, setEditingConcertCategory] = useState(null);
  const [concertFormValues, setConcertFormValues] = useState(INITIAL_CONCERT_FORM_VALUES);
  const [concertFormErrors, setConcertFormErrors] = useState({});
  const [savingConcertCategory, setSavingConcertCategory] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteRow, setConfirmDeleteRow] = useState(null);
  const [deletingRow, setDeletingRow] = useState(false);
  const [confirmDeleteConcertCategory, setConfirmDeleteConcertCategory] = useState(null);
  const [deletingConcertCategory, setDeletingConcertCategory] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [seatsResponse, venuesResponse] = await Promise.all([getSeats(), getVenues()]);
      setSeats(normalizeArray(seatsResponse));
      setVenues(normalizeArray(venuesResponse));
    } catch (loadError) {
      setError(loadError.message || 'Failed to load seats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const seatsByVenueId = useMemo(() => {
    const grouped = new Map();

    seats.forEach((seat) => {
      const venueId = toText(getValue(seat, ['venue_id']));
      if (!venueId) {
        return;
      }

      if (!grouped.has(venueId)) {
        grouped.set(venueId, []);
      }

      grouped.get(venueId).push(seat);
    });

    return grouped;
  }, [seats]);

  const venueCards = useMemo(() => {
    const venueMap = new Map();

    venues.forEach((venue) => {
      const venueId = toText(resolveVenueId(venue));
      if (!venueId) {
        return;
      }

      venueMap.set(venueId, venue);
    });

    seatsByVenueId.forEach((venueSeats, venueId) => {
      if (!venueMap.has(venueId)) {
        venueMap.set(venueId, { venue_id: venueId });
      }
    });

    return Array.from(venueMap.entries())
      .map(([venueId, venue]) => {
        const allVenueSeats = seatsByVenueId.get(venueId) || [];
        const venueSeats = allVenueSeats.filter((seat) => !isConcertCategorySeat(seat)).sort(sortSeats);
        const concertCategorySeats = allVenueSeats.filter((seat) => isConcertCategorySeat(seat)).sort(sortConcertCategories);
        const rows = Array.from(new Set(venueSeats.map((seat) => toUpperText(getValue(seat, ['seat_row']))).filter(Boolean))).sort(compareText);
        const groundVenue = isGroundVenue(venue);

        return {
          raw: venue,
          venueId,
          venueName: getVenueName(venue, venueId),
          location: getVenueLocation(venue),
          venueType: getVenueType(venue),
          isGroundVenue: groundVenue,
          seatCount: venueSeats.length,
          rowCount: rows.length,
          concertCategoryCount: concertCategorySeats.length,
          concertTicketCount: concertCategorySeats.reduce((sum, seat) => sum + getSeatCountAmount(seat), 0),
          seats: venueSeats,
          concertCategorySeats,
          rows
        };
      })
      .sort((first, second) => compareText(first.venueName, second.venueName));
  }, [venues, seatsByVenueId]);

  const normalizedVenueSearch = useMemo(() => toText(venueSearch).toLowerCase(), [venueSearch]);

  const filteredVenueCards = useMemo(() => {
    if (!normalizedVenueSearch) {
      return venueCards;
    }

    return venueCards.filter((venue) => venue.venueName.toLowerCase().includes(normalizedVenueSearch));
  }, [normalizedVenueSearch, venueCards]);

  const venueCardsForSelection = normalizedVenueSearch ? filteredVenueCards : venueCards;

  useEffect(() => {
    if (!venueCardsForSelection.length) {
      if (selectedVenueId) {
        setSelectedVenueId('');
      }
      return;
    }

    const hasCurrentVenue = venueCardsForSelection.some((venue) => venue.venueId === selectedVenueId);
    if (!hasCurrentVenue) {
      const nextVenue =
        venueCardsForSelection.find((venue) => (venue.isGroundVenue ? venue.concertCategoryCount > 0 : venue.seatCount > 0)) ||
        venueCardsForSelection[0];
      setSelectedVenueId(nextVenue.venueId);
    }
  }, [selectedVenueId, venueCardsForSelection]);

  const selectedVenue = useMemo(
    () => venueCardsForSelection.find((venue) => venue.venueId === selectedVenueId) || venueCardsForSelection[0] || null,
    [selectedVenueId, venueCardsForSelection]
  );

  const selectedVenueUsesConcertInventory = Boolean(selectedVenue?.isGroundVenue);

  const seatVenueOptions = useMemo(
    () =>
      venueCards
        .filter((venue) => !venue.isGroundVenue)
        .map((venue) => ({
          value: venue.venueId,
          label: `${venue.venueName} (ID: ${venue.venueId})`
        })),
    [venueCards]
  );

  const concertVenueOptions = useMemo(
    () =>
      venueCards
        .filter((venue) => venue.isGroundVenue)
        .map((venue) => ({
          value: venue.venueId,
          label: `${venue.venueName} (ID: ${venue.venueId})`
        })),
    [venueCards]
  );

  const formFields = useMemo(
    () => [
      {
        name: 'venue_id',
        label: 'Venue',
        type: 'select',
        required: true,
        options: seatVenueOptions,
        placeholder: seatVenueOptions.length ? 'Select venue' : 'No seated venues available'
      },
      { name: 'seat_number', label: 'Seat Number', required: true, placeholder: 'A1' },
      { name: 'seat_row', label: 'Seat Row', required: true, placeholder: 'A' },
      {
        name: 'seat_type',
        label: 'Seat Type',
        type: 'select',
        required: true,
        options: SEAT_TYPE_OPTIONS
      },
      { name: 'seat_price', label: 'Seat Price', type: 'number', required: true, min: 0, step: 0.01, placeholder: '220' }
    ],
    [seatVenueOptions]
  );

  const concertFormFields = useMemo(
    () => [
      {
        name: 'venue_id',
        label: 'Venue',
        type: 'select',
        required: true,
        options: concertVenueOptions,
        placeholder: concertVenueOptions.length ? 'Select ground venue' : 'No ground venues available'
      },
      { name: 'concert_category_name', label: 'Ticket Category', required: true, placeholder: 'VIP' },
      { name: 'seat_count', label: 'Tickets Per Slot', type: 'number', required: true, min: 1, placeholder: '100' },
      { name: 'seat_price', label: 'Ticket Price', type: 'number', required: true, min: 0, step: 0.01, placeholder: '799' }
    ],
    [concertVenueOptions]
  );

  const filteredSeats = useMemo(() => {
    const venueSeats = selectedVenue?.seats || [];
    const normalizedSearch = toUpperText(seatSearch);

    return venueSeats.filter((seat) => {
      const seatNumber = toUpperText(getValue(seat, ['seat_number']));
      const seatRow = toUpperText(getValue(seat, ['seat_row']));
      const seatType = toUpperText(getValue(seat, ['seat_type']));

      const matchesSearch =
        !normalizedSearch || seatNumber.includes(normalizedSearch) || seatRow.includes(normalizedSearch);
      const matchesType = seatTypeFilter === 'ALL' || seatType === seatTypeFilter;

      return matchesSearch && matchesType;
    });
  }, [seatSearch, seatTypeFilter, selectedVenue]);

  const groupedRows = useMemo(() => {
    const rows = new Map();

    filteredSeats.forEach((seat) => {
      const seatRow = toUpperText(getValue(seat, ['seat_row'])) || 'UNASSIGNED';
      if (!rows.has(seatRow)) {
        rows.set(seatRow, []);
      }

      rows.get(seatRow).push(seat);
    });

    return Array.from(rows.entries())
      .sort(([first], [second]) => compareText(first, second))
      .map(([seatRow, items]) => ({
        seatRow,
        items: items.slice().sort(sortSeats)
      }));
  }, [filteredSeats]);

  const hasFilters = Boolean(toText(seatSearch)) || seatTypeFilter !== 'ALL';

  const openCreateModal = (venueId = selectedVenue?.venueId || '', seatRow = '') => {
    const matchingVenue = venueCards.find((venue) => venue.venueId === venueId) || selectedVenue;
    const normalizedSeatRow = toUpperText(seatRow);
    const matchingRowSeats = (matchingVenue?.seats || []).filter(
      (seat) => toUpperText(getValue(seat, ['seat_row'])) === normalizedSeatRow
    );
    const defaultSeatType = matchingRowSeats.length ? getSeatTypeForRow(matchingRowSeats) : 'REGULAR';
    const defaultSeatPrice = matchingRowSeats.length ? getRowSeatPrice(matchingRowSeats) : getDefaultSeatPrice(defaultSeatType);

    setEditingSeat(null);
    setFormValues({
      ...INITIAL_FORM_VALUES,
      venue_id: venueId,
      seat_row: normalizedSeatRow,
      seat_number: normalizedSeatRow ? getNextSeatNumberForRow(matchingVenue?.seats || [], normalizedSeatRow) : '',
      seat_type: defaultSeatType,
      seat_price: String(defaultSeatPrice)
    });
    setFormErrors({});
    setShowModal(true);
  };

  const openCreateRowModal = () => {
    setEditingRow(null);
    setRowFormValues({
      ...INITIAL_ROW_FORM_VALUES,
      seat_price: String(getDefaultSeatPrice(INITIAL_ROW_FORM_VALUES.seat_type))
    });
    setRowFormErrors({});
    setShowRowModal(true);
  };

  const openCreateConcertCategoryModal = (venueId = selectedVenue?.venueId || '') => {
    setEditingConcertCategory(null);
    setConcertFormValues({
      ...INITIAL_CONCERT_FORM_VALUES,
      venue_id: venueId
    });
    setConcertFormErrors({});
    setShowConcertModal(true);
  };

  const openEditConcertCategoryModal = (seat) => {
    setEditingConcertCategory(seat);
    setConcertFormValues(buildConcertCategoryFormValues(seat));
    setConcertFormErrors({});
    setShowConcertModal(true);
  };

  const openEditRowModal = (seatRow, rowSeats) => {
    const sortedRowSeats = [...rowSeats].sort(sortSeats);

    setEditingRow({
      originalRow: seatRow,
      seatIds: sortedRowSeats.map((seat) => resolveSeatId(seat))
    });
    setRowFormValues({
      seat_row: seatRow,
      seat_count: String(sortedRowSeats.length || 1),
      start_number: String(getStartNumberForRow(sortedRowSeats, seatRow)),
      seat_type: getSeatTypeForRow(sortedRowSeats),
      seat_price: String(getRowSeatPrice(sortedRowSeats))
    });
    setRowFormErrors({});
    setShowRowModal(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
  };

  const closeRowModal = () => {
    if (savingRow) {
      return;
    }

    setEditingRow(null);
    setShowRowModal(false);
  };

  const closeConcertModal = () => {
    if (savingConcertCategory) {
      return;
    }

    setEditingConcertCategory(null);
    setShowConcertModal(false);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    const nextValue = name === 'seat_number' || name === 'seat_row' ? value.toUpperCase() : value;

    setFormValues((current) => {
      const nextValues = {
        ...current,
        [name]: nextValue
      };

      if (name === 'seat_type') {
        const previousDefaultPrice = String(getDefaultSeatPrice(current.seat_type));
        if (!toText(current.seat_price) || toText(current.seat_price) === previousDefaultPrice) {
          nextValues.seat_price = String(getDefaultSeatPrice(nextValue));
        }
      }

      return nextValues;
    });
    setFormErrors((current) => ({
      ...current,
      [name]: '',
      ...(name === 'seat_type' ? { seat_price: '' } : {})
    }));
  };

  const handleRowFormChange = (event) => {
    const { name, value } = event.target;
    const nextValue = name === 'seat_row' ? value.toUpperCase() : value;

    setRowFormValues((current) => {
      const nextValues = {
        ...current,
        [name]: nextValue
      };

      if (name === 'seat_type') {
        const previousDefaultPrice = String(getDefaultSeatPrice(current.seat_type));
        if (!toText(current.seat_price) || toText(current.seat_price) === previousDefaultPrice) {
          nextValues.seat_price = String(getDefaultSeatPrice(nextValue));
        }
      }

      return nextValues;
    });
    setRowFormErrors((current) => ({
      ...current,
      [name]: '',
      ...(name === 'seat_type' ? { seat_price: '' } : {})
    }));
  };

  const handleConcertFormChange = (event) => {
    const { name, value } = event.target;
    setConcertFormValues((current) => ({
      ...current,
      [name]: name === 'concert_category_name' ? value.toUpperCase() : value
    }));
    setConcertFormErrors((current) => ({
      ...current,
      [name]: ''
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!toText(formValues.venue_id)) {
      errors.venue_id = 'Venue is required';
    }

    if (!toUpperText(formValues.seat_number)) {
      errors.seat_number = 'Seat Number is required';
    }

    if (!toUpperText(formValues.seat_row)) {
      errors.seat_row = 'Seat Row is required';
    }

    if (!toUpperText(formValues.seat_type)) {
      errors.seat_type = 'Seat Type is required';
    }

    const seatPrice = Number(formValues.seat_price);
    if (!Number.isFinite(seatPrice) || seatPrice < 0) {
      errors.seat_price = 'Enter a valid seat price';
    }

    const currentSeatId = toText(resolveSeatId(editingSeat));
    const selectedVenueValue = toText(formValues.venue_id);
    const selectedSeatNumber = toUpperText(formValues.seat_number);

    const duplicateSeat = seats.some((seat) => {
      const seatId = toText(resolveSeatId(seat));
      const venueId = toText(getValue(seat, ['venue_id']));
      const seatNumber = toUpperText(getValue(seat, ['seat_number']));

      return seatId !== currentSeatId && venueId === selectedVenueValue && seatNumber === selectedSeatNumber;
    });

    if (!errors.seat_number && duplicateSeat) {
      errors.seat_number = 'This seat number already exists for the selected venue';
    }

    return errors;
  };

  const rowFormFields = [
    { name: 'seat_row', label: 'Seat Row', required: true, placeholder: 'A' },
    { name: 'seat_count', label: 'Number Of Seats', type: 'number', required: true, min: 1 },
    { name: 'start_number', label: 'Start Number', type: 'number', required: true, min: 1 },
    {
      name: 'seat_type',
      label: 'Seat Type',
      type: 'select',
      required: true,
      options: SEAT_TYPE_OPTIONS
    },
    { name: 'seat_price', label: 'Row Seat Price', type: 'number', required: true, min: 0, step: 0.01, placeholder: '220' }
  ];

  const validateConcertForm = () => {
    const errors = {};
    const venueId = toText(concertFormValues.venue_id);
    const categoryName = toUpperText(concertFormValues.concert_category_name);
    const seatCount = Number(concertFormValues.seat_count);
    const seatPrice = Number(concertFormValues.seat_price);
    const currentSeatId = toText(resolveSeatId(editingConcertCategory));

    if (!venueId) {
      errors.venue_id = 'Venue is required';
    }

    if (!categoryName) {
      errors.concert_category_name = 'Ticket category is required';
    }

    if (!Number.isInteger(seatCount) || seatCount < 1) {
      errors.seat_count = 'Enter a valid ticket count';
    }

    if (!Number.isFinite(seatPrice) || seatPrice < 0) {
      errors.seat_price = 'Enter a valid ticket price';
    }

    const duplicateCategory = seats.some((seat) => {
      const seatId = toText(resolveSeatId(seat));
      const existingVenueId = toText(getValue(seat, ['venue_id']));
      const existingCategoryName = toUpperText(getValue(seat, ['concert_category_name', 'concertCategoryName']));

      return seatId !== currentSeatId && existingVenueId === venueId && existingCategoryName === categoryName;
    });

    if (!errors.concert_category_name && duplicateCategory) {
      errors.concert_category_name = 'This concert category already exists for the selected venue';
    }

    return errors;
  };

  const validateRowForm = () => {
    const errors = {};
    const normalizedSeatRow = toUpperText(rowFormValues.seat_row);
    const seatCount = Number(rowFormValues.seat_count);
    const startNumber = Number(rowFormValues.start_number);
    const seatPrice = Number(rowFormValues.seat_price);

    if (!normalizedSeatRow) {
      errors.seat_row = 'Seat Row is required';
    }

    if (!Number.isInteger(seatCount) || seatCount < 1) {
      errors.seat_count = 'Enter a valid seat count';
    }

    if (!Number.isInteger(startNumber) || startNumber < 1) {
      errors.start_number = 'Enter a valid start number';
    }

    if (!toUpperText(rowFormValues.seat_type)) {
      errors.seat_type = 'Seat Type is required';
    }

    if (!Number.isFinite(seatPrice) || seatPrice < 0) {
      errors.seat_price = 'Enter a valid seat price';
    }

    if (selectedVenue && !errors.seat_row && !errors.seat_count && !errors.start_number) {
      const editingSeatIds = new Set((editingRow?.seatIds || []).map((seatId) => toText(seatId)));
      const existingSeatNumbers = new Set(
        (selectedVenue.seats || [])
          .filter((seat) => !editingSeatIds.has(toText(resolveSeatId(seat))))
          .map((seat) => toUpperText(getValue(seat, ['seat_number'])))
          .filter(Boolean)
      );

      for (let index = 0; index < seatCount; index += 1) {
        const seatNumber = `${normalizedSeatRow}${startNumber + index}`;
        if (existingSeatNumbers.has(seatNumber)) {
          errors.seat_row = `Row ${normalizedSeatRow} overlaps with existing seat ${seatNumber}`;
          break;
        }
      }
    }

    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const errors = validateForm();
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const payload = buildPayload(formValues);
    const nextVenueId = toText(payload.venue_id);

    try {
      setSaving(true);

      if (editingSeat) {
        await updateSeat(resolveSeatId(editingSeat), payload);
        toast.success('Seat updated');
      } else {
        await createSeat(payload);
        toast.success('Seat created');
      }

      setShowModal(false);
      setSelectedVenueId(nextVenueId);
      await loadData();
    } catch (submitError) {
      toast.error(submitError.message || 'Unable to save seat');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateOrUpdateRow = async (event) => {
    event.preventDefault();

    const errors = validateRowForm();
    setRowFormErrors(errors);

    if (Object.keys(errors).length > 0 || !selectedVenue) {
      return;
    }

    const normalizedSeatRow = toUpperText(rowFormValues.seat_row);
    const seatCount = Number(rowFormValues.seat_count);
    const startNumber = Number(rowFormValues.start_number);
    const seatType = toUpperText(rowFormValues.seat_type) || 'REGULAR';
    const seatPrice = Number(rowFormValues.seat_price);

    try {
      setSavingRow(true);

      if (editingRow) {
        const editingSeatIds = new Set(editingRow.seatIds.map((seatId) => toText(seatId)));
        const currentRowSeats = [...(selectedVenue.seats || [])]
          .filter((seat) => editingSeatIds.has(toText(resolveSeatId(seat))))
          .sort(sortSeats);
        const targetSeatNumbers = Array.from({ length: seatCount }, (_, index) => `${normalizedSeatRow}${startNumber + index}`);
        const sharedSeatCount = Math.min(currentRowSeats.length, targetSeatNumbers.length);

        for (let index = 0; index < sharedSeatCount; index += 1) {
          await updateSeat(resolveSeatId(currentRowSeats[index]), {
            venue_id: toNumber(selectedVenue.venueId) ?? selectedVenue.venueId,
            seat_row: normalizedSeatRow,
            seat_number: targetSeatNumbers[index],
            seat_type: seatType,
            seat_price: seatPrice
          });
        }

        if (targetSeatNumbers.length > currentRowSeats.length) {
          for (let index = currentRowSeats.length; index < targetSeatNumbers.length; index += 1) {
            await createSeat({
              venue_id: toNumber(selectedVenue.venueId) ?? selectedVenue.venueId,
              seat_row: normalizedSeatRow,
              seat_number: targetSeatNumbers[index],
              seat_type: seatType,
              seat_price: seatPrice
            });
          }
        }

        if (currentRowSeats.length > targetSeatNumbers.length) {
          for (let index = targetSeatNumbers.length; index < currentRowSeats.length; index += 1) {
            await deleteSeat(resolveSeatId(currentRowSeats[index]));
          }
        }

        toast.success(`Row ${normalizedSeatRow} updated`);
      } else {
        const payloads = Array.from({ length: seatCount }, (_, index) => ({
          venue_id: toNumber(selectedVenue.venueId) ?? selectedVenue.venueId,
          seat_row: normalizedSeatRow,
          seat_number: `${normalizedSeatRow}${startNumber + index}`,
          seat_type: seatType,
          seat_price: seatPrice
        }));

        for (const payload of payloads) {
          await createSeat(payload);
        }
        toast.success(`Row ${normalizedSeatRow} added`);
      }

      setShowRowModal(false);
      setEditingRow(null);
      await loadData();
    } catch (rowError) {
      toast.error(rowError.message || `Unable to ${editingRow ? 'update' : 'create'} row`);
    } finally {
      setSavingRow(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      return;
    }

    try {
      setDeleting(true);
      await deleteSeat(resolveSeatId(confirmDelete));
      toast.success('Seat deleted');
      setConfirmDelete(null);
      await loadData();
    } catch (deleteError) {
      toast.error(deleteError.message || 'Unable to delete seat');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteRow = async () => {
    if (!confirmDeleteRow || !selectedVenue) {
      return;
    }

    const rowSeats = (selectedVenue.seats || []).filter(
      (seat) => toUpperText(getValue(seat, ['seat_row'])) === confirmDeleteRow
    );

    try {
      setDeletingRow(true);
      for (const seat of rowSeats) {
        await deleteSeat(resolveSeatId(seat));
      }
      toast.success(`Row ${confirmDeleteRow} deleted`);
      setConfirmDeleteRow(null);
      await loadData();
    } catch (deleteRowError) {
      toast.error(deleteRowError.message || 'Unable to delete row');
    } finally {
      setDeletingRow(false);
    }
  };

  const handleConcertSubmit = async (event) => {
    event.preventDefault();

    const errors = validateConcertForm();
    setConcertFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const payload = buildConcertCategoryPayload(concertFormValues);
    const nextVenueId = toText(payload.venue_id);

    try {
      setSavingConcertCategory(true);

      if (editingConcertCategory) {
        await updateSeat(resolveSeatId(editingConcertCategory), payload);
        toast.success('Concert category updated');
      } else {
        await createSeat(payload);
        toast.success('Concert category created');
      }

      setShowConcertModal(false);
      setEditingConcertCategory(null);
      setSelectedVenueId(nextVenueId);
      await loadData();
    } catch (submitError) {
      toast.error(submitError.message || 'Unable to save concert category');
    } finally {
      setSavingConcertCategory(false);
    }
  };

  const handleDeleteConcertCategory = async () => {
    if (!confirmDeleteConcertCategory) {
      return;
    }

    try {
      setDeletingConcertCategory(true);
      await deleteSeat(resolveSeatId(confirmDeleteConcertCategory));
      toast.success('Concert category deleted');
      setConfirmDeleteConcertCategory(null);
      await loadData();
    } catch (deleteError) {
      toast.error(deleteError.message || 'Unable to delete concert category');
    } finally {
      setDeletingConcertCategory(false);
    }
  };

  const rowModalTitle = !selectedVenue
    ? 'Add Row'
    : editingRow
      ? `Edit Row / Price In ${selectedVenue.venueName}`
      : `Add Row To ${selectedVenue.venueName}`;

  if (loading) {
    return <Loader text="Loading seats..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <section className="admin-page">
      <div className="section-head">
        <div>
          <h1>Manage Seats</h1>
        </div>
      </div>
      {!venueCards.length ? (
        <div className="state-wrapper">
          <h3>No venues available</h3>
          <p>Create a venue first, then you can configure its seats here.</p>
        </div>
      ) : (
        <div className="seat-admin-layout">
          <section className="seat-venue-panel">
            <div className="seat-panel-head">
              <h3>Venues</h3>
              <label className="field-group">
                <span className="field-label">Search Venue</span>
                <input
                  className="field-input"
                  value={venueSearch}
                  onChange={(event) => setVenueSearch(event.target.value)}
                  placeholder="Search by venue name"
                />
              </label>
            </div>
            <div className="seat-venue-grid">
              {filteredVenueCards.length ? (
                filteredVenueCards.map((venue) => {
                  const isActive = venue.venueId === selectedVenue?.venueId;
                  const isConfigured = venue.isGroundVenue ? venue.concertCategoryCount > 0 : venue.seatCount > 0;

                  return (
                    <button
                      key={venue.venueId}
                      type="button"
                      className={`seat-venue-card ${isActive ? 'active' : ''}`}
                      onClick={() => setSelectedVenueId(venue.venueId)}
                    >
                      <div className="seat-venue-card-head">
                        <div>
                          <strong>{venue.venueName}</strong>
                        </div>
                        <span className={`status-badge ${isConfigured ? 'success' : 'neutral'}`}>
                          {isConfigured ? 'Configured' : 'Empty'}
                        </span>
                      </div>
                      <p>{venue.location || 'Venue details unavailable'}</p>
                      <div className="seat-venue-metrics">
                        {venue.isGroundVenue ? (
                          <span>{venue.concertCategoryCount} categories</span>
                        ) : (
                          <>
                            <span>{venue.seatCount} seats</span>
                            <span>{venue.rowCount} rows</span>
                          </>
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="state-wrapper">
                  <h3>No venues match this search</h3>
                  <p>Try a different venue name.</p>
                </div>
              )}
            </div>
          </section>

          <div className="seat-workspace">
            {selectedVenue ? (
              <>
                <section className="seat-workspace-hero">
                  <div>
                    <h2>{selectedVenue.venueName}</h2>
                    <p>{selectedVenue.location || 'No address provided for this venue yet.'}</p>
                    <div className="seat-workspace-pills">
                      <span className="pill">{selectedVenue.venueType}</span>
                      {selectedVenueUsesConcertInventory ? (
                        <>
                          <span className="pill">{selectedVenue.concertCategoryCount} categories</span>
                          <span className="pill">{selectedVenue.concertTicketCount} tickets / slot</span>
                        </>
                      ) : (
                        <>
                          <span className="pill">{selectedVenue.seatCount} seats</span>
                          <span className="pill">{selectedVenue.rowCount} rows</span>
                        </>
                      )}
                    </div>
                  </div>
                  {selectedVenueUsesConcertInventory ? (
                    <div className="seat-hero-actions">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => openCreateConcertCategoryModal(selectedVenue.venueId)}
                      >
                        Add Concert Category
                      </button>
                    </div>
                  ) : (
                    <div className="seat-hero-actions">
                      <button type="button" className="btn btn-outline" onClick={openCreateRowModal}>
                        Add Row
                      </button>
                    </div>
                  )}
                </section>

                {selectedVenueUsesConcertInventory ? (
                  <section className="seat-row-group-card">
                    <div className="seat-row-group-head">
                      <div>
                        <p>Concert Ticket Categories</p>
                        <h3>Category-Based Inventory</h3>
                      </div>
                      <div className="seat-row-group-actions">
                        <span>{selectedVenue.concertCategoryCount} categories</span>
                      </div>
                    </div>

                    {!selectedVenue.concertCategoryCount ? (
                      <div className="state-wrapper">
                        <h3>No concert categories configured</h3>
                        <p>Add VIP, FANPIT, GENERAL, or any other concert ticket category for {selectedVenue.venueName}.</p>
                      </div>
                    ) : (
                      <div className="seat-card-grid">
                        {selectedVenue.concertCategorySeats.map((seat) => {
                          const seatId = resolveSeatId(seat);

                          return (
                            <article key={seatId} className="seat-admin-card">
                              <div className="seat-admin-card-head">
                                <div>
                                  <strong>{getConcertCategoryName(seat)}</strong>
                                </div>
                                <span className="pill">CONCERT</span>
                              </div>

                              <div className="seat-admin-card-meta">
                                <span>{getSeatCountAmount(seat)} tickets / slot</span>
                                <span>{formatCurrency(getSeatPriceAmount(seat))}</span>
                              </div>

                              <div className="table-actions">
                                <button
                                  type="button"
                                  className="btn btn-small btn-outline"
                                  onClick={() => openEditConcertCategoryModal(seat)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-small btn-danger"
                                  onClick={() => setConfirmDeleteConcertCategory(seat)}
                                >
                                  Delete
                                </button>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </section>
                ) : (
                  <section className="seat-row-group-card">

                    {!selectedVenue.seatCount ? (
                      <div className="state-wrapper">
                        <h3>No rows configured for this venue</h3>
                        <p>Add a row to organize seat numbers, seat types, and pricing for {selectedVenue.venueName}.</p>
                      </div>
                    ) : (
                      <>
                        <section className="seat-workspace-toolbar">
                          <label className="field-group">
                            <span className="field-label">Search seats</span>
                            <input
                              className="field-input"
                              value={seatSearch}
                              onChange={(event) => setSeatSearch(event.target.value)}
                              placeholder="Search by seat number or row"
                            />
                          </label>

                          <label className="field-group">
                            <span className="field-label">Seat type</span>
                            <select
                              className="field-input"
                              value={seatTypeFilter}
                              onChange={(event) => setSeatTypeFilter(event.target.value)}
                            >
                              <option value="ALL">All Types</option>
                              {SEAT_TYPE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>

                          <button
                            type="button"
                            className="btn btn-outline seat-filter-reset"
                            onClick={() => {
                              setSeatSearch('');
                              setSeatTypeFilter('ALL');
                            }}
                            disabled={!hasFilters}
                          >
                            Clear Filters
                          </button>
                        </section>

                        {!filteredSeats.length ? (
                          <div className="state-wrapper">
                            <h3>No seats match these filters</h3>
                            <p>Try a different seat number, row, or seat type for {selectedVenue.venueName}.</p>
                            <button
                              type="button"
                              className="btn btn-outline"
                              onClick={() => {
                                setSeatSearch('');
                                setSeatTypeFilter('ALL');
                              }}
                            >
                              Reset Filters
                            </button>
                          </div>
                        ) : (
                          <div className="seat-row-groups">
                            {groupedRows.map((group) => (
                              <section key={group.seatRow} className="seat-row-group-card">
                                <div className="seat-row-group-head">
                                  <div>
                                    <p>Seat Row</p>
                                    <h3>{group.seatRow}</h3>
                                  </div>
                                  <div className="seat-row-group-actions">
                                    <span>{group.items.length} seats</span>
                                    <button
                                      type="button"
                                      className="btn btn-small btn-outline"
                                      onClick={() => openEditRowModal(group.seatRow, group.items)}
                                    >
                                      Edit Row / Price
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-small btn-danger"
                                      onClick={() => setConfirmDeleteRow(group.seatRow)}
                                    >
                                      Delete Row
                                    </button>
                                  </div>
                                </div>

                                <div className="seat-card-grid">
                                  {group.items.map((seat) => {
                                    const seatId = resolveSeatId(seat);
                                    const seatNumber = toUpperText(getValue(seat, ['seat_number']));
                                    const seatType = toUpperText(getValue(seat, ['seat_type'])) || 'REGULAR';

                                    return (
                                      <article key={seatId} className="seat-admin-card">
                                        <div className="seat-admin-card-head">
                                          <div>
                                            <strong>{seatNumber}</strong>
                                          </div>
                                          <span
                                            className={`pill ${
                                              seatType === 'PREMIUM'
                                                ? 'seat-pill-premium'
                                                : seatType === 'COUPLE'
                                                  ? 'seat-pill-couple'
                                                  : ''
                                            }`}
                                          >
                                            {seatType}
                                          </span>
                                        </div>

                                        <div className="seat-admin-card-meta">
                                          <span>Row {toUpperText(getValue(seat, ['seat_row']))}</span>
                                          <span>{formatCurrency(getSeatPriceAmount(seat))}</span>
                                        </div>

                                        <div className="table-actions">
                                          <button
                                            type="button"
                                            className="btn btn-small btn-danger"
                                            onClick={() => setConfirmDelete(seat)}
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      </article>
                                    );
                                  })}
                                </div>
                              </section>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </section>
                )}
              </>
            ) : (
              <EmptyState title="No venue selected" description="Choose a venue from the left to manage its seats." />
            )}
          </div>
        </div>
      )}

      <Modal
        isOpen={showModal}
        title={editingSeat ? 'Edit Seat' : 'Add Seat'}
        onClose={closeModal}
      >
        <AdminEntityForm
          fields={formFields}
          values={formValues}
          errors={formErrors}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          loading={saving}
          submitText={editingSeat ? 'Update' : 'Create'}
        />
      </Modal>

      <Modal
        isOpen={showRowModal}
        title={rowModalTitle}
        onClose={closeRowModal}
      >
        <AdminEntityForm
          fields={rowFormFields}
          values={rowFormValues}
          errors={rowFormErrors}
          onChange={handleRowFormChange}
          onSubmit={handleCreateOrUpdateRow}
          onCancel={closeRowModal}
          loading={savingRow}
          submitText={editingRow ? 'Update Row' : 'Create Row'}
        />
      </Modal>

      <Modal
        isOpen={showConcertModal}
        title={editingConcertCategory ? 'Edit Concert Category' : 'Add Concert Category'}
        onClose={closeConcertModal}
      >
        <AdminEntityForm
          fields={concertFormFields}
          values={concertFormValues}
          errors={concertFormErrors}
          onChange={handleConcertFormChange}
          onSubmit={handleConcertSubmit}
          onCancel={closeConcertModal}
          loading={savingConcertCategory}
          submitText={editingConcertCategory ? 'Update Category' : 'Create Category'}
        />
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(confirmDelete)}
        title="Delete Seat"
        message={
          confirmDelete
            ? `Remove seat ${toUpperText(getValue(confirmDelete, ['seat_number']))} from ${selectedVenue?.venueName || 'this venue'}?`
            : 'This action cannot be undone.'
        }
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        loading={deleting}
      />

      <ConfirmDialog
        isOpen={Boolean(confirmDeleteRow)}
        title="Delete Row"
        message={
          confirmDeleteRow && selectedVenue
            ? `Delete row ${confirmDeleteRow} and all of its seats from ${selectedVenue.venueName}?`
            : 'This action cannot be undone.'
        }
        confirmText="Delete Row"
        onConfirm={handleDeleteRow}
        onCancel={() => setConfirmDeleteRow(null)}
        loading={deletingRow}
      />

      <ConfirmDialog
        isOpen={Boolean(confirmDeleteConcertCategory)}
        title="Delete Concert Category"
        message={
          confirmDeleteConcertCategory
            ? `Remove concert category ${getConcertCategoryName(confirmDeleteConcertCategory)} from ${selectedVenue?.venueName || 'this venue'}?`
            : 'This action cannot be undone.'
        }
        confirmText="Delete Category"
        onConfirm={handleDeleteConcertCategory}
        onCancel={() => setConfirmDeleteConcertCategory(null)}
        loading={deletingConcertCategory}
      />
    </section>
  );
};

export default ManageSeatsPage;




