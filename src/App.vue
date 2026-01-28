<template>
  <div id="app" :class="{ 'dark-mode': isDarkMode }">
    <div v-if="hasError" class="error-container">
      <h2>⚠️ Error en la aplicación</h2>
      <p>{{ errorMessage }}</p>
      <button @click="reloadApp">🔄 Recargar</button>
    </div>
    <template v-else>
      <router-view /> <!-- Muestra el componente basado en la ruta actual -->
      <WhatsAppWidget /> <!-- Widget flotante de WhatsApp -->
    </template>
  </div>
</template>

<script>
import WhatsAppWidget from './components/WhatsAppWidget/WhatsAppWidget.vue';
import inactivityService from './services/inactivityService';

export default {
  name: 'App',
  components: {
    WhatsAppWidget
  },
  data() {
    return {
      isDarkMode: false,
      inactivityTimer: null,
      inactivityTimeout: 3600000, // 1 hora en milisegundos (60 * 60 * 1000)
      activityEvents: ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'],
      hasError: false,
      errorMessage: ''
    };
  },
  created() {
    console.log('🎯 App.vue creado, iniciando configuración...');
    
    try {
      // Cargar preferencia de tema desde localStorage
      const savedTheme = localStorage.getItem('theme');
      this.isDarkMode = savedTheme === 'dark';
      this.applyTheme();

      // Escuchar cambios de tema
      window.addEventListener('theme-changed', this.handleThemeChange);

      // Registrar función de reseteo en el servicio global
      inactivityService.registerResetFunction(this.resetInactivityTimer);

      // Iniciar monitoreo de inactividad
      this.initInactivityMonitor();
      
      console.log('✅ App.vue configurado correctamente');
    } catch (error) {
      console.error('❌ Error en App.vue created:', error);
      this.hasError = true;
      this.errorMessage = 'Error al inicializar la aplicación: ' + error.message;
    }
  },
  beforeUnmount() {
    window.removeEventListener('theme-changed', this.handleThemeChange);
    
    // Limpiar monitoreo de inactividad
    this.cleanupInactivityMonitor();
    
    // Limpiar servicio global
    inactivityService.cleanup();
  },
  methods: {
    reloadApp() {
      window.location.reload();
    },
    handleThemeChange(event) {
      this.isDarkMode = event.detail.isDark;
      this.applyTheme();
    },
    applyTheme() {
      if (this.isDarkMode) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    },
    
    // Sistema de monitoreo de inactividad
    initInactivityMonitor() {
      // Solo activar si hay un usuario autenticado
      if (!this.isUserAuthenticated()) {
        return;
      }

      // Configurar timer inicial
      this.resetInactivityTimer();

      // Agregar listeners para detectar actividad
      this.activityEvents.forEach(event => {
        window.addEventListener(event, this.resetInactivityTimer, true);
      });
    },

    cleanupInactivityMonitor() {
      // Limpiar el timer
      if (this.inactivityTimer) {
        clearTimeout(this.inactivityTimer);
        this.inactivityTimer = null;
      }

      // Remover todos los listeners de eventos
      this.activityEvents.forEach(event => {
        window.removeEventListener(event, this.resetInactivityTimer, true);
      });
    },

    resetInactivityTimer() {
      // Solo resetear si hay un usuario autenticado
      if (!this.isUserAuthenticated()) {
        return;
      }

      // Limpiar timer existente
      if (this.inactivityTimer) {
        clearTimeout(this.inactivityTimer);
      }

      // Configurar nuevo timer
      this.inactivityTimer = setTimeout(() => {
        this.handleInactivityLogout();
      }, this.inactivityTimeout);
    },

    isUserAuthenticated() {
      return !!localStorage.getItem('access_token');
    },

    handleInactivityLogout() {
      // Verificar una última vez que el usuario esté autenticado
      if (!this.isUserAuthenticated()) {
        return;
      }

      // Limpiar datos de sesión
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_rol');
      localStorage.removeItem('user_nombre');
      localStorage.removeItem('carrito');

      // Limpiar listeners
      this.cleanupInactivityMonitor();

      // Mostrar alerta al usuario
      alert('Tu sesión ha expirado por inactividad. Por favor, inicia sesión nuevamente.');

      // Redirigir al login
      if (this.$route.path !== '/login') {
        this.$router.push('/login');
      }
    }
  }
};
</script>

<style>
/* Estilos personalizados para el componente raíz */
* {
  transition: background-color 0.3s ease, color 0.3s ease;
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background-color: #f8f9fa;
  text-align: center;
}

.error-container h2 {
  color: #dc3545;
  margin-bottom: 1rem;
  font-size: 2rem;
}

.error-container p {
  color: #6c757d;
  margin-bottom: 2rem;
  max-width: 600px;
  line-height: 1.6;
}

.error-container button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.error-container button:hover {
  background-color: #0056b3;
}

body {
  background-color: #f8f9fa;
  color: #2c3e50;
}

body.dark-mode {
  background-color: #1a1a1a;
  color: #ecf0f1;
}
</style>