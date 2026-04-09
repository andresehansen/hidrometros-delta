/**
 * ============================================================
 * SCRAPER AGP – Puerto La Plata (Fusión Gemini + Claude)
 * ============================================================
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// ── Configuración con los secretos que descubrimos ──────────
const PUERTO     = 'LaPlata';
// Usamos el puerto 53880 y http porque sabemos que elude bloqueos SSL
const BASE_URL   = `http://hidrografia.agpse.gob.ar:53880/${PUERTO}`; 
const HISTDAT_MAREA  = `${BASE_URL}/histdat/${PUERTO}.dat`;
// ¡AQUÍ ESTÁ EL SECRETO DEL VIENTO QUE CLAUDE NO SABÍA!
const HISTDAT_VIENTO = `${BASE_URL}/_Viento.dat`; 

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/plain, */*; q=0.01',
  'Referer': `${BASE_URL}/marea.html`
};

// ── Utilidades ───────────────────────────────────────────────

async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
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

function gradosACardinal(grados) {
  if (grados == null || isNaN(grados)) return 'N/D';
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSO','SO','OSO','O','ONO','NO','NNO'];
  return dirs[Math.round(grados / 22.5) % 16];
}

// ── Lógica Brillante de Claude para leer las columnas ───────
function parsearLineaMarea(linea) {
  if (!linea || linea.startsWith('#') || linea.startsWith('//')) return null;
  const partes = linea.trim().split(/\s+/);
  if (partes.length < 3) return null;

  const col0 = parseFloat(partes[0]);
  const esContador = Number.isInteger(col0) && col0 > 1000;

  let timestamp, altura;
  if (esContador) {
    if (partes.length >= 4) {
      timestamp = `${partes[1]} ${partes[2]}`;
      altura    = parseFloat(partes[3]);
    } else {
      timestamp = partes[1];
      altura    = parseFloat(partes[2]);
    }
  } else {
    timestamp = partes[0];
    altura    = parseFloat(partes[1]);
  }

  if (isNaN(altura) || Math.abs(altura) > 20) return null;
  return { timestamp, altura };
}

function parsearLineaViento(linea) {
  if (!linea || linea.startsWith('#') || linea.startsWith('//')) return null;
  const partes = linea.trim().split(/\s+/);
  if (partes.length < 3) return null;

  const col0 = parseFloat(partes[0]);
  const esContador = Number.isInteger(col0) && col0 > 1000;

  let timestamp, velocidad, direccionGrados;

  if (esContador && partes.length >= 4) {
    timestamp       = partes.length >= 5 ? `${partes[1]} ${partes[2].substring(0,5)}` : partes[1];
    const offset    = partes.length >= 5 ? 1 : 0;
    velocidad       = parseFloat(partes[2 + offset]);
    direccionGrados = parseFloat(partes[3 + offset]);
  } else if (!esContador) {
    timestamp       = partes[0];
    velocidad       = parseFloat(partes[1]);
    direccionGrados = parseFloat(partes[2]);
  } else {
    return null;
  }

  if (isNaN(velocidad)) return null;

  return {
    timestamp,
    velocidad,
    direccion: isNaN(direccionGrados) ? 'N/D' : gradosACardinal(direccionGrados),
    direccionGrados: isNaN(direccionGrados) ? null : direccionGrados,
  };
}

// ── Estrategias ─────────────────────────────────────────────

async function estrategiaA_DatMarea() {
  console.log(`[A] Intentando: ${HISTDAT_MAREA}`);
  const res = await fetchWithTimeout(HISTDAT_MAREA, { headers: BROWSER_HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const texto = await res.text();
  const lineas = texto.trim().split('\n').filter(l => l.trim());
  const registros = lineas.map(parsearLineaMarea).filter(Boolean);
  if (registros.length === 0) throw new Error('Sin registros');

  const actual = registros[registros.length - 1];
  const historial = registros.slice(-10).map(r => ({ timestamp: r.timestamp, altura: r.altura })); // Tomar más historial para el gráfico

  let tendencia = 'ESTABLE';
  if (registros.length >= 2) {
    const diff = actual.altura - registros[registros.length - 2].altura;
    if (diff > 0.02) tendencia = 'SUBIENDO';
    if (diff < -0.02) tendencia = 'BAJANDO';
  }

  // Cortar la hora a formato HH:MM
  let horaCorta = actual.timestamp.match(/(\d{1,2}:\d{2})/);

  return { alturaActual: actual.altura, horaMedicion: horaCorta ? horaCorta[1] : actual.timestamp, tendencia, historial };
}

async function estrategiaB_DatViento() {
  console.log(`[B] Intentando: ${HISTDAT_VIENTO}`);
  const res = await fetchWithTimeout(HISTDAT_VIENTO, { headers: BROWSER_HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const texto = await res.text();
  const lineas  = texto.trim().split('\n').filter(l => l.trim());
  const registros = lineas.map(parsearLineaViento).filter(Boolean);
  if (registros.length === 0) throw new Error('Sin registros');

  const actual = registros[registros.length - 1];
  const historial = registros.slice(-10).map(r => ({ timestamp: r.timestamp, valor: r.velocidad })); // Historial para gráfico
  
  let horaCorta = actual.timestamp.match(/(\d{1,2}:\d{2})/);

  return { velocidad: actual.velocidad, direccion: actual.direccion, horaMedicion: horaCorta ? horaCorta[1] : actual.timestamp, historialViento: historial };
}

function obtenerHoraFormateada() {
    const d = new Date(); d.setHours(d.getHours() - 3);
    let horas = d.getHours(); const ampm = horas >= 12 ? 'PM' : 'AM'; horas = horas % 12; horas = horas ? horas : 12; 
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}, ${horas}:${d.getMinutes().toString().padStart(2, '0')} ${ampm}`;
}

// ── Orquestador ──────────────────────────────────────────────

async function obtenerDatosLaPlata() {
  let estData = { 
      nombre: "La Plata", 
      altura: null, 
      tendencia: "—", 
      fechaHora: null, 
      historialAltura: [], 
      vientoActual: null, 
      vientoDireccion: null, 
      fechaHoraViento: null, 
      historialViento: [], 
      ok: false 
  };

  try {
    let marea = await estrategiaA_DatMarea();
    estData.altura = marea.alturaActual;
    estData.fechaHora = marea.horaMedicion;
    estData.tendencia = marea.tendencia;
    estData.historialAltura = marea.historial.map(h => ({ hora: h.timestamp.match(/(\d{1,2}:\d{2})/) ? h.timestamp.match(/(\d{1,2}:\d{2})/)[1] : h.timestamp, valor: h.altura }));
    console.log(`✅ Marea OK: ${estData.altura}m a las ${estData.fechaHora}`);
  } catch(e) { console.log(`❌ Marea Error: ${e.message}`); }

  try {
    let viento = await estrategiaB_DatViento();
    estData.vientoActual = viento.velocidad;
    estData.vientoDireccion = viento.direccion;
    estData.fechaHoraViento = viento.horaMedicion;
    estData.historialViento = viento.historialViento.map(h => ({ hora: h.timestamp.match(/(\d{1,2}:\d{2})/) ? h.timestamp.match(/(\d{1,2}:\d{2})/)[1] : h.timestamp, valor: h.valor }));
    console.log(`✅ Viento OK: ${estData.vientoActual}km/h a las ${estData.fechaHoraViento}`);
  } catch(e) { console.log(`❌ Viento Error: ${e.message}`); }

  if (estData.altura !== null) estData.ok = true;
  return estData;
}

(async () => {
  const fs = require('fs');
  const resultados = [await obtenerDatosLaPlata()];
  
  // Guardamos con la estructura que lee el frontend
  fs.writeFileSync('datos.json', JSON.stringify({ actualizadoEn: obtenerHoraFormateada(), estaciones: resultados }, null, 2));
  console.log('\n✅ datos.json actualizado. (Fusión Gemini+Claude exitosa)');
})();
