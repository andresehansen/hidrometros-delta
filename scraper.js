process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const fs = require('fs');

const ESTACIONES = [
  { nombre: "La Plata", url: "http://hidrografia.agpse.gob.ar:53880/LaPlata/index.html", zona: "Delta / Río de la Plata" }
];

async function fetchURL(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    return await response.text();
  } catch (error) {
    clearTimeout(timeoutId);
    return null;
  }
}

// ── LÓGICA DE CLAUDE PARA LEER LA MAREA (SEPARADA POR ESPACIOS) ──
function parsearLineaMarea(linea) {
  if (!linea || linea.startsWith('#') || linea.startsWith('//') || linea.includes('TimeStamp')) return null;
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

// ── LÓGICA DE CLAUDE PARA LEER EL VIENTO ──
function parsearLineaViento(linea) {
  if (!linea || linea.startsWith('#') || linea.startsWith('//') || linea.includes('TimeStamp')) return null;
  const partes = linea.trim().split(/\s+/);
  if (partes.length < 3) return null;

  const col0 = parseFloat(partes[0]);
  const esContador = Number.isInteger(col0) && col0 > 1000;

  let timestamp, velocidad, direccionGrados;
  if (esContador && partes.length >= 4) {
    timestamp       = partes.length >= 5 ? `${partes[1]} ${partes[2]}` : partes[1];
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
  return { timestamp, velocidad, direccionGrados };
}

function obtenerHoraFormateada() {
    const d = new Date(); d.setHours(d.getHours() - 3);
    let horas = d.getHours(); const ampm = horas >= 12 ? 'PM' : 'AM'; horas = horas % 12; horas = horas ? horas : 12; 
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}, ${horas}:${d.getMinutes().toString().padStart(2, '0')} ${ampm}`;
}

async function procesarLaPlata(est) {
    let estData = { ...est, altura: null, tendencia: "—", fechaHora: null, historialAltura: [], vientoActual: null, vientoDireccion: null, fechaHoraViento: null, historialViento: [], ok: false };

    console.log("🌊 OBTENIENDO ALTURA...");
    let txtMarea = await fetchURL("http://hidrografia.agpse.gob.ar:53880/histdat/LaPlata.dat");
    if (txtMarea) {
        const lineas = txtMarea.trim().split('\n');
        const registros = lineas.map(parsearLineaMarea).filter(Boolean);
        
        if (registros.length > 0) {
            const actual = registros[registros.length - 1];
            estData.altura = actual.altura;
            
            // Extraer solo HH:MM del timestamp
            let horaMatch = actual.timestamp.match(/(\d{1,2}:\d{2})/);
            estData.fechaHora = horaMatch ? horaMatch[1] : actual.timestamp;
            
            // Llenar el historial (las últimas 6 lecturas)
            estData.historialAltura = registros.slice(-6).map(r => {
                let hMatch = r.timestamp.match(/(\d{1,2}:\d{2})/);
                return { hora: hMatch ? hMatch[1] : r.timestamp, valor: r.altura };
            });

            if (registros.length >= 2) {
                const valPrev = registros[registros.length - 2].altura;
                if (estData.altura > valPrev + 0.02) estData.tendencia = "SUBIENDO";
                else if (estData.altura < valPrev - 0.02) estData.tendencia = "BAJANDO";
                else estData.tendencia = "ESTABLE";
            }
            console.log(`   ✅ Altura capturada: ${estData.altura}m a las ${estData.fechaHora}`);
        }
    }

    console.log("💨 OBTENIENDO VIENTO...");
    let txtViento = await fetchURL("http://hidrografia.agpse.gob.ar:53880/LaPlata/_Viento.dat");
    if (txtViento) {
        const lineasV = txtViento.trim().split('\n');
        const registrosV = lineasV.map(parsearLineaViento).filter(Boolean);
        
        if (registrosV.length > 0) {
            const actualV = registrosV[registrosV.length - 1];
            estData.vientoActual = actualV.velocidad;
            estData.vientoDireccion = !isNaN(actualV.direccionGrados) ? actualV.direccionGrados + "°" : "N/D";
            
            let horaMatchV = actualV.timestamp.match(/(\d{1,2}:\d{2})/);
            estData.fechaHoraViento = horaMatchV ? horaMatchV[1] : actualV.timestamp;
            
            estData.historialViento = registrosV.slice(-6).map(r => {
                let hMatch = r.timestamp.match(/(\d{1,2}:\d{2})/);
                return { hora: hMatch ? hMatch[1] : r.timestamp, valor: r.velocidad };
            });
            console.log(`   ✅ Viento capturado: ${estData.vientoActual} km/h a las ${estData.fechaHoraViento}`);
        }
    } else {
        // Fallback: Si el archivo oculto no responde, leemos los inputs ocultos de la web del viento
        let htmlViento = await fetchURL("http://hidrografia.agpse.gob.ar:53880/LaPlata/viento.html");
        if (htmlViento) {
            let matchInputs = htmlViento.match(/value=['"]?([\d.]+)['"]?/gi);
            if (matchInputs && matchInputs.length >= 2) {
                estData.vientoActual = parseFloat(matchInputs[0].replace(/[^\d.]/g, ''));
                estData.vientoDireccion = parseFloat(matchInputs[1].replace(/[^\d.]/g, '')) + "°";
                estData.fechaHoraViento = obtenerHoraFormateada().split(', ')[1]; 
                console.log(`   ✅ Viento capturado desde HTML: ${estData.vientoActual} km/h`);
            }
        }
    }

    if (estData.altura !== null) estData.ok = true;
    return estData;
}

async function main() {
  const resultados = [await procesarLaPlata(ESTACIONES[0])];
  fs.writeFileSync('datos.json', JSON.stringify({ actualizadoEn: obtenerHoraFormateada(), estaciones: resultados }, null, 2));
}

main();
