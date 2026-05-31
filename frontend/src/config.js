// When hosted on Railway: frontend and backend share the same domain
// When running locally: backend is on localhost:5000
const BACKEND_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : '';  // empty string = same origin

export function imgUrl(p) {
  if (!p) return null;
  if (p.startsWith('http')) return p;
  return `${BACKEND_URL}${p}`;
}

export default BACKEND_URL;
