/**
 * @typedef {Object} Book
 * @property {number|string} [id]
 * @property {string} [title]
 * @property {string} [author]
 * @property {string} [subject]
 * @property {string} [status]
 * @property {Record<string, unknown>} [extra]
 */

/**
 * @typedef {Object} BookCopy
 * @property {number|string} [id]
 * @property {number|string} [bookId]
 * @property {string} [status]
 * @property {string} [condition]
 * @property {Record<string, unknown>} [extra]
 */

/**
 * @typedef {Object} Member
 * @property {number|string} [id]
 * @property {number|string} [libraryId]
 * @property {string} [name]
 * @property {string} [email]
 * @property {string} [password]
 */

/**
 * @typedef {Object} Reservation
 * @property {number|string} [id]
 * @property {number|string} [memberId]
 * @property {number|string} [bookId]
 * @property {string} [status]
 * @property {string} [reservationDate]
 */

/**
 * @typedef {Object} Borrow
 * @property {number|string} [id]
 * @property {number|string} [memberId]
 * @property {number|string} [bookId]
 * @property {number|string} [copyId]
 * @property {string} [issueDate]
 * @property {string} [dueDate]
 * @property {string} [returnDate]
 */

/**
 * @typedef {Object} Fine
 * @property {number|string} [id]
 * @property {number|string} [borrowId]
 * @property {number|string} [memberId]
 * @property {number} [amount]
 * @property {string} [status]
 */

export {};
