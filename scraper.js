/**
 * ============================================================
 * SCRAPER AGP – Puerto La Plata (VERSIÓN DEFINITIVA)
 * ============================================================
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const BASE_URL       = 'https://hidrografia.agpse.gob.ar/LaPlata';
const HISTDAT_MAREA  = `${BASE_URL}/histdat/LAPLATA.dat`;
const HISTDAT_VIENTO = `${BASE_URL}/histdat/La%20Plata_Viento.dat`;

const BROWSER_HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept':          'text/plain, */*; q=0.01',
  'Accept-Language': 'es-AR,es;q=0.9',
  'Referer':         `${BASE_URL}/marea.html`,
};

async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * PARSER EXACTO DE MAREA (Basado en datos crudos vs web)
 * Formato: "Fecha Hora",Contador,ValorCrudo,Altura,Extra
 * Ejemplo: "2026-04-09 11:00:00",13395,-1.550567,1.839,3.39
 */
function parsearLineaMarea(linea) {
  if (!linea || linea.trim() === '') return null;

  // Separamos por COMA, no por espacio
  const partes = linea.trim().split(',');
  
  // Necesitamos al menos 4 columnas para llegar a la altura
  if (partes.length < 4) return null;

  // Col 0: Timestamp. Le sacamos las comillas extra.
  const timestamp = partes[0].replace(/"/g, '').trim();
  
  // Col 3: Altura cruda (ej. 1.839)
  const alturaCruda = parseFloat(partes[3]);

  if (isNaN(alturaCruda)) return null;

  // Redondeamos a 2 decimales para igualar a la UI de la AGP (ej. 1.839 -> 1.84)
  const altura = Math.round(alturaCruda * 100) / 100;

  return { timestamp, altura };
}

// Para el viento no tenemos el crudo aún, asumimos separador por coma por consistencia del servidor
function parsearLineaViento(linea) {
  if (!linea || linea.trim() === '') return null;
  const partes = linea.trim().split(',');
  
  if (partes.length < 4) return null;

  const timestamp = partes[0].replace(/"/g, '').trim();
  const velocidad = parseFloat(partes[3]); // Asumimos misma estructura que marea
  
  if (isNaN(velocidad)) return null;

  return { timestamp, velocidad, direccion: 'N/D' }; 
}

async function obtenerDatos() {
  console.log(`[+] Leyendo Marea desde: ${HISTDAT_MAREA}`);
  const resMarea = await fetchWithTimeout(HISTDAT_MAREA, { headers: BROWSER_HEADERS });
  if (!resMarea.ok) throw new Error(`Error HTTP ${resMarea.status} en Marea`);
  
  const textoMarea = await resMarea.text();
  const lineasMarea = textoMarea.trim().split('\n');
  const registrosMarea = lineasMarea.map(parsearLineaMarea).filter(Boolean);
  
  if (registrosMarea.length === 0) throw new Error('El archivo se leyó pero no se encontraron datos válidos.');

  const actualMarea = registrosMarea[registrosMarea.length - 1];
  
  // Guardamos las últimas 6 lecturas (aprox 1 hora si actualiza cada 10 min)
  const historial = registrosMarea.slice(-6).map(r => ({ timestamp: r.timestamp, altura: r.altura }));
  
  let tendencia = 'estable';
  if (registrosMarea.length >= 2) {
    const penultimo = registrosMarea[registrosMarea.length - 2].altura;
    if (actualMarea.altura > penultimo) tendencia = 'subiendo';
    if (actualMarea.altura < penultimo) tendencia = 'bajando';
  }

  // Lectura de viento (con try/catch para que no rompa la marea si falla)
  let actualViento = { velocidad: null, direccion: 'N/D' };
  try {
    const resViento = await fetchWithTimeout(HISTDAT_VIENTO, { headers: BROWSER_HEADERS });
    if (resViento.ok) {
      const textoViento = await resViento.text();
      const registrosViento = textoViento.trim().split('\n').map(parsearLineaViento).filter(Boolean);
      if (registrosViento.length > 0) {
        actualViento = registrosViento[registrosViento.length - 1];
      }
    }
  } catch (err) {
    console.warn(`[!] Advertencia: No se pudo parsear el viento, pero la marea sigue intacta.`);
  }

  return {
    puerto:          'La Plata',
    actualizadoEn:   new Date().toISOString(),
    alturaActual:    actualMarea.altura,
    alturaUnidad:    'metros',
    horaMedicion:    actualMarea.timestamp,
    tendencia:       tendencia,
    viento: {
      velocidad:    actualViento.velocidad,
      velocidadUnidad: 'km/h',
      direccion:    actualViento.direccion
    },
    historial:       historial
  };
}

(async () => {
  try {
    console.log('Iniciando extracción AGP...');
    const datos = await obtenerDatos();
    
    const { writeFile } = await import('fs/promises');
    await writeFile('datos.json', JSON.stringify(datos, null, 2), 'utf8');
    
    console.log('\n✅ ÉXITO. datos.json generado correctamente:');
    console.log(JSON.stringify(datos, null, 2));
  } catch (err) {
    console.error('\n❌ ERROR FATAL:', err.message);
    process.exit(1);
  }
})();
