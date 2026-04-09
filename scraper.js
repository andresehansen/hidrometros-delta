/**
 * ============================================================
 * SCRAPER AGP – Puerto La Plata (VERSIÓN 1.1 - GRÁFICO Y VIENTO)
 * ============================================================
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const HISTDAT_MAREA  = 'https://hidrografia.agpse.gob.ar/histdat/LAPLATA.dat';
const HISTDAT_VIENTO = 'https://hidrografia.agpse.gob.ar/histdat/Vientos/La%20Plata_Viento.dat';
const REFERER_URL    = 'https://hidrografia.agpse.gob.ar/LaPlata/marea.html';

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'text/plain, */*; q=0.01',
  'Referer': REFERER_URL,
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

function parsearLineaCSV(linea) {
  if (!linea || linea.trim() === '') return null;
  const partes = linea.trim().split(',');
  if (partes.length < 4) return null;
  
  const timestamp = partes[0].replace(/"/g, '').trim();
  const valor = parseFloat(partes[3]);
  
  if (isNaN(valor)) return null;
  return { timestamp, valor };
}

async function obtenerDatos() {
  console.log(`[+] Leyendo Marea...`);
  const resMarea = await fetchWithTimeout(HISTDAT_MAREA, { headers: BROWSER_HEADERS });
  const textoMarea = await resMarea.text();
  const registrosMarea = textoMarea.trim().split('\n').map(parsearLineaCSV).filter(Boolean);
  
  const actualMarea = registrosMarea[registrosMarea.length - 1];
  
  // No los invertimos aquí, porque el index.html ya hace un .reverse()
  const historialMarea = registrosMarea.slice(-10).map(r => ({
    hora: r.timestamp.split(' ')[1].substring(0, 5),
    valor: Math.round(r.valor * 100) / 100
  }));

  let tendencia = 'ESTABLE';
  if (registrosMarea.length >= 2) {
    const diff = actualMarea.valor - registrosMarea[registrosMarea.length - 2].valor;
    if (diff > 0.005) tendencia = 'SUBIENDO';
    if (diff < -0.005) tendencia = 'BAJANDO';
  }

  let actualViento = { velocidad: null, hora: "" };
  try {
    console.log(`[+] Leyendo Viento...`);
    const resViento = await fetchWithTimeout(HISTDAT_VIENTO, { headers: BROWSER_HEADERS });
    const textoViento = await resViento.text();
    const registrosViento = textoViento.trim().split('\n').map(parsearLineaCSV).filter(Boolean);
    if (registrosViento.length > 0) {
      const v = registrosViento[registrosViento.length - 1];
      actualViento = { 
        velocidad: v.valor, 
        hora: v.timestamp.split(' ')[1].substring(0, 5) 
      };
    }
  } catch (e) { console.warn("Viento no disponible"); }

  return {
    estaciones: [{
      nombre: "La Plata",
      altura: Math.round(actualMarea.valor * 100) / 100,
      fechaHora: actualMarea.timestamp.split(' ')[1].substring(0, 5),
      tendencia: tendencia,
      vientoActual: actualViento.velocidad,
      vientoDireccion: "S/D",
      fechaHoraViento: actualViento.hora,
      historialAltura: historialMarea,
      historialViento: []
    }]
  };
}

(async () => {
  try {
    const datos = await obtenerDatos();
    const { writeFile } = await import('fs/promises');
    await writeFile('datos.json', JSON.stringify(datos, null, 2), 'utf8');
    console.log('✅ datos.json actualizado.');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
