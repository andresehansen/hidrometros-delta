process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const fs = require('fs');

// MODO LABORATORIO: Solo La Plata
const ESTACIONES = [
  { nombre: "La Plata", url: "http://hidrografia.agpse.gob.ar:53880/LaPlata/index.html", zona: "Delta / Río de la Plata" }
];

// Timeout de 5 segundos (si AGP no responde, nos vamos rápido)
async function fetchURL(url, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs); 
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0" },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    return await response.text();
  } catch (error) {
    clearTimeout(timeoutId);
    return null;
  }
}

function procesarCSV(csvText, tipo) {
    let lineas = csvText.trim().split('\n');
    if (lineas.length < 4) return null;
    
    let cabeceras = lineas[1].toLowerCase().replace(/['"]/g, '').split(',').map(s => s.trim());
    let unidades = lineas[2].toLowerCase().replace(/['"]/g, '').split(',').map(s => s.trim());
    let idxValor = -1, idxDir = -1;

    if (tipo === 'altura') {
        for (let j = 0; j < cabeceras.length; j++) {
            if (cabeceras[j].includes("nivel") || cabeceras[j].includes("altura") || cabeceras[j].includes("marea") || cabeceras[j].includes("cota") || cabeceras[j].includes("rio")) { idxValor = j; break; }
        }
        if (idxValor === -1) {
            for (let j = 0; j < unidades.length; j++) {
                if (unidades[j] === "m" || unidades[j] === "metros") { idxValor = j; break; }
            }
        }
    } else if (tipo === 'viento') {
        for (let j = 0; j < cabeceras.length; j++) {
            if (cabeceras[j].includes("velocidad") || cabeceras[j].includes("viento")) idxValor = j;
            if (cabeceras[j].includes("direc") || cabeceras[j].includes("dir")) idxDir = j;
        }
    }

    if (idxValor === -1) return null;

    let historial = []; let valorActual = null; let dirActual = null; let horaActual = null;
    for (let i = lineas.length - 1; i > 2 && historial.length < 5; i--) {
        let col = lineas[i].split(',');
        if (col.length > idxValor && !col[idxValor].includes("NAN")) {
            let val = parseFloat(col[idxValor]);
            let valido = tipo === 'altura' ? (val > -3 && val < 12) : (val >= 0 && val < 250);
            
            if (!isNaN(val) && valido) {
                let fechaRaw = col[0].replace(/['"]/g, '');
                let horaMatch = fechaRaw.match(/(\d{1,2}:\d{2})/);
                let hora = horaMatch ? horaMatch[1] : fechaRaw;

                if (valorActual === null) {
                    valorActual = val;
                    horaActual = hora;
                    if (idxDir !== -1 && col.length > idxDir) {
                        let dval = parseFloat(col[idxDir]);
                        dirActual = !isNaN(dval) ? dval : col[idxDir].replace(/['"]/g, '').trim();
                    }
                } else {
                    historial.push({ hora: hora, valor: val });
                }
            }
        }
    }
    return { valorActual, dirActual, historial, horaActual };
}

// EL NUEVO LECTOR DE TEXTO (A prueba de Grados y anti-0.91)
function parsearHTML(html) {
    let altura = null; let tendencia = "ESTABLE"; let fechaHora = null;
    let vientoActual = null; let vientoDireccion = null; let fechaHoraViento = null;
    
    const textoPuro = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    
    // 1. Atrapar la HORA que aparece en la pantalla
    let matchHora = textoPuro.match(/(\d{1,2}:\d{2}:\d{2}|\d{1,2}:\d{2})/);
    if (matchHora) {
        fechaHora = matchHora[1].substring(0,5); // Solo guarda HH:MM
        fechaHoraViento = fechaHora;
    }

    // 2. Atrapar ALTURA (Con escudo para ignorar el 0.91 del texto del pie de página)
    const todosLosNumeros = [...textoPuro.matchAll(/([-]?\d{1,2}[.,]\d{2})/g)];
    for (let n of todosLosNumeros) {
        let index = n.index;
        let contextoPrevio = textoPuro.substring(Math.max(0, index - 50), index).toLowerCase();
        let contextoPosterior = textoPuro.substring(index, index + 30).toLowerCase();
        
        if (contextoPrevio.includes("debajo") || contextoPrevio.includes("reducci") || contextoPosterior.includes("nivel medio") || contextoPrevio.includes("cero") || contextoPrevio.includes("bater")) {
            continue; 
        }
            
        let val = parseFloat(n[1].replace(',', '.'));
        if (val > -3 && val < 12) {
            if (contextoPrevio.includes("nivel") || contextoPrevio.includes("altura") || contextoPosterior.includes("m") || contextoPrevio.includes("reportado")) {
                altura = val; break;
            } else if (altura === null) { altura = val; }
        }
    }
    if (/subi[eo]ndo|↑|▲/i.test(textoPuro)) tendencia = "SUBIENDO";
    if (/bajando|descend|↓|▼/i.test(textoPuro)) tendencia = "BAJANDO";

    // 3. Atrapar VIENTO (Velocidad y Grados)
    let matchViento = textoPuro.match(/Velocidad\s*([\d]+[.,]?[\d]*)/i) || textoPuro.match(/([\d]+[.,]?[\d]*)\s*(km\/h|kmh|nudos|km)/i);
    if (matchViento) {
        vientoActual = parseFloat(matchViento[1].replace(',', '.'));
    }
    
    let matchDirGrados = textoPuro.match(/Direccion\s*([\d]+[.,]?[\d]*)\s*Grados/i);
    if (matchDirGrados) {
        vientoDireccion = matchDirGrados[1];
    } else {
        let matchDir = textoPuro.match(/\b(N|S|E|W|O|NE|NW|NO|SE|SW|SO|NNE|NNO|ENE|ESE|SSE|SSO|OSO|WSW|WNW|ONO|NNW)\b/i);
        if (matchDir) vientoDireccion = matchDir[1].toUpperCase().replace('O', 'W');
    }

    return { altura, tendencia, fechaHora, vientoActual, vientoDireccion, fechaHoraViento };
}

function obtenerHoraFormateada() {
    const d = new Date(); d.setHours(d.getHours() - 3);
    let horas = d.getHours(); const ampm = horas >= 12 ? 'PM' : 'AM'; horas = horas % 12; horas = horas ? horas : 12; 
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}, ${horas}:${d.getMinutes().toString().padStart(2, '0')} ${ampm}`;
}

async function procesarLaPlata(est) {
    let estData = { ...est, altura: null, tendencia: "—", fechaHora: null, historialAltura: [], vientoActual: null, vientoDireccion: null, fechaHoraViento: null, historialViento: [], ok: false };

    try {
        let htmlPrincipal = await fetchURL(est.url);
        if (!htmlPrincipal) return estData;

        let paginasParaEscanear = [{ url: est.url, html: htmlPrincipal }];

        let metaMatch = htmlPrincipal.match(/<meta[^>]*url=([^"'>\s]+)/i);
        if (metaMatch) {
            let redirUrl = new URL(metaMatch[1], est.url).href;
            let redirHtml = await fetchURL(redirUrl);
            if (redirHtml) paginasParaEscanear.push({ url: redirUrl, html: redirHtml });
        }

        for (let pagina of [...paginasParaEscanear]) {
            let iframes = [...pagina.html.matchAll(/<iframe[^>]+src=['"]([^'"]+)['"]/gi)].map(m => m[1]);
            for (let src of iframes) {
                let iframeUrl = new URL(src, pagina.url).href;
                let iframeHtml = await fetchURL(iframeUrl);
                if (iframeHtml) paginasParaEscanear.push({ url: iframeUrl, html: iframeHtml });
            }
        }

        // 1. Buscamos archivos .dat para el historial y los gráficos
        let archivosDat = new Set();
        for (let pagina of paginasParaEscanear) {
            let dats = [...pagina.html.matchAll(/['"]([^'"]+\.dat)['"]/gi)].map(m => m[1]);
            for (let d of dats) archivosDat.add(new URL(d, pagina.url).href);
        }

        for (let datUrl of archivosDat) {
            let csv = await fetchURL(datUrl);
            if (csv && csv.includes(',')) {
                let resAltura = procesarCSV(csv, 'altura');
                if (resAltura && resAltura.valorActual !== null && estData.altura === null) {
                    estData.altura = resAltura.valorActual;
                    estData.fechaHora = resAltura.horaActual;
                    estData.historialAltura = resAltura.historial;
                    if (resAltura.historial.length > 0) {
                        let valPrev = resAltura.historial[0].valor;
                        if (estData.altura > valPrev + 0.02) estData.tendencia = "SUBIENDO";
                        else if (estData.altura < valPrev - 0.02) estData.tendencia = "BAJANDO";
                        else estData.tendencia = "ESTABLE";
                    }
                }
                let resViento = procesarCSV(csv, 'viento');
                if (resViento && resViento.valorActual !== null && estData.vientoActual === null) {
                    estData.vientoActual = resViento.valorActual;
                    estData.vientoDireccion = resViento.dirActual;
                    estData.fechaHoraViento = resViento.horaActual;
                    estData.historialViento = resViento.historial;
                }
            }
        }

        // 2. Extraemos el texto de las pantallas para el viento y la hora (y tapar huecos)
        for (let pagina of paginasParaEscanear) {
            let resTexto = parsearHTML(pagina.html);
            
            if (estData.altura === null && resTexto.altura !== null) {
                estData.altura = resTexto.altura;
                estData.tendencia = resTexto.tendencia;
                estData.fechaHora = resTexto.fechaHora;
            }
            
            if (estData.vientoActual === null && resTexto.vientoActual !== null) {
                estData.vientoActual = resTexto.vientoActual;
                estData.fechaHoraViento = resTexto.fechaHoraViento;
                if (resTexto.vientoDireccion) estData.vientoDireccion = resTexto.vientoDireccion;
            }
        }

    } catch(e) {}

    if (estData.altura !== null) estData.ok = true;
    return estData;
}

async function main() {
  const resultados = [await procesarLaPlata(ESTACIONES[0])];
  fs.writeFileSync('datos.json', JSON.stringify({ actualizadoEn: obtenerHoraFormateada(), estaciones: resultados }, null, 2));
}

main();
