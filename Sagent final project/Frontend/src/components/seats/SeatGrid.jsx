import standupMicStage from '../../assets/standup-mic-stage.svg';
import { getValue } from '../../utils/entity';

const toText = (value) => String(value ?? '').trim();
const toUpperText = (value) => toText(value).toUpperCase();

const parseSeatNumber = (seat) => {
  const explicit = Number(getValue(seat, ['seat_number_value'], NaN));
  if (Number.isFinite(explicit)) {
    return explicit;
  }

  const raw = String(getValue(seat, ['seat_number'], '')).trim();
  const match = raw.match(/\d+/);
  if (match) {
    return Number(match[0]);
  }

  return Number(getValue(seat, ['event_seat_id', 'seat_id', 'seatId', 'id'], 0)) || 0;
};

const compareText = (first, second) => first.localeCompare(second, undefined, { numeric: true, sensitivity: 'base' });
const getSeatDisplayNumber = (seat) => String(parseSeatNumber(seat)).padStart(2, '0');
const getSeatDisplayLabel = (seat) => {
  const seatNumber = toUpperText(getValue(seat, ['seat_number', 'seatNumber']));
  if (seatNumber) {
    return seatNumber;
  }

  const seatRow = toUpperText(getValue(seat, ['seat_row', 'seatRow', 'row']));
  const parsedNumber = parseSeatNumber(seat);
  if (seatRow && parsedNumber) {
    return `${seatRow}${parsedNumber}`;
  }

  return getSeatDisplayNumber(seat);
};
const getSeatSelectionId = (seat) => {
  const value =
    getValue(seat, ['seat_selection_id', 'seatSelectionId']) ||
    getValue(seat, ['event_seat_id', 'eventSeatId', 'id']) ||
    getValue(seat, ['seat_id', 'seatId']);
  return String(value);
};
const getCouplePairId = (seat) => String(getValue(seat, ['couple_pair_id', 'couplePairId'], '')).trim();
const isCoupleSeat = (seat) => Boolean(getValue(seat, ['is_couple_seat', 'isCoupleSeat'], false)) && Boolean(getCouplePairId(seat));
const isSeatUnavailable = (seat) => ['BOOKED', 'HELD'].includes(String(getValue(seat, ['seat_status'], 'AVAILABLE')).toUpperCase());
const getSeatType = (seat) => String(getValue(seat, ['seat_type'], 'REGULAR')).toUpperCase();
const getDisplaySeatType = (seat, simplifySeatTypes = false) => {
  const seatType = getSeatType(seat);
  if (simplifySeatTypes && ['PREMIUM', 'COUPLE'].includes(seatType)) {
    return 'REGULAR';
  }
  return seatType;
};
const formatSeatTypeLabel = (seatType) =>
  (
    {
      REGULAR: 'Regular',
      PREMIUM: 'Premium',
      VIP: 'VIP',
      BALCONY: 'Balcony',
      COUPLE: 'Couple'
    }[toUpperText(seatType)] || toText(seatType)
  );

const groupBySeatRow = (seats) =>
  seats.reduce((acc, seat) => {
    const row = toUpperText(getValue(seat, ['seat_row', 'seatRow', 'row'], 'NA'));
    if (!acc[row]) {
      acc[row] = [];
    }
    acc[row].push(seat);
    return acc;
  }, {});

const getRowSeatDescriptor = (rowSeats, simplifySeatTypes = false) => {
  const uniqueTypes = Array.from(new Set((rowSeats || []).map((seat) => getDisplaySeatType(seat, simplifySeatTypes)).filter(Boolean)));
  if (!uniqueTypes.length) {
    return '';
  }

  if (uniqueTypes.length === 1) {
    return `${formatSeatTypeLabel(uniqueTypes[0])} Seats`;
  }

  return uniqueTypes.map(formatSeatTypeLabel).join(' / ');
};

const buildSeatTypeSections = (seats, simplifySeatTypes = false) => {
  const groupedSeats = groupBySeatRow(seats || []);
  const rows = Object.entries(groupedSeats)
    .sort(([first], [second]) => compareText(first, second))
    .map(([rowLabel, rowSeats]) => ({
      rowLabel,
      rowSeats,
      descriptor: getRowSeatDescriptor(rowSeats, simplifySeatTypes)
    }));

  return rows.reduce((sections, row) => {
    const currentSection = sections[sections.length - 1];
    if (currentSection && currentSection.label === row.descriptor) {
      currentSection.rows.push(row);
      return sections;
    }

    sections.push({
      label: row.descriptor,
      rows: [row]
    });
    return sections;
  }, []);
};

const SeatGrid = ({ seats, selectedSeatIds, onToggleSeat, stageVariant = 'screen', simplifySeatTypes = false }) => {
  const sections = buildSeatTypeSections(seats, simplifySeatTypes);

  if (!sections.length) {
    return null;
  }

  return (
    <div className="seat-grid-wrapper">
      {sections.map((section) => (
        <div key={section.label || section.rows.map((row) => row.rowLabel).join('-')} className="seat-type-group">
          {section.label ? <p className="seat-section-label">{section.label}</p> : null}
          {section.rows.map(({ rowLabel, rowSeats }) => (
            <div key={rowLabel} className="seat-row-block">
              <div className="seat-row">
                <div className="row-label">{rowLabel}</div>
                <div className="row-seats">
                  <div className="row-seats-block compact">
                    {(() => {
                      const sortedSeats = [...rowSeats].sort((first, second) => parseSeatNumber(first) - parseSeatNumber(second));
                      const renderedCouplePairs = new Set();

                      return sortedSeats.map((seat) => {
                        const seatSelectionId = getSeatSelectionId(seat);
                        const seatType = getDisplaySeatType(seat, simplifySeatTypes);
                        const pairId = getCouplePairId(seat);

                        if (!simplifySeatTypes && isCoupleSeat(seat) && pairId) {
                          if (renderedCouplePairs.has(pairId)) {
                            return null;
                          }

                          const pairSeats = sortedSeats
                            .filter((candidate) => getCouplePairId(candidate) === pairId)
                            .sort((first, second) => parseSeatNumber(first) - parseSeatNumber(second));
                          renderedCouplePairs.add(pairId);

                          const pairSeatIds = pairSeats.map((pairSeat) => getSeatSelectionId(pairSeat));
                          const bookedSeatCount = pairSeats.filter((pairSeat) => isSeatUnavailable(pairSeat)).length;
                          const isPairBooked = bookedSeatCount === pairSeats.length && pairSeats.length > 0;
                          const isPairPartiallyBooked = bookedSeatCount > 0 && bookedSeatCount < pairSeats.length;
                          const isPairSelected =
                            pairSeatIds.length > 0 && pairSeatIds.every((pairSeatId) => selectedSeatIds.includes(pairSeatId));
                          const isPairUnavailable = isPairBooked || isPairPartiallyBooked;
                          const pairClass = [
                            'seat-couple-pair',
                            'couple',
                            isPairPartiallyBooked ? 'partial' : isPairBooked ? 'booked' : 'available',
                            seatType === 'PREMIUM' ? 'premium' : '',
                            isPairSelected ? 'selected' : ''
                          ]
                            .join(' ')
                            .trim();
                          const pairTitle = isPairPartiallyBooked
                            ? `${pairSeats
                                .filter((pairSeat) => isSeatUnavailable(pairSeat))
                                .map((pairSeat) => getSeatDisplayLabel(pairSeat))
                                .join(' / ')} unavailable. Couple pair unavailable.`
                            : `${pairSeats.map((pairSeat) => getSeatDisplayLabel(pairSeat)).join(' / ')} (Couple Seat)`;

                          const getCoupleSeatStateClass = (pairSeat) => {
                            if (isSeatUnavailable(pairSeat)) {
                              return 'booked';
                            }

                            if (isPairPartiallyBooked) {
                              return 'blocked';
                            }

                            if (isPairSelected) {
                              return 'selected';
                            }

                            return 'available';
                          };

                          return (
                            <button
                              key={`pair-${pairId}`}
                              type="button"
                              className={pairClass}
                              onClick={() => onToggleSeat(pairSeats[0] || seat)}
                              disabled={isPairUnavailable}
                              title={pairTitle}
                            >
                              <span
                                className={`couple-seat-number ${getCoupleSeatStateClass(pairSeats[0] || seat)}`.trim()}
                              >
                                {getSeatDisplayLabel(pairSeats[0] || seat)}
                              </span>
                              <span className="couple-seat-divider" aria-hidden="true" />
                              <span
                                className={`couple-seat-number ${getCoupleSeatStateClass(pairSeats[1] || seat)}`.trim()}
                              >
                                {getSeatDisplayLabel(pairSeats[1] || seat)}
                              </span>
                            </button>
                          );
                        }

                        const isSelected = selectedSeatIds.includes(seatSelectionId);
                        const isBooked = isSeatUnavailable(seat);
                        const seatClass = [
                          'seat-tile',
                          isBooked ? 'booked' : 'available',
                          seatType === 'PREMIUM' ? 'premium' : '',
                          isSelected ? 'selected' : ''
                        ]
                          .join(' ')
                          .trim();

                        return (
                          <button
                            key={seatSelectionId}
                            type="button"
                            className={seatClass}
                            onClick={() => onToggleSeat(seat)}
                            disabled={isBooked}
                            title={getSeatDisplayLabel(seat)}
                          >
                            <strong>{getSeatDisplayLabel(seat)}</strong>
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
      {stageVariant === 'microphone' ? (
        <div className="seat-show-banner" aria-hidden="true">
          <img className="seat-show-mic-image" src={standupMicStage} alt="" />
          <p className="seat-show-text">All attention this way.</p>
        </div>
      ) : (
        <div className="seat-screen-banner" aria-hidden="true">
          <div className="seat-screen-shape" />
          <p className="seat-screen-text">All eyes this way !!</p>
        </div>
      )}
      <div className="seat-legend">
        <span>
          <em className="legend-box available" />
          Available
        </span>
        <span>
          <em className="legend-box selected" />
          Selected
        </span>
        <span>
          <em className="legend-box booked" />
          Booked
        </span>
        {!simplifySeatTypes ? (
          <span>
            <em className="legend-box premium" />
            Premium
          </span>
        ) : null}
        {!simplifySeatTypes ? (
          <span>
            <em className="legend-box couple" />
            Couple Pair
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default SeatGrid;
