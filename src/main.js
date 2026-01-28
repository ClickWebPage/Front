import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from '../store';
import './styles/globals.css';
import './config/axiosConfig'; // Importar configuración de Axios con interceptor

console.log('🚀 Iniciando aplicación Vue...');
console.log('📊 Router configurado:', router);
console.log('🏪 Store configurado:', store);

try {
  const app = createApp(App);
  app.use(router);
  app.use(store);
  app.mount('#app');
  console.log('✅ Aplicación montada exitosamente');
} catch (error) {
  console.error('❌ Error al montar la aplicación:', error);
}
