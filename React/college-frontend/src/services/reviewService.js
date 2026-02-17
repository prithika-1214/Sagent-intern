import { STORAGE_KEYS } from "../constants/appConstants";

const getAllNotes = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFICER_NOTES) ?? "[]");
  } catch {
    return [];
  }
};

const saveAllNotes = (notes) => {
  localStorage.setItem(STORAGE_KEYS.OFFICER_NOTES, JSON.stringify(notes));
};

export const reviewService = {
  getNotesByAppId(appId) {
    const notes = getAllNotes();
    return notes.filter((item) => Number(item.appId) === Number(appId));
  },

  addNote({ appId, officerName, note }) {
    const all = getAllNotes();
    const record = {
      id: Date.now(),
      appId,
      officerName,
      note,
      createdAt: new Date().toISOString(),
    };
    all.unshift(record);
    saveAllNotes(all);
    return record;
  },
};
