/**
 * ============================================================
 * SCRAPER AGP – Puerto La Plata (VERSIÓN FINAL COMPATIBLE)
 * ============================================================
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const HISTDAT_MAREA  = 'https://hidrografia.agpse.gob.ar/histdat/LAPLATA.dat';
const HISTDAT_VIENTO = 'https://hidrografia.agpse.gob.ar/histdat/Vientos/La%20Plata_Viento.dat';
const REFERER_URL    = 'https://hidrografia.agpse.gob.ar/LaPlata/marea.html';

const BROWSER_HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept':          'text/plain, */*; q=0.01',
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

function parsearLineaMarea(linea) {
  if (!linea || linea.trim() === '') return null;
  const partes = linea.trim().split(',');
  if (partes.length < 4) return null;
  const timestamp = partes[0].replace(/"/g, '').trim();
  const alturaCruda = parseFloat(partes[3]);
  if (isNaN(alturaCruda)) return null;
  return { timestamp, altura: Math.round(alturaCruda * 100) / 100 };
}

function parsearLineaViento(linea) {
  if (!linea || linea.trim() === '') return null;
  const partes = linea.trim().split(',');
  if (partes.length < 4) return null;
  const velocidad = parseFloat(partes[3]);
  if (isNaN(velocidad)) return null;
  return { velocidad, direccion: 'N/D' }; 
}

async function obtenerDatos() {
  console.log(`[+] Leyendo Marea...`);
  const resMarea = await fetchWithTimeout(HISTDAT_MAREA, { headers: BROWSER_HEADERS });
  if (!resMarea.ok) throw new Error(`Error HTTP ${resMarea.status} en Marea`);
  
  const textoMarea = await resMarea.text();
  const registrosMarea = textoMarea.trim().split('\n').map(parsearLineaMarea).filter(Boolean);
  if (registrosMarea.length === 0) throw new Error('Sin datos válidos.');

  const actualMarea = registrosMarea[registrosMarea.length - 1];
  const historialRaw = registrosMarea.slice(-6);
  
  let tendencia = 'ESTABLE';
  if (registrosMarea.length >= 2) {
    const diff = actualMarea.altura - registrosMarea[registrosMarea.length - 2].altura;
    if (diff > 0.01) tendencia = 'SUBIENDO';
    if (diff < -0.01) tendencia = 'BAJANDO';
  }

  let actualViento = { velocidad: null, direccion: 'N/D' };
  try {
    const resViento = await fetchWithTimeout(HISTDAT_VIENTO, { headers: BROWSER_HEADERS });
    if (resViento.ok) {
      const textoViento = await resViento.text();
      const registrosViento = textoViento.trim().split('\n').map(parsearLineaViento).filter(Boolean);
      if (registrosViento.length > 0) actualViento = registrosViento[registrosViento.length - 1];
    }
  } catch (e) { console.warn("Viento no disponible"); }

  // Adaptamos el historial al formato {hora, valor} que pide tu index.html
  const historialAdaptado = historialRaw.map(r => ({
    hora: r.timestamp.split(' ')[1].substring(0, 5),
    valor: r.altura
  }));

  // Retornamos la estructura "estaciones" que espera tu frontend
  return {
    estaciones: [{
      nombre: "La Plata",
      altura: actualMarea.altura,
      fechaHora: actualMarea.timestamp.split(' ')[1].substring(0, 5),
      tendencia: tendencia,
      vientoActual: actualViento.velocidad,
      vientoDireccion: actualViento.direccion,
      fechaHoraViento: actualMarea.timestamp.split(' ')[1].substring(0, 5),
      historialAltura: historialAdaptado,
      historialViento: []
    }]
  };
}

(async () => {
  try {
    const datos = await obtenerDatos();
    const { writeFile } = await import('fs/promises');
    await writeFile('datos.json', JSON.stringify(datos, null, 2), 'utf8');
    console.log('✅ datos.json actualizado para el frontend.');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
