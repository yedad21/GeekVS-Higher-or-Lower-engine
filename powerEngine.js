/**
 * Modulo del motor de calculo de niveles de poder transitivos (ES6)
 * Juego estilo 'Higher or Lower' de GeekVS
 */

// 1. Constantes de configuracion
export const FACTOR_ALPHA = 0.5;

/**
 * 2. Algoritmo transitivo de poder:
 * Calcula de forma recursiva el score total de un personaje considerando su poder base
 * y una fraccion (ALPHA = 0.5) del score de todos los enemigos a los que derroto.
 *
 * @param {string} personajeId - ID unico del personaje a evaluar.
 * @param {Array<Object>|Map<string, Object>} catalogo - Coleccion de personajes disponibles.
 * @param {Set<string>} [visitados=new Set()] - Registro de IDs visitados en la rama actual para evitar bucles.
 * @returns {number} Score continuo (sin redondear) del personaje.
 */
export function calcularScore(personajeId, catalogo, visitados = new Set()) {
  // Evitar bucles infinitos en referencias circulares
  if (visitados.has(personajeId)) {
    return 0;
  }

  // Soporta catalogo como Array o Map para busquedas O(1)
  const personaje = Array.isArray(catalogo)
    ? catalogo.find((p) => p.id === personajeId)
    : catalogo.get(personajeId);

  // Si el personaje no existe en el catalogo
  if (!personaje) {
    return 0;
  }

  // Clonar el Set de visitados para aislar la rama de evaluacion actual
  const nuevosVisitados = new Set(visitados);
  nuevosVisitados.add(personajeId);

  // Score Base = bajas directas + bono de hazana
  const scoreBase = (Number(personaje.bajas_directas) || 0) + (Number(personaje.bono_hazana) || 0);

  // Sumatoria recursiva del score de los derrotados multiplicada por FACTOR_ALPHA
  const scoreDerrotados = (personaje.derrotados || []).reduce((acumulador, derrotadoId) => {
    const scoreEnemigo = calcularScore(derrotadoId, catalogo, nuevosVisitados);
    return acumulador + (scoreEnemigo * FACTOR_ALPHA);
  }, 0);

  return scoreBase + scoreDerrotados;
}

/**
 * 3. Procesamiento inicial:
 * Itera el catalogo y retorna una nueva coleccion inmutable con la propiedad 'scoreFinal' redondeada.
 *
 * @param {Array<Object>} catalogo - Lista cruda de personajes.
 * @returns {Array<Object>} Lista de personajes enriquecida con 'scoreFinal'.
 */
export function procesarCatalogo(catalogo) {
  // Mapa de busqueda indexado para optimizar el rendimiento O(1) en las llamadas recursivas
  const mapaCatalogo = new Map(catalogo.map((p) => [p.id, p]));

  return catalogo.map((personaje) => {
    const scoreContinuo = calcularScore(personaje.id, mapaCatalogo);
    return {
      ...personaje,
      scoreFinal: Math.round(scoreContinuo)
    };
  });
}

/**
 * 4. Carga asincrona:
 * Obtiene el archivo characters.json mediante fetch y lo procesa con el motor de calculo.
 *
 * @param {string} [ruta='./characters.json'] - Ruta relativa o URL del archivo JSON.
 * @returns {Promise<Array<Object>>} Promesa que resuelve en la lista enriquecida con 'scoreFinal'.
 */
export async function cargarCatalogo(ruta = './characters.json') {
  try {
    const respuesta = await fetch(ruta);
    if (!respuesta.ok) {
      throw new Error(`Error HTTP ${respuesta.status} al cargar el catalogo desde '${ruta}'`);
    }
    const datosCrudos = await respuesta.json();
    return procesarCatalogo(datosCrudos);
  } catch (error) {
    console.error('[GeekVS] Fallo al cargar catalogo de personajes:', error);
    throw error;
  }
}
