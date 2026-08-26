/**
 * Controlador principal del juego GeekVS (ES6 Module)
 * Conecta el motor de calculo con la interfaz visual
 */

import { cargarCatalogo } from './powerEngine.js';

// 1. Constantes y configuracion
const STORAGE_HIGH_SCORE_KEY = 'geekvs_high_score';
const ANIMATION_DURATION_MS = 900;
const ROUND_TRANSITION_DELAY_MS = 1200;

// 2. Catalogo en memoria (se pobla asincronamente)
let catalogo = [];

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

  // Tarjeta B (Desafio)
  cardBName: document.getElementById('card-b-name'),
  cardBOrigin: document.getElementById('card-b-origin'),
  cardBPower: document.getElementById('card-b-power'),
  cardBBg: document.getElementById('card-b-bg'),
  guessControls: document.getElementById('guess-controls'),
  cardBPowerContainer: document.getElementById('card-b-power-container'),

  // Botones de accion
  btnHigher: document.getElementById('btn-higher'),
  btnLower: document.getElementById('btn-lower'),
  btnRestart: document.getElementById('btn-restart'),

  // Modal Game Over
  gameOverModal: document.getElementById('game-over-modal'),
  finalStreak: document.getElementById('final-streak'),
  modalHighScore: document.getElementById('modal-high-score')
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
  return Number(numero).toLocaleString('es-ES');
}

/**
 * Actualiza la representacion visual de la Tarjeta A (Referencia).
 */
function renderizarTarjetaA() {
  if (!state.characterA) return;
  dom.cardAName.textContent = state.characterA.nombre;
  dom.cardAOrigin.textContent = state.characterA.obra;
  dom.cardAPower.textContent = formatearPoder(state.characterA.scoreFinal);
  dom.cardABg.style.backgroundImage = `url('${state.characterA.imagen}')`;
}

/**
 * Actualiza la representacion visual de la Tarjeta B (Desafio / Oculta).
 */
function renderizarTarjetaB() {
  if (!state.characterB) return;
  dom.cardBName.textContent = state.characterB.nombre;
  dom.cardBOrigin.textContent = state.characterB.obra;
  dom.cardBPower.textContent = '0';
  dom.cardBBg.style.backgroundImage = `url('${state.characterB.imagen}')`;

  // Restaurar visibilidad de controles y ocultar el puntaje
  dom.guessControls.classList.remove('hidden');
  dom.cardBPowerContainer.classList.add('hidden');
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

  // 3. Validacion de la condicion de victoria
  const poderA = state.characterA.scoreFinal;
  const poderB = state.characterB.scoreFinal;
  const acerto = esMayor ? poderB >= poderA : poderB <= poderA;

  // 4. Pausa de resultado
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

  // Ocultar modal de Game Over
  dom.gameOverModal.classList.add('hidden');

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
    iniciarPartida();
  } catch (error) {
    console.error('[GeekVS] Error critico en la inicializacion:', error);
  }
}

// 5. Asignacion de Event Listeners
dom.btnHigher.addEventListener('click', () => manejarEleccion(true));
dom.btnLower.addEventListener('click', () => manejarEleccion(false));
dom.btnRestart.addEventListener('click', () => iniciarPartida());

// 6. Arranque automatico con carga asincrona de datos
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarApp);
} else {
  inicializarApp();
}
