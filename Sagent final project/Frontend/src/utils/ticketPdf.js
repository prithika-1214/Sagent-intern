import { resolveTicketPosterDataUrl } from './ticketPoster';

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const HEADER_HEIGHT = 24;
const MARGIN = 14;
const SECTION_GAP = 6;
const BOX_RADIUS = 4;
const INNER_PADDING = 4.5;
const BODY_FONT_SIZE = 10;
const TITLE_FONT_SIZE = 11;
const LINE_GAP = 1.8;
const TOP_ROW_MIN_HEIGHT = 46;
const HALF_COLUMN_WIDTH = (PAGE_WIDTH - MARGIN * 2 - SECTION_GAP) / 2;
const POSTER_HEIGHT = 44;
const FOOTER_Y = PAGE_HEIGHT - 8;

const normalizePdfText = (value) => {
  const normalized = String(value ?? '')
    .replace(/\u20B9/g, 'INR ')
    .replace(/[^\x20-\x7E\n]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized || '-';
};

const getLineHeight = (doc) => doc.getFontSize() * doc.getLineHeightFactor() * 0.352778;

const getFieldMetrics = (doc, fields, width) => {
  doc.setFontSize(BODY_FONT_SIZE);
  const lineHeight = getLineHeight(doc);
  const innerWidth = width - INNER_PADDING * 2;
  const labelWidth = Math.max(22, Math.min(32, innerWidth * 0.34));
  const valueWidth = Math.max(10, innerWidth - labelWidth - 2);

  return {
    labelWidth,
    lineHeight,
    fields: fields.map((field) => {
      const lines = doc.splitTextToSize(normalizePdfText(field.value), valueWidth);
      return {
        ...field,
        lines,
        height: Math.max(lineHeight, lines.length * lineHeight)
      };
    })
  };
};

const getSectionHeight = (doc, fields, width, mediaHeight = 0) => {
  const metrics = getFieldMetrics(doc, fields, width);
  const fieldsHeight = metrics.fields.reduce(
    (total, field, index) => total + field.height + (index === metrics.fields.length - 1 ? 0 : LINE_GAP),
    0
  );
  const titleHeight = 8;
  const mediaBlockHeight = mediaHeight ? mediaHeight + 4 : 0;

  return INNER_PADDING + titleHeight + mediaBlockHeight + fieldsHeight + INNER_PADDING;
};

const drawCardShell = (doc, x, y, width, height) => {
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(208, 213, 221);
  doc.roundedRect(x, y, width, height, BOX_RADIUS, BOX_RADIUS, 'FD');
};

const drawSectionFields = (doc, fields, x, y, width) => {
  const metrics = getFieldMetrics(doc, fields, width);
  const labelX = x + INNER_PADDING;
  const valueX = labelX + metrics.labelWidth;
  let cursorY = y;

  doc.setFontSize(BODY_FONT_SIZE);

  metrics.fields.forEach((field, index) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${field.label}:`, labelX, cursorY);
    doc.setFont('helvetica', 'normal');
    doc.text(field.lines, valueX, cursorY);

    cursorY += field.height;
    if (index < metrics.fields.length - 1) {
      cursorY += LINE_GAP;
    }
  });

  return cursorY;
};

const drawSectionCard = (doc, { title, fields, x, y, width, height, media }) => {
  drawCardShell(doc, x, y, width, height);

  doc.setTextColor(16, 24, 40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(TITLE_FONT_SIZE);
  doc.text(title, x + INNER_PADDING, y + 6.5);

  let cursorY = y + INNER_PADDING + 8;

  if (media) {
    const mediaX = x + INNER_PADDING;
    const mediaY = cursorY;
    const mediaWidth = width - INNER_PADDING * 2;

    if (media.dataUrl) {
      doc.addImage(media.dataUrl, 'PNG', mediaX, mediaY, mediaWidth, media.height);
    } else {
      doc.setFillColor(223, 246, 248);
      doc.roundedRect(mediaX, mediaY, mediaWidth, media.height, 3, 3, 'F');
      doc.setTextColor(15, 118, 110);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(normalizePdfText(media.fallbackTitle), mediaX + mediaWidth / 2, mediaY + media.height / 2, {
        align: 'center'
      });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text('Event Poster', mediaX + mediaWidth / 2, mediaY + media.height - 4, { align: 'center' });
      doc.setTextColor(16, 24, 40);
    }

    cursorY += media.height + 4;
  }

  drawSectionFields(doc, fields, x, cursorY, width);
};

export const downloadTicketPdf = async (ticket = {}) => {
  const { jsPDF } = await import('jspdf');
  const posterDataUrl = await resolveTicketPosterDataUrl(ticket);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const bookingId = String(ticket.bookingId || 'NA').replace(/[^\w-]/g, '');
  const fileName = `ticket-${bookingId || 'booking'}.pdf`;

  const bookingFields = [
    { label: 'Booking ID', value: ticket.bookingId },
    { label: 'Booking Date', value: ticket.bookingDate },
    { label: 'Booking Status', value: ticket.bookingStatus }
  ];
  const eventFields = [
    { label: 'Event', value: ticket.eventName },
    { label: 'Venue', value: ticket.venueName },
    { label: 'Audi', value: ticket.audiName },
    { label: 'Time Slot', value: ticket.showTime },
    { label: ticket.seatLabelTitle || 'Seats', value: ticket.seatLabels }
  ];
  const userFields = [
    { label: 'Name', value: ticket.userName },
    { label: 'Email', value: ticket.userEmail },
    { label: 'Mobile', value: ticket.userMobile }
  ];
  const paymentFields = [
    { label: 'Payment Status', value: ticket.paymentStatus },
    { label: 'Payment Method', value: ticket.paymentMethod },
    { label: 'Amount Paid', value: ticket.amount },
    { label: 'Transaction ID', value: ticket.transactionId }
  ];

  const bookingWidth = PAGE_WIDTH - MARGIN * 2;
  const bookingHeight = getSectionHeight(doc, bookingFields, bookingWidth);
  const topRowHeight = Math.max(TOP_ROW_MIN_HEIGHT, bookingHeight);
  const eventHeight = getSectionHeight(doc, eventFields, HALF_COLUMN_WIDTH, POSTER_HEIGHT);
  const userHeight = getSectionHeight(doc, userFields, HALF_COLUMN_WIDTH);
  const middleRowHeight = Math.max(eventHeight, userHeight);
  const paymentHeight = getSectionHeight(doc, paymentFields, PAGE_WIDTH - MARGIN * 2);

  doc.setFillColor(14, 165, 164);
  doc.rect(0, 0, PAGE_WIDTH, HEADER_HEIGHT, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Tickify Booking Ticket', MARGIN, 15);

  let currentY = HEADER_HEIGHT + 8;

  drawSectionCard(doc, {
    title: 'Booking Details',
    fields: bookingFields,
    x: MARGIN,
    y: currentY,
    width: bookingWidth,
    height: topRowHeight
  });

  currentY += topRowHeight + SECTION_GAP;

  drawSectionCard(doc, {
    title: 'Event Details',
    fields: eventFields,
    x: MARGIN,
    y: currentY,
    width: HALF_COLUMN_WIDTH,
    height: middleRowHeight,
    media: {
      dataUrl: posterDataUrl,
      height: POSTER_HEIGHT,
      fallbackTitle: ticket.eventName || 'Featured Event'
    }
  });
  drawSectionCard(doc, {
    title: 'User Details',
    fields: userFields,
    x: MARGIN + HALF_COLUMN_WIDTH + SECTION_GAP,
    y: currentY,
    width: HALF_COLUMN_WIDTH,
    height: middleRowHeight
  });

  currentY += middleRowHeight + SECTION_GAP;

  drawSectionCard(doc, {
    title: 'Payment Details',
    fields: paymentFields,
    x: MARGIN,
    y: currentY,
    width: PAGE_WIDTH - MARGIN * 2,
    height: paymentHeight
  });

  doc.setTextColor(71, 84, 103);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Generated by Tickify', PAGE_WIDTH / 2, FOOTER_Y, { align: 'center' });

  doc.save(fileName);
};
