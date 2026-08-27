/**
 * Controlador principal de GeekVS (ES6 Module)
 * Arquitectura SPA: Higher or Lower, Directorio de Personajes, Registro de Universos,
 * Cosmic Tier List, Pick a Fight 1v1, Buscador Global y Panel "Mis Estadísticas".
 */

import { cargarCatalogo, calcularScore, FACTOR_ALPHA } from './powerEngine.js';

// 1. Constantes y claves de almacenamiento
const STORAGE_HIGH_SCORE_KEY = 'geekvs_high_score';
const STORAGE_TOTAL_GAMES_KEY = 'geekvs_total_games';
const STORAGE_DUELS_COUNT_KEY = 'geekvs_duels_count';
const STORAGE_BREAKDOWNS_KEY = 'geekvs_breakdowns_count';
const STORAGE_CHAR_VIEWS_KEY = 'geekvs_char_views';

const ANIMATION_DURATION_MS = 900;
const ROUND_TRANSITION_DELAY_MS = 1400;

// Configuración de los 5 Tiers Canónicos
const TIERS_CONFIG = [
  { id: 'god', name: 'TIER GOD', rangeText: 'Score ≥ 20.000', min: 20000, max: Infinity, class: 'tier-god' },
  { id: 'sss', name: 'TIER SSS', rangeText: 'Score 10.000 - 19.999', min: 10000, max: 19999, class: 'tier-sss' },
  { id: 's', name: 'TIER S', rangeText: 'Score 4.000 - 9.999', min: 4000, max: 9999, class: 'tier-s' },
  { id: 'a', name: 'TIER A', rangeText: 'Score 1.500 - 3.999', min: 1500, max: 3999, class: 'tier-a' },
  { id: 'b', name: 'TIER B', rangeText: 'Score < 1.500', min: 0, max: 1499, class: 'tier-b' }
];

// Letras del alfabeto para el filtro del directorio
const ALPHABET_LETTERS = ['ALL', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

// 2. Catálogo y mapa en memoria
let catalogo = [];
let mapaCatalogo = new Map();

// 3. Mapeo de elementos del DOM
const dom = {
  // Navegación táctica (5 vistas)
  navBtnGame: document.getElementById('nav-btn-game'),
  navBtnCharacters: document.getElementById('nav-btn-characters'),
  navBtnUniverses: document.getElementById('nav-btn-universes'),
  navBtnTierlist: document.getElementById('nav-btn-tierlist'),
  navBtnPickfight: document.getElementById('nav-btn-pickfight'),

  viewGame: document.getElementById('view-game'),
  viewCharacters: document.getElementById('view-characters'),
  viewUniverses: document.getElementById('view-universes'),
  viewTierlist: document.getElementById('view-tierlist'),
  viewPickfight: document.getElementById('view-pickfight'),

  // Buscador Global en Header
  globalSearchInput: document.getElementById('global-search-input'),
  btnClearGlobalSearch: document.getElementById('btn-clear-global-search'),
  globalSearchResults: document.getElementById('global-search-results'),
  headerSearchContainer: document.getElementById('header-search-container'),

  // Marcadores y botón My Stats
  currentStreak: document.getElementById('current-streak'),
  highScore: document.getElementById('high-score'),
  btnOpenStats: document.getElementById('btn-open-stats'),

  // Drawer My Stats
  drawerMyStats: document.getElementById('drawer-my-stats'),
  btnCloseStats: document.getElementById('btn-close-stats'),
  statTotalGames: document.getElementById('stat-total-games'),
  statHighStreak: document.getElementById('stat-high-streak'),
  statTotalDuels: document.getElementById('stat-total-duels'),
  statTotalBreakdowns: document.getElementById('stat-total-breakdowns'),
  favCharAvatar: document.getElementById('fav-char-avatar'),
  favCharName: document.getElementById('fav-char-name'),
  favCharUniverse: document.getElementById('fav-char-universe'),
  favCharViews: document.getElementById('fav-char-views'),
  btnClearStats: document.getElementById('btn-clear-stats'),

  // Vista 1: Higher or Lower
  cardAName: document.getElementById('card-a-name'),
  cardAOrigin: document.getElementById('card-a-origin'),
  cardAPower: document.getElementById('card-a-power'),
  cardABg: document.getElementById('card-a-bg'),
  btnBreakdownA: document.getElementById('btn-breakdown-a'),

  cardBName: document.getElementById('card-b-name'),
  cardBOrigin: document.getElementById('card-b-origin'),
  cardBPower: document.getElementById('card-b-power'),
  cardBBg: document.getElementById('card-b-bg'),
  guessControls: document.getElementById('guess-controls'),
  guessPromptText: document.getElementById('guess-prompt-text'),
  cardBPowerContainer: document.getElementById('card-b-power-container'),
  btnBreakdownB: document.getElementById('btn-breakdown-b'),

  btnHigher: document.getElementById('btn-higher'),
  btnLower: document.getElementById('btn-lower'),
  btnRestart: document.getElementById('btn-restart'),
  gameOverModal: document.getElementById('game-over-modal'),
  finalStreak: document.getElementById('final-streak'),
  modalHighScore: document.getElementById('modal-high-score'),

  // Vista 2: Directorio de Personajes
  alphabetBar: document.getElementById('alphabet-bar'),
  inputDirectorySearch: document.getElementById('input-directory-search'),
  btnClearDirectorySearch: document.getElementById('btn-clear-directory-search'),
  selectDirectoryUniverse: document.getElementById('select-directory-universe'),
  charactersDirectoryGrid: document.getElementById('characters-directory-grid'),
  directoryCharCount: document.getElementById('directory-char-count'),

  // Vista 3: Universos
  universesGrid: document.getElementById('universes-grid'),
  universesTotalCount: document.getElementById('universes-total-count'),

  // Vista 4: Tier List
  tierlistTotalCount: document.getElementById('tierlist-total-count'),
  inputSearchCharacter: document.getElementById('input-search-character'),
  btnClearSearch: document.getElementById('btn-clear-search'),
  selectUniverseFilter: document.getElementById('select-universe-filter'),
  tierlistRowsWrapper: document.getElementById('tierlist-rows-wrapper'),

  // Vista 5: Pick a Fight (1v1)
  slotP1Empty: document.getElementById('slot-p1-empty'),
  slotP1Selected: document.getElementById('slot-p1-selected'),
  slotP1Bg: document.getElementById('slot-p1-bg'),
  slotP1Name: document.getElementById('slot-p1-name'),
  slotP1Origin: document.getElementById('slot-p1-origin'),
  slotP1Power: document.getElementById('slot-p1-power'),
  btnSelectP1: document.getElementById('btn-select-p1'),
  btnChangeP1: document.getElementById('btn-change-p1'),
  btnBreakdownP1: document.getElementById('btn-breakdown-p1'),

  slotP2Empty: document.getElementById('slot-p2-empty'),
  slotP2Selected: document.getElementById('slot-p2-selected'),
  slotP2Bg: document.getElementById('slot-p2-bg'),
  slotP2Name: document.getElementById('slot-p2-name'),
  slotP2Origin: document.getElementById('slot-p2-origin'),
  slotP2Power: document.getElementById('slot-p2-power'),
  btnSelectP2: document.getElementById('btn-select-p2'),
  btnChangeP2: document.getElementById('btn-change-p2'),
  btnBreakdownP2: document.getElementById('btn-breakdown-p2'),

  btnRunBattle: document.getElementById('btn-run-battle'),
  battleResultsPanel: document.getElementById('battle-results-panel'),

  winnerCharName: document.getElementById('winner-char-name'),
  winnerMarginBadge: document.getElementById('winner-margin-badge'),
  compNameP1: document.getElementById('comp-name-p1'),
  compNameP2: document.getElementById('comp-name-p2'),
  barP1: document.getElementById('bar-p1'),
  barP2: document.getElementById('bar-p2'),
  compScoreP1: document.getElementById('comp-score-p1'),
  compScoreP2: document.getElementById('comp-score-p2'),

  tblHeaderP1: document.getElementById('tbl-header-p1'),
  tblHeaderP2: document.getElementById('tbl-header-p2'),
  tblKillsP1: document.getElementById('tbl-kills-p1'),
  tblKillsP2: document.getElementById('tbl-kills-p2'),
  tblFeatsP1: document.getElementById('tbl-feats-p1'),
  tblFeatsP2: document.getElementById('tbl-feats-p2'),
  tblInheritedP1: document.getElementById('tbl-inherited-p1'),
  tblInheritedP2: document.getElementById('tbl-inherited-p2'),
  tblTotalP1: document.getElementById('tbl-total-p1'),
  tblTotalP2: document.getElementById('tbl-total-p2'),
  techTitleP1: document.getElementById('tech-title-p1'),
  techTitleP2: document.getElementById('tech-title-p2'),
  techListP1: document.getElementById('tech-list-p1'),
  techListP2: document.getElementById('tech-list-p2'),

  btnShareDuel: document.getElementById('btn-share-duel'),
  btnShareText: document.getElementById('btn-share-text'),
  btnResetBattle: document.getElementById('btn-reset-battle'),

  drawerFighterSelect: document.getElementById('drawer-fighter-select'),
  btnCloseFighterSelect: document.getElementById('btn-close-fighter-select'),
  fighterSelectSlotBadge: document.getElementById('fighter-select-slot-badge'),
  inputSearchFighter: document.getElementById('input-search-fighter'),
  btnClearSearchFighter: document.getElementById('btn-clear-search-fighter'),
  selectUniverseFighter: document.getElementById('select-universe-fighter'),
  fighterSelectGrid: document.getElementById('fighter-select-grid'),

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

// 4. Estado de la aplicación
const state = {
  activeView: 'view-game',
  streak: 0,
  highScore: parseInt(localStorage.getItem(STORAGE_HIGH_SCORE_KEY), 10) || 0,
  characterA: null,
  characterB: null,
  isProcessing: false,
  // Directorio
  directory: {
    letter: 'ALL',
    searchTerm: '',
    selectedUniverse: 'all'
  },
  // Tier list
  tierlist: {
    searchTerm: '',
    selectedUniverse: 'all'
  },
  // Pick a fight
  pickFight: {
    p1: null,
    p2: null,
    targetSlot: null,
    searchTerm: '',
    selectedUniverse: 'all'
  }
};

/**
 * Cambia la vista activa de la SPA.
 * @param {string} viewId - ID de la vista ('view-game' | 'view-characters' | 'view-universes' | 'view-tierlist' | 'view-pickfight').
 */
function cambiarVista(viewId) {
  state.activeView = viewId;

  // Actualizar clases activas en navegación
  dom.navBtnGame.classList.toggle('active', viewId === 'view-game');
  dom.navBtnCharacters.classList.toggle('active', viewId === 'view-characters');
  dom.navBtnUniverses.classList.toggle('active', viewId === 'view-universes');
  dom.navBtnTierlist.classList.toggle('active', viewId === 'view-tierlist');
  dom.navBtnPickfight.classList.toggle('active', viewId === 'view-pickfight');

  // Alternar visibilidad de vistas
  dom.viewGame.classList.toggle('hidden', viewId !== 'view-game');
  dom.viewCharacters.classList.toggle('hidden', viewId !== 'view-characters');
  dom.viewUniverses.classList.toggle('hidden', viewId !== 'view-universes');
  dom.viewTierlist.classList.toggle('hidden', viewId !== 'view-tierlist');
  dom.viewPickfight.classList.toggle('hidden', viewId !== 'view-pickfight');

  if (viewId === 'view-characters') {
    renderizarDirectorioPersonajes();
  } else if (viewId === 'view-universes') {
    renderizarUniversos();
  } else if (viewId === 'view-tierlist') {
    renderizarTierList();
  }
}

/**
 * Obtiene un personaje aleatorio del catalogo excluyendo IDs especificos.
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
 * Formatea valores numéricos con separadores de miles.
 */
function formatearPoder(numero) {
  return Number(numero || 0).toLocaleString('es-ES');
}

/**
 * Carga fluida de imagen o GIF de combate sin parpadeo.
 */
function actualizarFondoFluido(bgElement, personaje) {
  if (!bgElement || !personaje) return;

  const urlRecurso = personaje.gif_collage || personaje.imagen;
  if (!urlRecurso) return;

  const imgPrecarga = new Image();
  imgPrecarga.onload = () => {
    bgElement.style.backgroundImage = `url('${urlRecurso}')`;
    bgElement.classList.remove('loading');
  };
  imgPrecarga.onerror = () => {
    if (personaje.imagen && urlRecurso !== personaje.imagen) {
      bgElement.style.backgroundImage = `url('${personaje.imagen}')`;
    }
    bgElement.classList.remove('loading');
  };

  bgElement.classList.add('loading');
  imgPrecarga.src = urlRecurso;
}

// =========================================================================
// SISTEMA DE ESTADÍSTICAS DEL USUARIO (MY STATS)
// =========================================================================

function obtenerStatsLocales() {
  const charViews = JSON.parse(localStorage.getItem(STORAGE_CHAR_VIEWS_KEY) || '{}');
  return {
    totalGames: parseInt(localStorage.getItem(STORAGE_TOTAL_GAMES_KEY), 10) || 0,
    highScore: parseInt(localStorage.getItem(STORAGE_HIGH_SCORE_KEY), 10) || 0,
    duelsCount: parseInt(localStorage.getItem(STORAGE_DUELS_COUNT_KEY), 10) || 0,
    breakdownsCount: parseInt(localStorage.getItem(STORAGE_BREAKDOWNS_KEY), 10) || 0,
    charViews
  };
}

function registrarPartidaIniciada() {
  const stats = obtenerStatsLocales();
  stats.totalGames += 1;
  localStorage.setItem(STORAGE_TOTAL_GAMES_KEY, stats.totalGames.toString());
}

function registrarDueloSimulado() {
  const stats = obtenerStatsLocales();
  stats.duelsCount += 1;
  localStorage.setItem(STORAGE_DUELS_COUNT_KEY, stats.duelsCount.toString());
}

function registrarConsultaDesglose(charId) {
  if (!charId) return;
  const stats = obtenerStatsLocales();
  stats.breakdownsCount += 1;
  stats.charViews[charId] = (stats.charViews[charId] || 0) + 1;

  localStorage.setItem(STORAGE_BREAKDOWNS_KEY, stats.breakdownsCount.toString());
  localStorage.setItem(STORAGE_CHAR_VIEWS_KEY, JSON.stringify(stats.charViews));
}

function actualizarDrawerEstadisticas() {
  const stats = obtenerStatsLocales();
  dom.statTotalGames.textContent = stats.totalGames;
  dom.statHighStreak.textContent = stats.highScore;
  dom.statTotalDuels.textContent = stats.duelsCount;
  dom.statTotalBreakdowns.textContent = stats.breakdownsCount;

  // Determinar personaje favorito
  let maxViews = 0;
  let favId = null;

  for (const [id, views] of Object.entries(stats.charViews)) {
    if (views > maxViews) {
      maxViews = views;
      favId = id;
    }
  }

  const favPersonaje = favId ? mapaCatalogo.get(favId) : (catalogo[0] || null);

  if (favPersonaje) {
    dom.favCharName.textContent = favPersonaje.nombre;
    dom.favCharUniverse.textContent = favPersonaje.obra;
    dom.favCharViews.textContent = `${maxViews} inspecciones canónicas`;
    dom.favCharAvatar.style.backgroundImage = `url('${favPersonaje.gif_collage || favPersonaje.imagen}')`;
  } else {
    dom.favCharName.textContent = 'Sin registros';
    dom.favCharUniverse.textContent = 'Consulta desgloses para registrar';
    dom.favCharViews.textContent = '0 consultas';
    dom.favCharAvatar.style.backgroundImage = '';
  }
}

function reiniciarEstadisticas() {
  if (confirm('¿Deseas reiniciar todas tus estadísticas y récords locales de GeekVS?')) {
    localStorage.removeItem(STORAGE_HIGH_SCORE_KEY);
    localStorage.removeItem(STORAGE_TOTAL_GAMES_KEY);
    localStorage.removeItem(STORAGE_DUELS_COUNT_KEY);
    localStorage.removeItem(STORAGE_BREAKDOWNS_KEY);
    localStorage.removeItem(STORAGE_CHAR_VIEWS_KEY);

    state.highScore = 0;
    actualizarMarcadores();
    actualizarDrawerEstadisticas();
  }
}

// =========================================================================
// BUSCADOR GLOBAL EN HEADER
// =========================================================================

function ejecutarBusquedaGlobal(texto) {
  const termino = texto.trim().toLowerCase();
  if (!termino) {
    dom.globalSearchResults.classList.add('hidden');
    dom.globalSearchResults.innerHTML = '';
    return;
  }

  const resultados = catalogo.filter((p) => {
    const coincideNombre = p.nombre.toLowerCase().includes(termino);
    const coincideObra = p.obra.toLowerCase().includes(termino);
    const coincideHazana = (p.hazana_descripcion || '').toLowerCase().includes(termino);
    const coincideTecnicas = (p.habilidades || []).some((h) => h.toLowerCase().includes(termino));

    return coincideNombre || coincideObra || coincideHazana || coincideTecnicas;
  }).slice(0, 6); // Max 6 resultados rápidos

  dom.globalSearchResults.innerHTML = '';

  if (resultados.length === 0) {
    const noItem = document.createElement('div');
    noItem.className = 'tier-empty-msg';
    noItem.style.padding = '0.5rem';
    noItem.textContent = 'Sin resultados.';
    dom.globalSearchResults.appendChild(noItem);
  } else {
    resultados.forEach((p) => {
      const item = document.createElement('div');
      item.className = 'global-search-item';
      item.innerHTML = `
        <div class="global-item-avatar" style="background-image: url('${p.gif_collage || p.imagen}')"></div>
        <div class="global-item-info">
          <span class="global-item-name">${p.nombre}</span>
          <span class="global-item-origin">${p.obra}</span>
        </div>
        <span class="global-item-score">${formatearPoder(p.scoreFinal)}</span>
      `;

      item.addEventListener('click', () => {
        abrirModalDesglose(p);
        dom.globalSearchResults.classList.add('hidden');
        dom.globalSearchInput.value = '';
        dom.btnClearGlobalSearch.classList.add('hidden');
      });

      dom.globalSearchResults.appendChild(item);
    });
  }

  dom.globalSearchResults.classList.remove('hidden');
}

// =========================================================================
// VISTA 1: HIGHER OR LOWER LOGIC
// =========================================================================

function renderizarTarjetaA() {
  if (!state.characterA) return;
  dom.cardAName.textContent = state.characterA.nombre;
  dom.cardAOrigin.textContent = state.characterA.obra;
  dom.cardAPower.textContent = formatearPoder(state.characterA.scoreFinal);
  actualizarFondoFluido(dom.cardABg, state.characterA);
}

function renderizarTarjetaB() {
  if (!state.characterB) return;
  dom.cardBName.textContent = state.characterB.nombre;
  dom.cardBOrigin.textContent = state.characterB.obra;
  dom.cardBPower.textContent = '0';
  actualizarFondoFluido(dom.cardBBg, state.characterB);

  dom.guessControls.classList.remove('hidden');
  dom.cardBPowerContainer.classList.add('hidden');
  dom.btnBreakdownB.classList.add('hidden');
}

function actualizarMarcadores() {
  dom.currentStreak.textContent = state.streak;
  dom.highScore.textContent = state.highScore;
}

function alternarBotones(deshabilitar) {
  dom.btnHigher.disabled = deshabilitar;
  dom.btnLower.disabled = deshabilitar;
  state.isProcessing = deshabilitar;
}

function animarConteoPoder(elemento, valorFinal, duracion = ANIMATION_DURATION_MS) {
  return new Promise((resolve) => {
    const inicio = performance.now();
    function actualizar(tiempoActual) {
      const tiempoTranscurrido = tiempoActual - inicio;
      const progreso = Math.min(tiempoTranscurrido / duracion, 1);
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

async function manejarEleccion(esMayor) {
  if (state.isProcessing) return;
  alternarBotones(true);

  dom.guessControls.classList.add('hidden');
  dom.cardBPowerContainer.classList.remove('hidden');

  await animarConteoPoder(dom.cardBPower, state.characterB.scoreFinal);
  dom.btnBreakdownB.classList.remove('hidden');

  const poderA = state.characterA.scoreFinal;
  const poderB = state.characterB.scoreFinal;
  const acerto = esMayor ? poderB >= poderA : poderB <= poderA;

  await new Promise((res) => setTimeout(res, ROUND_TRANSITION_DELAY_MS));

  if (acerto) {
    state.streak += 1;
    if (state.streak > state.highScore) {
      state.highScore = state.streak;
      localStorage.setItem(STORAGE_HIGH_SCORE_KEY, state.highScore.toString());
    }
    actualizarMarcadores();

    state.characterA = state.characterB;
    state.characterB = obtenerPersonajeAleatorio([state.characterA.id]);

    renderizarTarjetaA();
    renderizarTarjetaB();
    alternarBotones(false);
  } else {
    ejecutarGameOver();
  }
}

function ejecutarGameOver() {
  dom.finalStreak.textContent = state.streak;
  dom.modalHighScore.textContent = state.highScore;
  dom.gameOverModal.classList.remove('hidden');
}

export function iniciarPartida() {
  if (!catalogo || catalogo.length < 2) return;

  state.streak = 0;
  state.isProcessing = false;
  alternarBotones(false);
  actualizarMarcadores();
  registrarPartidaIniciada();

  dom.gameOverModal.classList.add('hidden');
  dom.modalBreakdown.classList.add('hidden');

  state.characterA = obtenerPersonajeAleatorio();
  state.characterB = obtenerPersonajeAleatorio([state.characterA.id]);

  renderizarTarjetaA();
  renderizarTarjetaB();
}

// =========================================================================
// VISTA 2: DIRECTORIO DE PERSONAJES (ALPHABET + GRID)
// =========================================================================

function inicializarBarraAlfabetica() {
  if (!dom.alphabetBar) return;
  dom.alphabetBar.innerHTML = '';

  ALPHABET_LETTERS.forEach((letra) => {
    const btn = document.createElement('button');
    btn.className = `alphabet-btn ${letra === state.directory.letter ? 'active' : ''}`;
    btn.textContent = letra;
    btn.addEventListener('click', () => {
      state.directory.letter = letra;
      document.querySelectorAll('.alphabet-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderizarDirectorioPersonajes();
    });
    dom.alphabetBar.appendChild(btn);
  });
}

function renderizarDirectorioPersonajes() {
  if (!dom.charactersDirectoryGrid) return;

  const letra = state.directory.letter;
  const termino = (dom.inputDirectorySearch.value || '').trim().toLowerCase();
  const universo = dom.selectDirectoryUniverse.value || 'all';

  const personajesFiltrados = catalogo.filter((p) => {
    const cumpleUniverso = universo === 'all' || p.obra === universo;
    const cumpleLetra = letra === 'ALL' || p.nombre.trim().toUpperCase().startsWith(letra);
    const coincideNombre = p.nombre.toLowerCase().includes(termino);
    const coincideObra = p.obra.toLowerCase().includes(termino);
    const coincideHazana = (p.hazana_descripcion || '').toLowerCase().includes(termino);
    const coincideTecnicas = (p.habilidades || []).some((h) => h.toLowerCase().includes(termino));

    return cumpleUniverso && cumpleLetra && (!termino || coincideNombre || coincideObra || coincideHazana || coincideTecnicas);
  }).sort((a, b) => a.nombre.localeCompare(b.nombre));

  dom.directoryCharCount.textContent = personajesFiltrados.length;
  dom.charactersDirectoryGrid.innerHTML = '';

  if (personajesFiltrados.length === 0) {
    const noResults = document.createElement('div');
    noResults.className = 'tier-empty-msg';
    noResults.style.gridColumn = '1 / -1';
    noResults.textContent = 'No se encontraron personajes para los criterios seleccionados.';
    dom.charactersDirectoryGrid.appendChild(noResults);
    return;
  }

  personajesFiltrados.forEach((personaje) => {
    const card = document.createElement('div');
    card.className = 'character-dir-card';

    const avatarUrl = personaje.gif_collage || personaje.imagen;

    card.innerHTML = `
      <div class="dir-avatar-circle" style="background-image: url('${avatarUrl}')"></div>
      <div class="dir-card-info">
        <h3 class="dir-card-name">${personaje.nombre}</h3>
        <span class="dir-card-origin">${personaje.obra}</span>
        <div class="dir-card-score-badge">
          <span>⚡</span>
          <span>${formatearPoder(personaje.scoreFinal)} pts</span>
        </div>
      </div>
      <button class="btn-dir-breakdown" aria-label="Ver desglose canónico de ${personaje.nombre}">ℹ️ Desglose</button>
    `;

    card.querySelector('.btn-dir-breakdown').addEventListener('click', (e) => {
      e.stopPropagation();
      abrirModalDesglose(personaje);
    });

    card.addEventListener('click', () => abrirModalDesglose(personaje));

    dom.charactersDirectoryGrid.appendChild(card);
  });
}

// =========================================================================
// VISTA 3: REGISTRO DE UNIVERSOS (FRANQUICIAS & AVG POWER)
// =========================================================================

function calcularMetricasUniversos() {
  const mapaUniversos = new Map();

  catalogo.forEach((p) => {
    const obra = p.obra || 'Desconocido';
    if (!mapaUniversos.has(obra)) {
      mapaUniversos.set(obra, {
        nombre: obra,
        personajes: [],
        totalScore: 0,
        topFighter: null
      });
    }
    const u = mapaUniversos.get(obra);
    u.personajes.push(p);
    u.totalScore += p.scoreFinal;

    if (!u.topFighter || p.scoreFinal > u.topFighter.scoreFinal) {
      u.topFighter = p;
    }
  });

  return Array.from(mapaUniversos.values()).map((u) => ({
    ...u,
    count: u.personajes.length,
    avgPower: Math.round(u.totalScore / u.personajes.length)
  })).sort((a, b) => b.avgPower - a.avgPower);
}

function renderizarUniversos() {
  if (!dom.universesGrid) return;

  const metricas = calcularMetricasUniversos();
  dom.universesTotalCount.textContent = metricas.length;
  dom.universesGrid.innerHTML = '';

  metricas.forEach((u) => {
    const card = document.createElement('div');
    card.className = 'universe-card';

    const topAvatar = u.topFighter ? (u.topFighter.gif_collage || u.topFighter.imagen) : '';

    card.innerHTML = `
      <div class="universe-card-header">
        <h3 class="universe-title">${u.nombre}</h3>
        <span class="universe-count-badge">${u.count} Combatiente(s)</span>
      </div>
      
      <div class="universe-stats-row">
        <div class="universe-stat-box">
          <span class="universe-stat-label">Poder Promedio</span>
          <span class="universe-stat-val">${formatearPoder(u.avgPower)}</span>
        </div>
        <div class="universe-stat-box">
          <span class="universe-stat-label">Poder Acumulado</span>
          <span class="universe-stat-val" style="color: var(--accent-cyan)">${formatearPoder(u.totalScore)}</span>
        </div>
      </div>

      <div class="universe-top-fighter">
        <div class="top-fighter-avatar" style="background-image: url('${topAvatar}')"></div>
        <div class="top-fighter-info">
          <span class="top-fighter-label">Líder del Universo:</span>
          <span class="top-fighter-name">${u.topFighter ? u.topFighter.nombre : '---'} (${formatearPoder(u.topFighter.scoreFinal)} pts)</span>
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      // Filtrar y redirigir al directorio de personajes de este universo
      dom.selectDirectoryUniverse.value = u.nombre;
      state.directory.letter = 'ALL';
      cambiarVista('view-characters');
    });

    dom.universesGrid.appendChild(card);
  });
}

// =========================================================================
// VISTA 4: TIER LIST LOGIC
// =========================================================================

function renderizarTierList() {
  if (!dom.tierlistRowsWrapper) return;

  const termino = (dom.inputSearchCharacter.value || '').trim().toLowerCase();
  const universo = dom.selectUniverseFilter.value || 'all';

  const personajesFiltrados = catalogo.filter((p) => {
    const cumpleUniverso = universo === 'all' || p.obra === universo;
    const coincideNombre = p.nombre.toLowerCase().includes(termino);
    const coincideObra = p.obra.toLowerCase().includes(termino);
    const coincideHazana = (p.hazana_descripcion || '').toLowerCase().includes(termino);
    const coincideTecnicas = (p.habilidades || []).some((h) => h.toLowerCase().includes(termino));

    return cumpleUniverso && (!termino || coincideNombre || coincideObra || coincideHazana || coincideTecnicas);
  });

  dom.tierlistTotalCount.textContent = personajesFiltrados.length;
  dom.tierlistRowsWrapper.innerHTML = '';

  TIERS_CONFIG.forEach((tier) => {
    const personajesEnTier = personajesFiltrados
      .filter((p) => p.scoreFinal >= tier.min && p.scoreFinal <= tier.max)
      .sort((a, b) => b.scoreFinal - a.scoreFinal);

    const rowEl = document.createElement('div');
    rowEl.className = `tier-row ${tier.class}`;

    const badgeEl = document.createElement('div');
    badgeEl.className = 'tier-badge';
    badgeEl.innerHTML = `
      <span class="tier-badge-title">${tier.name}</span>
      <span class="tier-badge-range">${tier.rangeText}</span>
    `;

    const gridEl = document.createElement('div');
    gridEl.className = 'tier-roster-grid';

    if (personajesEnTier.length > 0) {
      personajesEnTier.forEach((personaje) => {
        const card = document.createElement('div');
        card.className = 'roster-card';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        
        const avatarUrl = personaje.gif_collage || personaje.imagen;

        card.innerHTML = `
          <div class="roster-card-bg" style="background-image: url('${avatarUrl}')"></div>
          <div class="roster-card-overlay"></div>
          <span class="roster-card-score">${formatearPoder(personaje.scoreFinal)}</span>
          <div class="roster-card-info">
            <span class="roster-card-name">${personaje.nombre}</span>
            <span class="roster-card-origin">${personaje.obra}</span>
          </div>
          <span class="roster-card-inspect-hint">⚡ Desglose</span>
        `;

        card.addEventListener('click', () => abrirModalDesglose(personaje));
        gridEl.appendChild(card);
      });
    } else {
      const emptyMsg = document.createElement('span');
      emptyMsg.className = 'tier-empty-msg';
      emptyMsg.textContent = 'Sin combatientes registrados en este rango.';
      gridEl.appendChild(emptyMsg);
    }

    rowEl.appendChild(badgeEl);
    rowEl.appendChild(gridEl);
    dom.tierlistRowsWrapper.appendChild(rowEl);
  });
}

// =========================================================================
// VISTA 5: PICK A FIGHT (1V1 CUSTOM VERSUS) LOGIC
// =========================================================================

function abrirSelectorPeleador(slot) {
  state.pickFight.targetSlot = slot;
  dom.fighterSelectSlotBadge.textContent = slot === 'p1' ? 'SELECCIÓN JUGADOR 1 (P1)' : 'SELECCIÓN JUGADOR 2 (P2)';
  dom.fighterSelectSlotBadge.style.color = slot === 'p1' ? 'var(--accent-cyan)' : 'var(--accent-magenta)';
  
  renderizarSelectorPeleadores();
  dom.drawerFighterSelect.classList.remove('hidden');
  dom.inputSearchFighter.focus();
}

function cerrarSelectorPeleador() {
  dom.drawerFighterSelect.classList.add('hidden');
}

function renderizarSelectorPeleadores() {
  if (!dom.fighterSelectGrid) return;

  const termino = (dom.inputSearchFighter.value || '').trim().toLowerCase();
  const universo = dom.selectUniverseFighter.value || 'all';

  const personajesFiltrados = catalogo.filter((p) => {
    const cumpleUniverso = universo === 'all' || p.obra === universo;
    const coincideNombre = p.nombre.toLowerCase().includes(termino);
    const coincideObra = p.obra.toLowerCase().includes(termino);
    const coincideHazana = (p.hazana_descripcion || '').toLowerCase().includes(termino);
    const coincideTecnicas = (p.habilidades || []).some((h) => h.toLowerCase().includes(termino));

    return cumpleUniverso && (!termino || coincideNombre || coincideObra || coincideHazana || coincideTecnicas);
  });

  dom.fighterSelectGrid.innerHTML = '';

  if (personajesFiltrados.length === 0) {
    const noResults = document.createElement('div');
    noResults.className = 'tier-empty-msg';
    noResults.textContent = 'No se encontraron combatientes.';
    dom.fighterSelectGrid.appendChild(noResults);
    return;
  }

  personajesFiltrados.forEach((personaje) => {
    const card = document.createElement('div');
    card.className = 'roster-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    
    const avatarUrl = personaje.gif_collage || personaje.imagen;

    card.innerHTML = `
      <div class="roster-card-bg" style="background-image: url('${avatarUrl}')"></div>
      <div class="roster-card-overlay"></div>
      <span class="roster-card-score">${formatearPoder(personaje.scoreFinal)}</span>
      <div class="roster-card-info">
        <span class="roster-card-name">${personaje.nombre}</span>
        <span class="roster-card-origin">${personaje.obra}</span>
      </div>
      <span class="roster-card-inspect-hint">✓ Elegir</span>
    `;

    card.addEventListener('click', () => {
      asignarPeleador(state.pickFight.targetSlot, personaje);
      cerrarSelectorPeleador();
    });

    dom.fighterSelectGrid.appendChild(card);
  });
}

function asignarPeleador(slot, personaje) {
  if (!personaje) return;

  state.pickFight[slot] = personaje;

  if (slot === 'p1') {
    dom.slotP1Empty.classList.add('hidden');
    dom.slotP1Selected.classList.remove('hidden');
    dom.slotP1Name.textContent = personaje.nombre;
    dom.slotP1Origin.textContent = personaje.obra;
    dom.slotP1Power.textContent = formatearPoder(personaje.scoreFinal);
    actualizarFondoFluido(dom.slotP1Bg, personaje);
  } else if (slot === 'p2') {
    dom.slotP2Empty.classList.add('hidden');
    dom.slotP2Selected.classList.remove('hidden');
    dom.slotP2Name.textContent = personaje.nombre;
    dom.slotP2Origin.textContent = personaje.obra;
    dom.slotP2Power.textContent = formatearPoder(personaje.scoreFinal);
    actualizarFondoFluido(dom.slotP2Bg, personaje);
  }

  dom.battleResultsPanel.classList.add('hidden');
  const listos = Boolean(state.pickFight.p1 && state.pickFight.p2);
  dom.btnRunBattle.disabled = !listos;

  actualizarUrlParamsDuelo();
}

function actualizarUrlParamsDuelo() {
  if (state.pickFight.p1 && state.pickFight.p2) {
    const newUrl = `${window.location.pathname}?vs=${state.pickFight.p1.id}&p2=${state.pickFight.p2.id}`;
    window.history.replaceState({}, '', newUrl);
  }
}

async function ejecutarCalculoCombate() {
  const p1 = state.pickFight.p1;
  const p2 = state.pickFight.p2;
  if (!p1 || !p2) return;

  registrarDueloSimulado();

  const score1 = p1.scoreFinal;
  const score2 = p2.scoreFinal;
  const totalScore = Math.max(score1 + score2, 1);

  const pct1 = Math.max(Math.round((score1 / totalScore) * 100), 1);
  const pct2 = 100 - pct1;

  if (score1 > score2) {
    dom.winnerCharName.textContent = p1.nombre;
    const diff = score1 - score2;
    const ratio = ((score1 / (score2 || 1)) * 100 - 100).toFixed(0);
    dom.winnerMarginBadge.textContent = `Superioridad Canónica: +${formatearPoder(diff)} pts (+${ratio}% de ventaja)`;
    dom.winnerMarginBadge.style.borderColor = 'var(--accent-cyan)';
    dom.winnerMarginBadge.style.color = 'var(--accent-cyan)';
  } else if (score2 > score1) {
    dom.winnerCharName.textContent = p2.nombre;
    const diff = score2 - score1;
    const ratio = ((score2 / (score1 || 1)) * 100 - 100).toFixed(0);
    dom.winnerMarginBadge.textContent = `Superioridad Canónica: +${formatearPoder(diff)} pts (+${ratio}% de ventaja)`;
    dom.winnerMarginBadge.style.borderColor = 'var(--accent-magenta)';
    dom.winnerMarginBadge.style.color = 'var(--accent-magenta)';
  } else {
    dom.winnerCharName.textContent = 'EMPATE TÉCNICO CANÓNICO';
    dom.winnerMarginBadge.textContent = 'Diferencial 0: Fuerzas en perfecto equilibrio cósmico';
    dom.winnerMarginBadge.style.borderColor = 'var(--accent-yellow)';
    dom.winnerMarginBadge.style.color = 'var(--accent-yellow)';
  }

  dom.compNameP1.textContent = p1.nombre;
  dom.compNameP2.textContent = p2.nombre;
  dom.compScoreP1.textContent = `${formatearPoder(score1)} pts (${pct1}%)`;
  dom.compScoreP2.textContent = `${formatearPoder(score2)} pts (${pct2}%)`;

  dom.tblHeaderP1.textContent = p1.nombre;
  dom.tblHeaderP2.textContent = p2.nombre;

  dom.tblKillsP1.textContent = formatearPoder(p1.bajas_directas);
  dom.tblKillsP2.textContent = formatearPoder(p2.bajas_directas);

  dom.tblFeatsP1.textContent = formatearPoder(p1.bono_hazana);
  dom.tblFeatsP2.textContent = formatearPoder(p2.bono_hazana);

  const aporte1 = (p1.derrotados || []).reduce((acc, id) => acc + Math.round(calcularScore(id, mapaCatalogo) * FACTOR_ALPHA), 0);
  const aporte2 = (p2.derrotados || []).reduce((acc, id) => acc + Math.round(calcularScore(id, mapaCatalogo) * FACTOR_ALPHA), 0);

  dom.tblInheritedP1.textContent = `+${formatearPoder(aporte1)}`;
  dom.tblInheritedP2.textContent = `+${formatearPoder(aporte2)}`;

  dom.tblTotalP1.textContent = formatearPoder(score1);
  dom.tblTotalP2.textContent = formatearPoder(score2);

  dom.techTitleP1.textContent = `Técnicas de ${p1.nombre}`;
  dom.techTitleP2.textContent = `Técnicas de ${p2.nombre}`;

  dom.techListP1.innerHTML = '';
  (p1.habilidades || []).forEach((h) => {
    const pill = document.createElement('div');
    pill.className = 'tech-pill';
    pill.innerHTML = `<span class="tech-pill-dot"></span><span>${h}</span>`;
    dom.techListP1.appendChild(pill);
  });

  dom.techListP2.innerHTML = '';
  (p2.habilidades || []).forEach((h) => {
    const pill = document.createElement('div');
    pill.className = 'tech-pill';
    pill.innerHTML = `<span class="tech-pill-dot" style="background: var(--accent-magenta); box-shadow: 0 0 6px var(--accent-magenta)"></span><span>${h}</span>`;
    dom.techListP2.appendChild(pill);
  });

  dom.battleResultsPanel.classList.remove('hidden');
  
  setTimeout(() => {
    dom.barP1.style.width = `${pct1}%`;
    dom.barP2.style.width = `${pct2}%`;
  }, 100);

  dom.battleResultsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function copiarEnlaceDuelo() {
  const urlActual = window.location.href;
  try {
    await navigator.clipboard.writeText(urlActual);
    dom.btnShareText.textContent = '¡Enlace Copiado al Portapapeles! ✓';
    setTimeout(() => {
      dom.btnShareText.textContent = 'Copiar Enlace del Duelo';
    }, 2500);
  } catch (err) {
    dom.btnShareText.textContent = 'Copiado manual: ' + urlActual;
  }
}

function reiniciarArenaDuelos() {
  state.pickFight.p1 = null;
  state.pickFight.p2 = null;
  dom.slotP1Selected.classList.add('hidden');
  dom.slotP1Empty.classList.remove('hidden');
  dom.slotP2Selected.classList.add('hidden');
  dom.slotP2Empty.classList.remove('hidden');
  dom.battleResultsPanel.classList.add('hidden');
  dom.btnRunBattle.disabled = true;

  window.history.replaceState({}, '', window.location.pathname);
}

// =========================================================================
// MODAL DESGLOSE CANÓNICO
// =========================================================================

function abrirModalDesglose(personaje) {
  if (!personaje) return;

  registrarConsultaDesglose(personaje.id);

  dom.modalCharName.textContent = personaje.nombre;
  dom.modalCharOrigin.textContent = personaje.obra;
  dom.modalCharFeat.textContent = personaje.hazana_descripcion || 'Sin registro de hazaña adicional.';

  dom.modalStatKills.textContent = formatearPoder(personaje.bajas_directas);
  dom.modalStatFeatPts.textContent = formatearPoder(personaje.bono_hazana);
  dom.modalStatTotal.textContent = formatearPoder(personaje.scoreFinal);

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

  dom.modalTechniquesList.innerHTML = '';
  const habilidades = personaje.habilidades || ['Técnicas de Combate Estándar'];
  habilidades.forEach((habilidad) => {
    const pill = document.createElement('div');
    pill.className = 'tech-pill';
    pill.innerHTML = `<span class="tech-pill-dot"></span><span>${habilidad}</span>`;
    dom.modalTechniquesList.appendChild(pill);
  });

  dom.modalCharNarrative.textContent = personaje.justificacion_canonica || 'Justificación canónica no disponible.';
  dom.modalBreakdown.classList.remove('hidden');
}

function cerrarModalDesglose() {
  dom.modalBreakdown.classList.add('hidden');
}

// =========================================================================
// INICIALIZACIÓN Y EVENT LISTENERS
// =========================================================================

function poblarTodosLosFiltrosUniversos() {
  const universosUnicos = Array.from(new Set(catalogo.map((p) => p.obra))).filter(Boolean).sort();
  
  const selects = [
    dom.selectDirectoryUniverse,
    dom.selectUniverseFilter,
    dom.selectUniverseFighter
  ];

  selects.forEach((select) => {
    if (!select) return;
    select.innerHTML = '<option value="all">Todas las obras</option>';
    universosUnicos.forEach((obra) => {
      const opt = document.createElement('option');
      opt.value = obra;
      opt.textContent = obra;
      select.appendChild(opt);
    });
  });
}

function procesarParametrosUrl() {
  const params = new URLSearchParams(window.location.search);
  const p1Id = params.get('vs') || params.get('p1');
  const p2Id = params.get('p2');

  if (p1Id && p2Id && mapaCatalogo.has(p1Id) && mapaCatalogo.has(p2Id)) {
    asignarPeleador('p1', mapaCatalogo.get(p1Id));
    asignarPeleador('p2', mapaCatalogo.get(p2Id));
    cambiarVista('view-pickfight');
    ejecutarCalculoCombate();
  }
}

async function inicializarApp() {
  try {
    catalogo = await cargarCatalogo('./characters.json');
    mapaCatalogo = new Map(catalogo.map((p) => [p.id, p]));
    
    poblarTodosLosFiltrosUniversos();
    inicializarBarraAlfabetica();
    iniciarPartida();
    procesarParametrosUrl();
  } catch (error) {
    console.error('[GeekVS] Error critico en la inicializacion:', error);
  }
}

// 5. Asignación de Event Listeners

// Navegación SPA
dom.navBtnGame.addEventListener('click', () => cambiarVista('view-game'));
dom.navBtnCharacters.addEventListener('click', () => cambiarVista('view-characters'));
dom.navBtnUniverses.addEventListener('click', () => cambiarVista('view-universes'));
dom.navBtnTierlist.addEventListener('click', () => cambiarVista('view-tierlist'));
dom.navBtnPickfight.addEventListener('click', () => cambiarVista('view-pickfight'));

// Buscador Global en Header
dom.globalSearchInput.addEventListener('input', (e) => {
  const texto = e.target.value;
  dom.btnClearGlobalSearch.classList.toggle('hidden', !texto);
  ejecutarBusquedaGlobal(texto);
});

dom.btnClearGlobalSearch.addEventListener('click', () => {
  dom.globalSearchInput.value = '';
  dom.btnClearGlobalSearch.classList.add('hidden');
  dom.globalSearchResults.classList.add('hidden');
});

// Cerrar resultados globales al hacer clic fuera
document.addEventListener('click', (e) => {
  if (!dom.headerSearchContainer.contains(e.target)) {
    dom.globalSearchResults.classList.add('hidden');
  }
});

// Drawer My Stats
dom.btnOpenStats.addEventListener('click', () => {
  actualizarDrawerEstadisticas();
  dom.drawerMyStats.classList.remove('hidden');
});

dom.btnCloseStats.addEventListener('click', () => {
  dom.drawerMyStats.classList.add('hidden');
});

dom.drawerMyStats.addEventListener('click', (e) => {
  if (e.target === dom.drawerMyStats) dom.drawerMyStats.classList.add('hidden');
});

dom.btnClearStats.addEventListener('click', reiniciarEstadisticas);

// Higher or Lower
dom.btnHigher.addEventListener('click', () => manejarEleccion(true));
dom.btnLower.addEventListener('click', () => manejarEleccion(false));
dom.btnRestart.addEventListener('click', () => iniciarPartida());

dom.btnBreakdownA.addEventListener('click', (e) => {
  e.stopPropagation();
  abrirModalDesglose(state.characterA);
});
dom.btnBreakdownB.addEventListener('click', (e) => {
  e.stopPropagation();
  abrirModalDesglose(state.characterB);
});

// Directorio de Personajes
dom.inputDirectorySearch.addEventListener('input', (e) => {
  dom.btnClearDirectorySearch.classList.toggle('hidden', !e.target.value);
  renderizarDirectorioPersonajes();
});

dom.btnClearDirectorySearch.addEventListener('click', () => {
  dom.inputDirectorySearch.value = '';
  dom.btnClearDirectorySearch.classList.add('hidden');
  renderizarDirectorioPersonajes();
});

dom.selectDirectoryUniverse.addEventListener('change', renderizarDirectorioPersonajes);

// Tier List
dom.inputSearchCharacter.addEventListener('input', (e) => {
  dom.btnClearSearch.classList.toggle('hidden', !e.target.value);
  renderizarTierList();
});

dom.btnClearSearch.addEventListener('click', () => {
  dom.inputSearchCharacter.value = '';
  dom.btnClearSearch.classList.add('hidden');
  renderizarTierList();
});

dom.selectUniverseFilter.addEventListener('change', renderizarTierList);

// Pick a Fight
dom.btnSelectP1.addEventListener('click', () => abrirSelectorPeleador('p1'));
dom.btnChangeP1.addEventListener('click', () => abrirSelectorPeleador('p1'));
dom.btnSelectP2.addEventListener('click', () => abrirSelectorPeleador('p2'));
dom.btnChangeP2.addEventListener('click', () => abrirSelectorPeleador('p2'));

dom.btnBreakdownP1.addEventListener('click', (e) => {
  e.stopPropagation();
  abrirModalDesglose(state.pickFight.p1);
});
dom.btnBreakdownP2.addEventListener('click', (e) => {
  e.stopPropagation();
  abrirModalDesglose(state.pickFight.p2);
});

dom.btnCloseFighterSelect.addEventListener('click', cerrarSelectorPeleador);
dom.inputSearchFighter.addEventListener('input', (e) => {
  dom.btnClearSearchFighter.classList.toggle('hidden', !e.target.value);
  renderizarSelectorPeleadores();
});
dom.btnClearSearchFighter.addEventListener('click', () => {
  dom.inputSearchFighter.value = '';
  dom.btnClearSearchFighter.classList.add('hidden');
  renderizarSelectorPeleadores();
});
dom.selectUniverseFighter.addEventListener('change', renderizarSelectorPeleadores);

dom.btnRunBattle.addEventListener('click', ejecutarCalculoCombate);
dom.btnShareDuel.addEventListener('click', copiarEnlaceDuelo);
dom.btnResetBattle.addEventListener('click', reiniciarArenaDuelos);

// Modal Breakdown
dom.btnCloseModal.addEventListener('click', cerrarModalDesglose);
dom.btnModalAccept.addEventListener('click', cerrarModalDesglose);
dom.modalBreakdown.addEventListener('click', (e) => {
  if (e.target === dom.modalBreakdown) cerrarModalDesglose();
});
dom.drawerFighterSelect.addEventListener('click', (e) => {
  if (e.target === dom.drawerFighterSelect) cerrarSelectorPeleador();
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!dom.modalBreakdown.classList.contains('hidden')) cerrarModalDesglose();
    if (!dom.drawerFighterSelect.classList.contains('hidden')) cerrarSelectorPeleador();
    if (!dom.drawerMyStats.classList.contains('hidden')) dom.drawerMyStats.classList.add('hidden');
    if (!dom.globalSearchResults.classList.contains('hidden')) dom.globalSearchResults.classList.add('hidden');
  }
});

// Arranque automático
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarApp);
} else {
  inicializarApp();
}
