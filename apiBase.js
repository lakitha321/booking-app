export const API_BASE =
  'https://jase-unoperated-cultivably.ngrok-free.dev/api';

export const API_HEADERS = API_BASE.includes('ngrok')
  ? { 'ngrok-skip-browser-warning': 'true' }
  : {};
