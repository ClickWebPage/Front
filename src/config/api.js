// Configuración de la API
// Configuración automática para desarrollo local y producción

// Detectar automáticamente la URL de la API
function getApiBaseUrl() {
  // En producción, usar la variable de entorno configurada en Vercel
  if (process.env.VUE_APP_API_URL) {
    return process.env.VUE_APP_API_URL;
  }
  
  // En desarrollo, detectar el entorno
  const hostname = window.location.hostname;
  
  // Si se accede desde localhost/127.0.0.1, usar localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  
  // Si se accede desde una IP de red local, usar esa misma IP para el backend
  if (hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.')) {
    return `http://${hostname}:5000/api`;
  }
  
  // Fallback para producción (Railway)
  return 'https://backend-chpc-production.up.railway.app/api';
}

const API_BASE_URL = getApiBaseUrl();

export { API_BASE_URL };
