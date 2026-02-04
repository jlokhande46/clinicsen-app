// If we are in production (live), use the live backend URL (we will set this later).
// If we are developing locally, use localhost:8000.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';