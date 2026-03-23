const STORAGE_KEYS = {
  CHECKOUT: 'seat_booking_checkout',
  USER_ID: 'seat_booking_user_id',
  SUCCESS: 'seat_booking_success'
};

const readStorage = (key) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    return null;
  }
};

const writeStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Ignore write errors in restricted browser environments.
  }
};

const removeStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    // Ignore delete errors.
  }
};

export const getCheckoutSelection = () => readStorage(STORAGE_KEYS.CHECKOUT);
export const setCheckoutSelection = (data) => writeStorage(STORAGE_KEYS.CHECKOUT, data);
export const clearCheckoutSelection = () => removeStorage(STORAGE_KEYS.CHECKOUT);

export const getSelectedUserId = () => readStorage(STORAGE_KEYS.USER_ID) || '';
export const setSelectedUserId = (userId) => writeStorage(STORAGE_KEYS.USER_ID, userId);

export const getLastBookingSuccess = () => readStorage(STORAGE_KEYS.SUCCESS);
export const setLastBookingSuccess = (data) => writeStorage(STORAGE_KEYS.SUCCESS, data);
export const clearLastBookingSuccess = () => removeStorage(STORAGE_KEYS.SUCCESS);
