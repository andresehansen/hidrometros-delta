/**
 * ============================================================
 * SCRAPER AGP – Puerto La Plata (VERSIÓN DEFINITIVA)
 * ============================================================
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// ── URLs EXACTAS CAZADAS EN NETWORK ────────
const HISTDAT_MAREA  = 'https://hidrografia.agpse.gob.ar/histdat/LAPLATA.dat';
const HISTDAT_VIENTO = 'https://hidrografia.agpse.gob.ar/histdat/Vientos/La%20Plata_Viento.dat';
const REFERER_URL    = 'https://hidrografia.agpse.gob.ar/LaPlata/marea.html';

const BROWSER_HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept':          'text/plain, */*; q=0.01',
  'Accept-Language': 'es-AR,es;q=0.9',
  'Referer':         REFERER_URL,
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
 * PARSER EXACTO DE MAREA (Basado en datos crudos CSV)
 * Formato: "Fecha Hora",Contador,ValorCrudo,Altura,Extra
 */
function parsearLineaMarea(linea) {
  if (!linea || linea.trim() === '') return null;

  const partes = linea.trim().split(',');
  if (partes.length < 4) return null;

  const timestamp = partes[0].replace(/"/g, '').trim();
  const alturaCruda = parseFloat(partes[3]);

  if (isNaN(alturaCruda)) return null;

  // Redondeamos a 2 decimales para igualar a la UI de la AGP
  const altura = Math.round(alturaCruda * 100) / 100;

  return { timestamp, altura };
}

// Asumimos formato CSV similar para el viento
function parsearLineaViento(linea) {
  if (!linea || linea.trim() === '') return null;
  
  const partes = linea.trim().split(',');
  if (partes.length < 4) return null;

  const timestamp = partes[0].replace(/"/g, '').trim();
  const velocidad = parseFloat(partes[3]); 
  
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
  const historial = registrosMarea.slice(-6).map(r => ({ timestamp: r.timestamp, altura: r.altura }));
  
  let tendencia = 'estable';
  if (registrosMarea.length >= 2) {
    const penultimo = registrosMarea[registrosMarea.length - 2].altura;
    if (actualMarea.altura > penultimo) tendencia = 'subiendo';
    if (actualMarea.altura < penultimo) tendencia = 'bajando';
  }

  let actualViento = { velocidad: null, direccion: 'N/D' };
  try {
    console.log(`[+] Leyendo Viento desde: ${HISTDAT_VIENTO}`);
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
