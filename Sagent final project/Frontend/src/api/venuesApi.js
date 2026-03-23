import apiClient from './axios';
import { getValue } from '../utils/entity';

const BASE_PATH = '/api/venues';

const toVenuePayload = (payload = {}) => {
  const rawCapacity = getValue(payload, ['capacity'], null);
  const venuePayload = {
    venueName: getValue(payload, ['venueName', 'venue_name']),
    address: getValue(payload, ['address']),
    city: getValue(payload, ['city']),
    state: getValue(payload, ['state']),
    venueType: getValue(payload, ['venueType', 'venue_type'])
  };

  if (rawCapacity !== null && rawCapacity !== undefined && rawCapacity !== '') {
    const capacityValue = Number(rawCapacity);
    if (Number.isFinite(capacityValue) && capacityValue >= 0) {
      venuePayload.capacity = capacityValue;
    }
  }

  return venuePayload;
};

export const getVenues = () => apiClient.get(BASE_PATH).then((res) => res.data);
export const getVenueById = (id) => apiClient.get(`${BASE_PATH}/${id}`).then((res) => res.data);
export const createVenue = (payload) => apiClient.post(BASE_PATH, toVenuePayload(payload)).then((res) => res.data);
export const updateVenue = (id, payload) =>
  apiClient.put(`${BASE_PATH}/${id}`, toVenuePayload(payload)).then((res) => res.data);
export const deleteVenue = (id) => apiClient.delete(`${BASE_PATH}/${id}`).then((res) => res.data);
