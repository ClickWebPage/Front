import apiClient from '@/services/api';

export default {
  name: 'AdminExcel',
  data() {
    return {
      // Estado del flujo: 1 = carga, 2 = preview, 3 = resultado
      step: 1,

      // Archivo seleccionado
      selectedFile: null,
      dragging: false,
      downloading: false,

      // Carga del preview
      loading: false,
      preview: null,
      previewTab: 'productos',

      // Aplicación de la importación
      applying: false,
      result: null,

      // Mensajes
      message: '',
      messageType: '',
    };
  },

  computed: {
    fileSizeLabel() {
      if (!this.selectedFile) return '';
      const bytes = this.selectedFile.size;
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    },
  },

  methods: {
    // ===== SELECCIÓN DE ARCHIVO =====
    triggerFileInput() {
      this.$refs.fileInput.click();
    },

    onFileChange(event) {
      const file = event.target.files[0];
      if (file) this.setFile(file);
    },

    onDrop(event) {
      this.dragging = false;
      const file = event.dataTransfer.files[0];
      if (file) this.setFile(file);
    },

    setFile(file) {
      if (!file.name.toLowerCase().endsWith('.xlsx')) {
        this.showMessage('Solo se permiten archivos .xlsx', 'error');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.showMessage('El archivo supera el límite de 5 MB', 'error');
        return;
      }
      this.selectedFile = file;
      this.preview = null;
      this.result = null;
      this.step = 1;
      this.message = '';
    },

    clearFile() {
      this.selectedFile = null;
      this.$refs.fileInput.value = '';
      this.preview = null;
      this.result = null;
      this.step = 1;
      this.message = '';
    },

    // ===== PREVIEW =====
    async cargarPreview() {
      if (!this.selectedFile) return;
      this.loading = true;
      this.message = '';
      this.preview = null;

      try {
        const formData = new FormData();
        formData.append('file', this.selectedFile);

        const res = await apiClient.post('/excel-import/preview', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        this.preview = res.data;
        this.step = 2;
        this.previewTab = 'productos';

        if (this.preview.errors && this.preview.errors.length > 0) {
          this.showMessage(
            `Vista previa generada con ${this.preview.errors.length} error(es). Corrígelos antes de aplicar.`,
            'error',
          );
        } else if (this.preview.warnings && this.preview.warnings.length > 0) {
          this.showMessage(
            `Vista previa generada con ${this.preview.warnings.length} advertencia(s).`,
            'warning',
          );
        } else {
          this.showMessage('Vista previa generada correctamente. Revisa los datos y aplica la importación.', 'success');
        }
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          err.response?.data?.error ||
          'Error al generar la vista previa';
        this.showMessage(msg, 'error');
      } finally {
        this.loading = false;
      }
    },

    // ===== APLICAR =====
    async aplicarImportacion() {
      if (!this.selectedFile || !this.preview) return;
      if (this.preview.errors && this.preview.errors.length > 0) return;

      if (
        !confirm(
          `¿Confirmas la importación?\n\n` +
            `• ${this.preview.summary.productsRows} filas de Productos\n` +
            `• ${this.preview.summary.pricesRows} filas de Precios\n\n` +
            `Esta acción actualizará la base de datos.`,
        )
      )
        return;

      this.applying = true;
      this.message = '';

      try {
        const formData = new FormData();
        formData.append('file', this.selectedFile);

        const res = await apiClient.post('/excel-import/apply', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        this.result = res.data;
        this.step = 3;
        this.showMessage('Importación aplicada correctamente.', 'success');
      } catch (err) {
        const data = err.response?.data;
        if (data?.errors && Array.isArray(data.errors)) {
          this.showMessage(
            `Error al aplicar: ${data.message || 'Errores de validación'}`,
            'error',
          );
        } else {
          this.showMessage(
            data?.message || data?.error || 'Error al aplicar la importación',
            'error',
          );
        }
      } finally {
        this.applying = false;
      }
    },

    // ===== PLANTILLA =====
    async descargarPlantilla() {
      this.downloading = true;
      try {
        const res = await apiClient.get('/excel-import/template', {
          responseType: 'blob',
        });
        const url = URL.createObjectURL(
          new Blob([res.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          }),
        );
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla-importacion-chpc.xlsx';
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        this.showMessage('Error al descargar la plantilla', 'error');
      } finally {
        this.downloading = false;
      }
    },

    // ===== RESET =====
    resetState() {
      this.selectedFile = null;
      if (this.$refs.fileInput) this.$refs.fileInput.value = '';
      this.preview = null;
      this.result = null;
      this.step = 1;
      this.message = '';
    },

    // ===== UTILIDADES =====
    showMessage(msg, type = 'success') {
      this.message = msg;
      this.messageType = type;
    },
  },
};
