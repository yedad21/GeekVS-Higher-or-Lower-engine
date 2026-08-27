/**
 * Controlador principal del juego GeekVS (ES6 Module)
 * Conecta el motor de calculo con la interfaz visual, fondos con GIFs dinámicos
 * y modal interactivo de Justificación Canónica Cyber-Anime.
 */

import { cargarCatalogo, calcularScore, FACTOR_ALPHA } from './powerEngine.js';

// 1. Constantes y configuracion
const STORAGE_HIGH_SCORE_KEY = 'geekvs_high_score';
const ANIMATION_DURATION_MS = 900;
const ROUND_TRANSITION_DELAY_MS = 1400;

// 2. Catalogo en memoria (se puebla asincronamente)
let catalogo = [];
let mapaCatalogo = new Map();

// 3. Mapeo de elementos del DOM
const dom = {
  // Marcadores de cabecera
  currentStreak: document.getElementById('current-streak'),
  highScore: document.getElementById('high-score'),

  // Tarjeta A (Referencia)
  cardAName: document.getElementById('card-a-name'),
  cardAOrigin: document.getElementById('card-a-origin'),
  cardAPower: document.getElementById('card-a-power'),
  cardABg: document.getElementById('card-a-bg'),
  btnBreakdownA: document.getElementById('btn-breakdown-a'),

  // Tarjeta B (Desafio)
  cardBName: document.getElementById('card-b-name'),
  cardBOrigin: document.getElementById('card-b-origin'),
  cardBPower: document.getElementById('card-b-power'),
  cardBBg: document.getElementById('card-b-bg'),
  guessControls: document.getElementById('guess-controls'),
  guessPromptText: document.getElementById('guess-prompt-text'),
  cardBPowerContainer: document.getElementById('card-b-power-container'),
  btnBreakdownB: document.getElementById('btn-breakdown-b'),

  // Botones de accion
  btnHigher: document.getElementById('btn-higher'),
  btnLower: document.getElementById('btn-lower'),
  btnRestart: document.getElementById('btn-restart'),

  // Modal Game Over
  gameOverModal: document.getElementById('game-over-modal'),
  finalStreak: document.getElementById('final-streak'),
  modalHighScore: document.getElementById('modal-high-score'),

  // Modal Desglose Canónico
  modalBreakdown: document.getElementById('modal-breakdown'),
  btnCloseModal: document.getElementById('btn-close-modal'),
  btnModalAccept: document.getElementById('btn-modal-accept'),
  modalCharName: document.getElementById('modal-char-name'),
  modalCharOrigin: document.getElementById('modal-char-origin'),
  modalCharFeat: document.getElementById('modal-char-feat'),
  modalStatKills: document.getElementById('modal-stat-kills'),
  modalStatFeatPts: document.getElementById('modal-stat-feat-pts'),
  modalStatRivals: document.getElementById('modal-stat-rivals'),
  modalStatTotal: document.getElementById('modal-stat-total'),
  modalRivalsSummary: document.getElementById('modal-rivals-summary'),
  modalRivalsList: document.getElementById('modal-rivals-list'),
  modalTechniquesList: document.getElementById('modal-techniques-list'),
  modalCharNarrative: document.getElementById('modal-char-narrative')
};

// 4. Estado de la partida
const state = {
  streak: 0,
  highScore: parseInt(localStorage.getItem(STORAGE_HIGH_SCORE_KEY), 10) || 0,
  characterA: null,
  characterB: null,
  isProcessing: false
};

/**
 * Obtiene un personaje aleatorio del catalogo excluyendo IDs especificos.
 * @param {Array<string>} excludeIds - IDs a excluir de la seleccion.
 * @returns {Object} Personaje seleccionado.
 */
function obtenerPersonajeAleatorio(excludeIds = []) {
  const disponibles = catalogo.filter((p) => !excludeIds.includes(p.id));
  if (disponibles.length === 0) {
    return catalogo[Math.floor(Math.random() * catalogo.length)];
  }
  const indice = Math.floor(Math.random() * disponibles.length);
  return disponibles[indice];
}

/**
 * Formatea valores numericos con separadores de miles para una visualizacion clara.
 * @param {number} numero - Valor numerico a formatear.
 * @returns {string}
 */
function formatearPoder(numero) {
  return Number(numero || 0).toLocaleString('es-ES');
}

/**
 * Carga de forma fluida y sin parpadeos el GIF o imagen de combate en el fondo de una tarjeta.
 * @param {HTMLElement} bgElement - Elemento contenedor de fondo (.card-bg).
 * @param {Object} personaje - Datos del personaje.
 */
function actualizarFondoFluido(bgElement, personaje) {
  if (!bgElement || !personaje) return;

  const urlRecurso = personaje.gif_collage || personaje.imagen;
  if (!urlRecurso) return;

  // Pre-carga asíncrona del GIF o imagen en memoria para evitar parpadeos blancos
  const imgPrecarga = new Image();
  
  imgPrecarga.onload = () => {
    bgElement.style.backgroundImage = `url('${urlRecurso}')`;
    bgElement.classList.remove('loading');
  };

  imgPrecarga.onerror = () => {
    // Si falla el GIF, intentar fallback con la imagen estática
    if (personaje.imagen && urlRecurso !== personaje.imagen) {
      bgElement.style.backgroundImage = `url('${personaje.imagen}')`;
    }
    bgElement.classList.remove('loading');
  };

  // Transición suave de opacidad durante la carga
  bgElement.classList.add('loading');
  imgPrecarga.src = urlRecurso;
}

/**
 * Actualiza la representacion visual de la Tarjeta A (Referencia).
 */
function renderizarTarjetaA() {
  if (!state.characterA) return;
  dom.cardAName.textContent = state.characterA.nombre;
  dom.cardAOrigin.textContent = state.characterA.obra;
  dom.cardAPower.textContent = formatearPoder(state.characterA.scoreFinal);
  
  actualizarFondoFluido(dom.cardABg, state.characterA);
}

/**
 * Actualiza la representacion visual de la Tarjeta B (Desafio / Oculta).
 */
function renderizarTarjetaB() {
  if (!state.characterB) return;
  dom.cardBName.textContent = state.characterB.nombre;
  dom.cardBOrigin.textContent = state.characterB.obra;
  dom.cardBPower.textContent = '0';
  
  actualizarFondoFluido(dom.cardBBg, state.characterB);

  // Restaurar visibilidad de controles y ocultar el puntaje y botón de desglose B
  dom.guessControls.classList.remove('hidden');
  dom.cardBPowerContainer.classList.add('hidden');
  dom.btnBreakdownB.classList.add('hidden');
}

/**
 * Actualiza los contadores en la barra superior.
 */
function actualizarMarcadores() {
  dom.currentStreak.textContent = state.streak;
  dom.highScore.textContent = state.highScore;
}

/**
 * Controla el bloqueo interactivo durante las animaciones y calculos.
 * @param {boolean} deshabilitar - True para bloquear botones, False para reactivar.
 */
function alternarBotones(deshabilitar) {
  dom.btnHigher.disabled = deshabilitar;
  dom.btnLower.disabled = deshabilitar;
  state.isProcessing = deshabilitar;
}

/**
 * Realiza una animacion fluida de conteo progresivo hasta el puntaje real.
 * @param {HTMLElement} elemento - Elemento DOM donde se renderiza el numero.
 * @param {number} valorFinal - Puntaje objetivo.
 * @param {number} duracion - Tiempo en ms de la animacion.
 * @returns {Promise<void>}
 */
function animarConteoPoder(elemento, valorFinal, duracion = ANIMATION_DURATION_MS) {
  return new Promise((resolve) => {
    const inicio = performance.now();

    function actualizar(tiempoActual) {
      const tiempoTranscurrido = tiempoActual - inicio;
      const progreso = Math.min(tiempoTranscurrido / duracion, 1);
      
      // Curva de desaceleracion cubic ease-out
      const factorSuavizado = 1 - Math.pow(1 - progreso, 3);
      const valorActual = Math.floor(factorSuavizado * valorFinal);

      elemento.textContent = formatearPoder(valorActual);

      if (progreso < 1) {
        requestAnimationFrame(actualizar);
      } else {
        elemento.textContent = formatearPoder(valorFinal);
        resolve();
      }
    }

    requestAnimationFrame(actualizar);
  });
}

/**
 * Despliega el modal de desglose canónico con los cálculos matemáticos y datos del personaje.
 * @param {Object} personaje - Personaje a inspeccionar.
 */
function abrirModalDesglose(personaje) {
  if (!personaje) return;

  // 1. Cabecera y datos generales
  dom.modalCharName.textContent = personaje.nombre;
  dom.modalCharOrigin.textContent = personaje.obra;
  dom.modalCharFeat.textContent = personaje.hazana_descripcion || 'Sin registro de hazaña adicional.';

  // 2. Desglose Matemático
  dom.modalStatKills.textContent = formatearPoder(personaje.bajas_directas);
  dom.modalStatFeatPts.textContent = formatearPoder(personaje.bono_hazana);
  dom.modalStatTotal.textContent = formatearPoder(personaje.scoreFinal);

  // 3. Cálculo dinámico de herencia de rivales (50% transitivo)
  dom.modalRivalsList.innerHTML = '';
  let aporteTotalRivales = 0;
  const derrotados = personaje.derrotados || [];

  if (derrotados.length > 0) {
    derrotados.forEach((rivalId) => {
      const rivalObj = mapaCatalogo.get(rivalId);
      const nombreRival = rivalObj ? rivalObj.nombre : rivalId;
      const scoreRival = calcularScore(rivalId, mapaCatalogo);
      const aporteRival = Math.round(scoreRival * FACTOR_ALPHA);
      aporteTotalRivales += aporteRival;

      const badge = document.createElement('div');
      badge.className = 'rival-badge';
      badge.innerHTML = `<span>⚔️ ${nombreRival}</span> <span class="rival-bonus">+${formatearPoder(aporteRival)} pts</span>`;
      dom.modalRivalsList.appendChild(badge);
    });

    dom.modalStatRivals.textContent = `+${formatearPoder(aporteTotalRivales)}`;
    dom.modalRivalsSummary.textContent = `${derrotados.length} rival(es) en cadena transitiva`;
  } else {
    dom.modalStatRivals.textContent = '0';
    dom.modalRivalsSummary.textContent = 'Sin rivales derrotados en registro';
    const noRivals = document.createElement('span');
    noRivals.className = 'no-rivals-text';
    noRivals.textContent = 'Este combatiente no hereda poder de rivales previos.';
    dom.modalRivalsList.appendChild(noRivals);
  }

  // 4. Lista de Técnicas y Habilidades Canónicas (Pills)
  dom.modalTechniquesList.innerHTML = '';
  const habilidades = personaje.habilidades || ['Técnicas de Combate Estándar'];
  habilidades.forEach((habilidad) => {
    const pill = document.createElement('div');
    pill.className = 'tech-pill';
    pill.innerHTML = `<span class="tech-pill-dot"></span><span>${habilidad}</span>`;
    dom.modalTechniquesList.appendChild(pill);
  });

  // 5. Explicación Narrativa
  dom.modalCharNarrative.textContent = personaje.justificacion_canonica || 'Justificación canónica no disponible.';

  // 6. Mostrar Modal
  dom.modalBreakdown.classList.remove('hidden');
}

/**
 * Cierra el modal de desglose canónico.
 */
function cerrarModalDesglose() {
  dom.modalBreakdown.classList.add('hidden');
}

/**
 * Muestra la pantalla de Game Over con las estadisticas de la ronda.
 */
function ejecutarGameOver() {
  dom.finalStreak.textContent = state.streak;
  dom.modalHighScore.textContent = state.highScore;
  dom.gameOverModal.classList.remove('hidden');
}

/**
 * Evalua la eleccion del jugador (Higher / Lower), revela el poder y avanza la partida.
 * @param {boolean} esMayor - True si eligio 'Higher', False si eligio 'Lower'.
 */
async function manejarEleccion(esMayor) {
  if (state.isProcessing) return;
  alternarBotones(true);

  // 1. Ocultar botones y desplegar contenedor de poder de B
  dom.guessControls.classList.add('hidden');
  dom.cardBPowerContainer.classList.remove('hidden');

  // 2. Animar el conteo numerico de poder
  await animarConteoPoder(dom.cardBPower, state.characterB.scoreFinal);

  // 3. Revelar botón de Desglose Canónico en la tarjeta B
  dom.btnBreakdownB.classList.remove('hidden');

  // 4. Validacion de la condicion de victoria
  const poderA = state.characterA.scoreFinal;
  const poderB = state.characterB.scoreFinal;
  const acerto = esMayor ? poderB >= poderA : poderB <= poderA;

  // 5. Pausa de apreciación del resultado
  await new Promise((res) => setTimeout(res, ROUND_TRANSITION_DELAY_MS));

  if (acerto) {
    // Incrementar racha actual
    state.streak += 1;

    // Actualizar y persistir High Score si se supero
    if (state.streak > state.highScore) {
      state.highScore = state.streak;
      localStorage.setItem(STORAGE_HIGH_SCORE_KEY, state.highScore.toString());
    }

    actualizarMarcadores();

    // Promocion de B a A y seleccion de nuevo B aleatorio
    state.characterA = state.characterB;
    state.characterB = obtenerPersonajeAleatorio([state.characterA.id]);

    // Renderizar nueva ronda y reactivar interaccion
    renderizarTarjetaA();
    renderizarTarjetaB();
    alternarBotones(false);
  } else {
    // Fin de la partida
    ejecutarGameOver();
  }
}

/**
 * Inicia o reinicia una partida completa.
 */
export function iniciarPartida() {
  if (!catalogo || catalogo.length < 2) {
    console.warn('[GeekVS] Catalogo insuficiente para iniciar la partida.');
    return;
  }

  state.streak = 0;
  state.isProcessing = false;
  alternarBotones(false);
  actualizarMarcadores();

  // Ocultar modales
  dom.gameOverModal.classList.add('hidden');
  dom.modalBreakdown.classList.add('hidden');

  // Seleccionar personajes iniciales A y B (sin repeticiones)
  state.characterA = obtenerPersonajeAleatorio();
  state.characterB = obtenerPersonajeAleatorio([state.characterA.id]);

  // Renderizar vistas
  renderizarTarjetaA();
  renderizarTarjetaB();
}

/**
 * Inicializador asincrono de la aplicacion.
 */
async function inicializarApp() {
  try {
    catalogo = await cargarCatalogo('./characters.json');
    mapaCatalogo = new Map(catalogo.map((p) => [p.id, p]));
    iniciarPartida();
  } catch (error) {
    console.error('[GeekVS] Error critico en la inicializacion:', error);
  }
}

// 5. Asignacion de Event Listeners
dom.btnHigher.addEventListener('click', () => manejarEleccion(true));
dom.btnLower.addEventListener('click', () => manejarEleccion(false));
dom.btnRestart.addEventListener('click', () => iniciarPartida());

// Event Listeners para Desglose Canónico
dom.btnBreakdownA.addEventListener('click', (e) => {
  e.stopPropagation();
  abrirModalDesglose(state.characterA);
});

dom.btnBreakdownB.addEventListener('click', (e) => {
  e.stopPropagation();
  abrirModalDesglose(state.characterB);
});

dom.btnCloseModal.addEventListener('click', cerrarModalDesglose);
dom.btnModalAccept.addEventListener('click', cerrarModalDesglose);

// Cerrar modal al hacer clic en el fondo o presionar Escape
dom.modalBreakdown.addEventListener('click', (e) => {
  if (e.target === dom.modalBreakdown) {
    cerrarModalDesglose();
  }
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !dom.modalBreakdown.classList.contains('hidden')) {
    cerrarModalDesglose();
  }
});

// 6. Arranque automatico con carga asincrona de datos
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarApp);
} else {
  inicializarApp();
}
