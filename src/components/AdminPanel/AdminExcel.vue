<template>
  <div class="admin-excel">
    <h2><FontAwesomeIcon :icon="['fas', 'file-excel']" /> Importación desde Excel</h2>
    <p class="description">
      Carga un archivo <strong>.xlsx</strong> para actualizar masivamente productos y precios unitarios.
      Primero se genera una vista previa con los datos detectados antes de aplicar cualquier cambio.
    </p>

    <!-- Indicador de pasos -->
    <div class="steps-bar">
      <div :class="['step', { active: step >= 1, done: step > 1 }]">
        <span class="step-num">1</span>
        <span class="step-label">Cargar archivo</span>
      </div>
      <div class="step-divider"></div>
      <div :class="['step', { active: step >= 2, done: step > 2 }]">
        <span class="step-num">2</span>
        <span class="step-label">Vista previa</span>
      </div>
      <div class="step-divider"></div>
      <div :class="['step', { active: step >= 3 }]">
        <span class="step-num">3</span>
        <span class="step-label">Resultado</span>
      </div>
    </div>

    <!-- Mensaje global -->
    <transition name="fade">
      <div v-if="message" :class="['alert-msg', messageType]">
        <FontAwesomeIcon :icon="messageType === 'error' ? ['fas', 'circle-xmark'] : ['fas', 'circle-check']" />
        {{ message }}
        <button type="button" class="alert-close" @click="message = ''">✕</button>
      </div>
    </transition>

    <div class="excel-layout">
      <!-- ======== COLUMNA IZQUIERDA: Carga ======== -->
      <div class="excel-upload-col">
        <div class="form-section">
          <h3>
            <FontAwesomeIcon :icon="['fas', 'upload']" />
            Archivo Excel
          </h3>

          <!-- Zona de carga drag & drop -->
          <div
            :class="['drop-zone', { 'drag-over': dragging, 'has-file': selectedFile }]"
            @dragenter.prevent="dragging = true"
            @dragleave.prevent="dragging = false"
            @dragover.prevent
            @drop.prevent="onDrop"
            @click="triggerFileInput"
          >
            <input
              ref="fileInput"
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              class="file-input-hidden"
              @change="onFileChange"
            />

            <template v-if="!selectedFile">
              <FontAwesomeIcon :icon="['fas', 'file-arrow-up']" class="drop-icon" />
              <p class="drop-text">Arrastra tu archivo aquí<br>o <span class="drop-link">haz click para seleccionar</span></p>
              <p class="drop-hint">Solo archivos <code>.xlsx</code> · máx. 5 MB</p>
            </template>

            <template v-else>
              <FontAwesomeIcon :icon="['fas', 'file-excel']" class="drop-icon selected" />
              <p class="drop-text selected">{{ selectedFile.name }}</p>
              <p class="drop-hint">{{ fileSizeLabel }} · <span class="drop-link" @click.stop="clearFile">Cambiar archivo</span></p>
            </template>
          </div>

          <!-- Botón: Vista Previa -->
          <button
            type="button"
            class="btn btn-primary btn-full"
            :disabled="!selectedFile || loading"
            @click="cargarPreview"
          >
            <FontAwesomeIcon :icon="loading ? ['fas', 'spinner'] : ['far', 'eye']" :spin="loading" />
            {{ loading ? 'Analizando...' : 'Generar Vista Previa' }}
          </button>

          <!-- Separador -->
          <div class="section-divider">
            <span>Herramientas</span>
          </div>

          <!-- Botón: Descargar plantilla -->
          <button
            type="button"
            class="btn btn-outline btn-full"
            @click="descargarPlantilla"
            :disabled="downloading"
          >
            <FontAwesomeIcon :icon="downloading ? ['fas', 'spinner'] : ['fas', 'file-arrow-down']" :spin="downloading" />
            {{ downloading ? 'Descargando...' : 'Descargar Plantilla' }}
          </button>

          <p class="help-note">
            <FontAwesomeIcon :icon="['fas', 'circle-info']" />
            La plantilla incluye las hojas <strong>Productos</strong> y <strong>Precios</strong>
            con el formato requerido para la importación.
          </p>
        </div>

        <!-- Instrucciones rápidas -->
        <div class="form-section instructions-card">
          <h3><FontAwesomeIcon :icon="['fas', 'circle-question']" /> ¿Cómo funciona?</h3>
          <ol class="how-to-list">
            <li>Descarga la plantilla para ver el formato requerido.</li>
            <li>Completa la hoja <strong>Productos</strong> y/o <strong>Precios</strong>.</li>
            <li>Carga el archivo y genera la vista previa.</li>
            <li>Revisa los datos detectados y posibles errores.</li>
            <li>Si todo está correcto, aplica la importación.</li>
          </ol>
          <div class="format-tags">
            <span class="tag tag-products">Hoja: Productos</span>
            <span class="tag tag-prices">Hoja: Precios</span>
          </div>
        </div>
      </div>

      <!-- ======== COLUMNA DERECHA: Preview / Resultado ======== -->
      <div class="excel-preview-col">

        <!-- Estado: idle (sin preview aún) -->
        <div v-if="step === 1" class="preview-empty">
          <FontAwesomeIcon :icon="['fas', 'table']" class="empty-icon" />
          <p>Aquí aparecerá la vista previa de los datos detectados en el archivo.</p>
        </div>

        <!-- Estado: preview cargado -->
        <div v-else-if="step === 2 && preview">

          <!-- Tarjetas de resumen -->
          <div class="summary-cards">
            <div class="summary-card">
              <FontAwesomeIcon :icon="['fas', 'box']" class="card-icon products" />
              <div class="card-info">
                <span class="card-value">{{ preview.summary.productsRows }}</span>
                <span class="card-label">Filas de Productos</span>
              </div>
            </div>
            <div class="summary-card">
              <FontAwesomeIcon :icon="['fas', 'tag']" class="card-icon prices" />
              <div class="card-info">
                <span class="card-value">{{ preview.summary.pricesRows }}</span>
                <span class="card-label">Filas de Precios</span>
              </div>
            </div>
            <div class="summary-card">
              <FontAwesomeIcon :icon="['fas', 'layer-group']" class="card-icon sheets" />
              <div class="card-info">
                <span class="card-value">{{ preview.sheetsDetected.length }}</span>
                <span class="card-label">Hojas detectadas</span>
              </div>
            </div>
          </div>

          <!-- Errores de validación -->
          <div v-if="preview.errors && preview.errors.length > 0" class="errors-panel">
            <h4 class="panel-title error-title">
              <FontAwesomeIcon :icon="['fas', 'circle-xmark']" />
              Errores de validación ({{ preview.errors.length }})
            </h4>
            <ul class="error-list">
              <li v-for="(err, i) in preview.errors" :key="i">
                <strong>[{{ err.sheet }} · Fila {{ err.row }}]</strong>
                <template v-if="err.codigo"> [Código {{ err.codigo }}]</template>
                — {{ err.message }}
              </li>
            </ul>
          </div>

          <!-- Advertencias -->
          <div v-if="preview.warnings && preview.warnings.length > 0" class="warnings-panel">
            <h4 class="panel-title warning-title">
              <FontAwesomeIcon :icon="['fas', 'triangle-exclamation']" />
              Advertencias ({{ preview.warnings.length }})
            </h4>
            <ul class="warning-list">
              <li v-for="(w, i) in preview.warnings" :key="i">{{ w }}</li>
            </ul>
          </div>

          <!-- Tabs: Productos / Precios -->
          <div class="preview-tabs-section">
            <div class="preview-tabs">
              <button
                :class="['preview-tab', { active: previewTab === 'productos' }]"
                @click="previewTab = 'productos'"
                type="button"
              >
                <FontAwesomeIcon :icon="['fas', 'box']" />
                Productos ({{ preview.productsPreview.length }})
              </button>
              <button
                :class="['preview-tab', { active: previewTab === 'precios' }]"
                @click="previewTab = 'precios'"
                type="button"
              >
                <FontAwesomeIcon :icon="['fas', 'tag']" />
                Precios ({{ preview.pricesPreview.length }})
              </button>
            </div>

            <!-- Tabla de Productos -->
            <div v-if="previewTab === 'productos'" class="table-wrap">
              <div v-if="preview.productsPreview.length === 0" class="table-empty">
                No se detectaron filas en la hoja de Productos.
              </div>
              <table v-else class="preview-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Producto</th>
                    <th>Marca</th>
                    <th>Medida</th>
                    <th>Existencia</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, i) in preview.productsPreview" :key="i">
                    <td class="td-code">{{ row.codigo }}</td>
                    <td class="td-name">{{ row.producto || '—' }}</td>
                    <td>{{ row.marca || '—' }}</td>
                    <td>{{ row.medida || '—' }}</td>
                    <td>{{ row.existenciaTotal ?? row.existencia ?? '—' }}</td>
                  </tr>
                </tbody>
              </table>
              <p v-if="preview.summary.productsRows > preview.productsPreview.length" class="table-truncated">
                Mostrando {{ preview.productsPreview.length }} de {{ preview.summary.productsRows }} filas.
              </p>
            </div>

            <!-- Tabla de Precios -->
            <div v-if="previewTab === 'precios'" class="table-wrap">
              <div v-if="preview.pricesPreview.length === 0" class="table-empty">
                No se detectaron filas en la hoja de Precios.
              </div>
              <table v-else class="preview-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Producto</th>
                    <th>Medida</th>
                    <th>Línea</th>
                    <th>Precio A</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, i) in preview.pricesPreview" :key="i">
                    <td class="td-code">{{ row.codigo }}</td>
                    <td class="td-name">{{ row.producto || '—' }}</td>
                    <td>{{ row.medida || '—' }}</td>
                    <td>{{ row.linea || '—' }}</td>
                    <td class="td-price">{{ row.precioA != null ? '$' + Number(row.precioA).toLocaleString() : '—' }}</td>
                  </tr>
                </tbody>
              </table>
              <p v-if="preview.summary.pricesRows > preview.pricesPreview.length" class="table-truncated">
                Mostrando {{ preview.pricesPreview.length }} de {{ preview.summary.pricesRows }} filas.
              </p>
            </div>
          </div>

          <!-- Acciones -->
          <div class="apply-actions">
            <button
              type="button"
              class="btn btn-secondary"
              @click="resetState"
            >
              <FontAwesomeIcon :icon="['fas', 'rotate-left']" />
              Cambiar archivo
            </button>
            <button
              type="button"
              class="btn btn-apply"
              :disabled="applying || (preview.errors && preview.errors.length > 0)"
              @click="aplicarImportacion"
              :title="preview.errors && preview.errors.length > 0 ? 'Corrige los errores antes de aplicar' : ''"
            >
              <FontAwesomeIcon :icon="applying ? ['fas', 'spinner'] : ['fas', 'database']" :spin="applying" />
              {{ applying ? 'Aplicando...' : 'Aplicar Importación' }}
            </button>
          </div>

          <p v-if="preview.errors && preview.errors.length > 0" class="apply-blocked-hint">
            <FontAwesomeIcon :icon="['fas', 'circle-xmark']" />
            Hay errores en el archivo. Corrígelos antes de poder aplicar la importación.
          </p>
        </div>

        <!-- Estado: resultado aplicado -->
        <div v-else-if="step === 3 && result" class="result-panel">
          <div class="result-icon-wrap">
            <FontAwesomeIcon :icon="['fas', 'circle-check']" class="result-icon-ok" />
          </div>
          <h3 class="result-title">¡Importación completada!</h3>

          <div class="result-stats">
            <div class="result-stat">
              <span class="stat-val">{{ result.insertedProducts }}</span>
              <span class="stat-label">Productos insertados</span>
            </div>
            <div class="result-stat">
              <span class="stat-val">{{ result.updatedProducts }}</span>
              <span class="stat-label">Productos actualizados</span>
            </div>
            <div class="result-stat">
              <span class="stat-val">{{ result.insertedPrices }}</span>
              <span class="stat-label">Precios insertados</span>
            </div>
            <div class="result-stat">
              <span class="stat-val">{{ result.updatedPrices }}</span>
              <span class="stat-label">Precios actualizados</span>
            </div>
          </div>

          <div v-if="result.warnings && result.warnings.length > 0" class="warnings-panel">
            <h4 class="panel-title warning-title">
              <FontAwesomeIcon :icon="['fas', 'triangle-exclamation']" /> Advertencias
            </h4>
            <ul class="warning-list">
              <li v-for="(w, i) in result.warnings" :key="i">{{ w }}</li>
            </ul>
          </div>

          <button type="button" class="btn btn-primary" @click="resetState">
            <FontAwesomeIcon :icon="['fas', 'rotate-left']" />
            Nueva Importación
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script src="./AdminExcel.js"></script>
<style scoped src="./AdminExcel.css"></style>
