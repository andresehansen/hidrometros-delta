const fs = require('fs');

const ESTACIONES = [
  { nombre: "Zárate", url: "http://hidrografia.agpse.gob.ar:53880/zarate/index.html", zona: "Delta / Río de la Plata" },
  { nombre: "Las Rosas", url: "http://hidrografia.agpse.gob.ar:53880/LasRosas/index.html", zona: "Delta / Río de la Plata" },
  { nombre: "Escobar", url: "http://hidrografia.agpse.gob.ar:53880/escobar/index.html", zona: "Delta / Río de la Plata" },
  { nombre: "Braga", url: "http://hidrografia.agpse.gob.ar:53880/Braga/index.html", zona: "Delta / Río de la Plata" },
  { nombre: "Baliza Mitre", url: "http://hidrografia.agpse.gob.ar:53880/BalizaMitre/index.html", zona: "Delta / Río de la Plata" },
  { nombre: "Baradero", url: "http://hidrografia.agpse.gob.ar:53880/Baradero/index.html", zona: "Delta / Río de la Plata" },
  { nombre: "Ibicuy", url: "http://hidrografia2.agpse.gob.ar/Ibicuy/index.html", zona: "Delta / Río de la Plata" },
  { nombre: "Brazo Largo", url: "http://hidrografia.agpse.gob.ar:53880/BrazoLargo/index.html", zona: "Delta / Río de la Plata" },
  { nombre: "Desembocadura", url: "http://hidrografia.agpse.gob.ar:53880/Desembocadura/index.html", zona: "Delta / Río de la Plata" },
  { nombre: "Bs. As. 1° Espigón", url: "http://hidrografia2.agpse.gob.ar/buenosaires1erespigon/index.html", zona: "Delta / Río de la Plata" },
  { nombre: "Bs. As. Puerto Sur", url: "http://hidrografia.agpse.gob.ar:53880/buenosaires/index.html", zona: "Delta / Río de la Plata" },
  { nombre: "La Plata", url: "http://hidrografia.agpse.gob.ar:53880/LaPlata/index.html", zona: "Delta / Río de la Plata" },
  { nombre: "Magdalena", url: "http://hidrografia2.agpse.gob.ar/Magdalena2/index.html", zona: "Delta / Río de la Plata" },
  { nombre: "Oyarvide", url: "http://hidrografia.agpse.gob.ar:53880/oyarvide/index.html", zona: "Delta / Río de la Plata" },
  { nombre: "San Clemente", url: "http://hidrografia.agpse.gob.ar:53880/SanClemente/index.html", zona: "Delta / Río de la Plata" },
  { nombre: "San Pedro", url: "http://hidrografia.agpse.gob.ar:53880/SanPedro/index.html", zona: "Confluencia – Océano" },
  { nombre: "Bifurcación", url: "http://hidrografia.agpse.gob.ar:53880/ehmail/bifurcacion2.htm", zona: "Confluencia – Océano" },
  { nombre: "Vuelta de Obligado", url: "http://hidrografia.agpse.gob.ar:53880/vueltaobligado/index.html", zona: "Confluencia – Océano" },
  { nombre: "Ramallo", url: "http://hidrografia2.agpse.gob.ar/Ramallo/index.html", zona: "Confluencia – Océano" },
  { nombre: "San Nicolás", url: "http://hidrografia2.agpse.gob.ar/SanNicolas/index.html", zona: "Confluencia – Océano" },
  { nombre: "Villa Constitución", url: "http://hidrografia2.agpse.gob.ar/VillaConstitucion/index.html", zona: "Confluencia – Océano" },
  { nombre: "Arroyo Seco", url: "http://hidrografia.agpse.gob.ar:53880/arroyoseco/index.html", zona: "Confluencia – Océano" },
  { nombre: "Rosario", url: "http://hidrografia2.agpse.gob.ar/Rosario/index.html", zona: "Confluencia – Océano" },
  { nombre: "San Lorenzo", url: "http://hidrografia2.agpse.gob.ar/SanLorenzo/index.html", zona: "Confluencia – Océano" },
  { nombre: "Timbúes", url: "http://hidrografia.agpse.gob.ar:53880/Timbues/index.html", zona: "Confluencia – Océano" },
  { nombre: "Diamante", url: "http://hidrografia.agpse.gob.ar:53880/Diamante/index.html", zona: "Confluencia – Océano" },
  { nombre: "Paraná", url: "http://hidrografia2.agpse.gob.ar/Parana/index.html", zona: "Confluencia – Océano" },
  { nombre: "Santa Fe", url: "http://hidrografia.agpse.gob.ar:53880/SantaFe/index.html", zona: "Confluencia – Océano" },
  { nombre: "Hernandarias", url: "http://hidrografia2.agpse.gob.ar/Hernandarias/index.html", zona: "Confluencia – Océano" },
  { nombre: "Santa Elena", url: "http://hidrografia.agpse.gob.ar:53880/SantaElena/index.html", zona: "Confluencia – Océano" },
  { nombre: "La Paz", url: "http://hidrografia2.agpse.gob.ar/LaPaz/index.html", zona: "Confluencia – Océano" },
  { nombre: "Esquina", url: "http://hidrografia.agpse.gob.ar:53880/Esquina/index.html", zona: "Confluencia – Océano" },
  { nombre: "Reconquista", url: "http://hidrografia2.agpse.gob.ar/Reconquista/index.html", zona: "Confluencia – Océano" },
  { nombre: "Goya", url: "http://hidrografia2.agpse.gob.ar/Goya/index.html", zona: "Confluencia – Océano" },
  { nombre: "Lavalle", url: "http://hidrografia2.agpse.gob.ar/lavalle/index.html", zona: "Confluencia – Océano" },
  { nombre: "Bella Vista", url: "http://hidrografia2.agpse.gob.ar/BellaVista/index.html", zona: "Confluencia – Océano" },
  { nombre: "Empedrado", url: "http://hidrografia2.agpse.gob.ar/Empedrado/index.html", zona: "Confluencia – Océano" },
  { nombre: "Barranqueras", url: "http://hidrografia2.agpse.gob.ar/Barranqueras/index.html", zona: "Confluencia – Océano" },
  { nombre: "Corrientes", url: "http://hidrografia2.agpse.gob.ar/Corrientes/index.html", zona: "Confluencia – Océano" },
  { nombre: "Paso de la Patria", url: "http://hidrografia2.agpse.gob.ar/PasodelaPatria/index.html", zona: "Confluencia – Océano" },
  { nombre: "Carabelitas", url: "http://hidrografia.agpse.gob.ar:53880/ehmail/Carabelitas2.htm", zona: "Brazo Bravo – Guazú" }
];

async function fetchURL(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36" },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

function procesarCSV(csvText, tipo) {
    let lineas = csvText.trim().split('\n');
    if (lineas.length < 4) return null;
    
    let cabeceras = (lineas[0] + "," + lineas[1]).toLowerCase().replace(/['"]/g, '').split(',');
    let idxValor = -1;
    let idxDir = -1;

    if (tipo === 'altura') {
        for (let j = 0; j < cabeceras.length; j++) {
            if (cabeceras[j].includes("nivel") || cabeceras[j].includes("altura") || cabeceras[j].includes("marea") || cabeceras[j].includes("cota")) {
                idxValor = j % lineas[1].split(',').length; break;
            }
        }
        if (idxValor === -1) idxValor = 3; 
    } else if (tipo === 'viento') {
        for (let j = 0; j < cabeceras.length; j++) {
            if (cabeceras[j].includes("velocidad") || cabeceras[j].includes("viento") || cabeceras[j].includes("speed")) {
                idxValor = j % lineas[1].split(',').length;
            }
            if (cabeceras[j].includes("direc") || cabeceras[j].includes("dir")) {
                idxDir = j % lineas[1].split(',').length;
            }
        }
        if (idxValor === -1) idxValor = 3;
    }

    let historial = [];
    let valorActual = null;
    let dirActual = null;

    for (let i = lineas.length - 1; i > 2 && historial.length < 5; i--) {
        let col = lineas[i].split(',');
        if (col.length > idxValor && !col[idxValor].includes("NAN")) {
            let val = parseFloat(col[idxValor]);
            let valido = tipo === 'altura' ? (val > -3 && val < 12) : (val >= 0 && val < 200);
            
            if (!isNaN(val) && valido) {
                let fechaRaw = col[0].replace(/['"]/g, '');
                let horaMatch = fechaRaw.match(/(\d{1,2}:\d{2})/);
                let hora = horaMatch ? horaMatch[1] : fechaRaw;

                if (valorActual === null) {
                    valorActual = val;
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
    return { valorActual, dirActual, historial };
}

function parsearHTML(html) {
    let altura = null; let tendencia = "ESTABLE"; 
    const textoPuro = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const todosLosNumeros = [...textoPuro.matchAll(/([-]?\d{1,2}[.,]\d{2})/g)];
    
    for (let n of todosLosNumeros) {
        let index = n.index;
        let contextoPrevio = textoPuro.substring(Math.max(0, index - 45), index).toLowerCase();
        let contextoPosterior = textoPuro.substring(index, index + 20).toLowerCase();
        
        if (contextoPrevio.includes("cero") || contextoPrevio.includes("bater") || 
            contextoPrevio.includes("temp") || contextoPrevio.includes("predic") ||
            contextoPrevio.includes("escala") || contextoPrevio.includes("referencia")) {
            continue; 
        }
        let val = parseFloat(n[1].replace(',', '.'));
        if (val > -3 && val < 12) {
            if (contextoPrevio.includes("nivel") || contextoPrevio.includes("altura") || contextoPosterior.includes("m")) {
                altura = val; break;
            } else if (altura === null) { altura = val; }
        }
    }

    if (/subi[eo]ndo|↑|▲|up|subida|creci/i.test(textoPuro)) tendencia = "SUBIENDO";
    if (/bajando|descend|↓|▼|down|bajada|bajan/i.test(textoPuro)) tendencia = "BAJANDO";
    if (/estable|igual|→|►/i.test(textoPuro)) tendencia = "ESTABLE";
    
    return { altura, tendencia, historialAltura: [] };
}

function obtenerHoraFormateada() {
    const d = new Date();
    d.setHours(d.getHours() - 3);
    let horas = d.getHours();
    const minutos = d.getMinutes().toString().padStart(2, '0');
    const ampm = horas >= 12 ? 'PM' : 'AM';
    horas = horas % 12; horas = horas ? horas : 12; 
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}, ${horas}:${minutos} ${ampm}`;
}

async function procesarEstacion(est) {
    let url2 = est.url.replace(':53880', '').replace('http:', 'https:');
    let url3 = url2.replace('hidrografia.agpse', 'hidrografia2.agpse'); 
    let urls = [est.url, url2, url3];

    for (let currentUrl of urls) {
        try {
            let html = await fetchURL(currentUrl);

            let metaMatch = html.match(/<meta[^>]*url=([^"'>\s]+)/i);
            if (metaMatch) {
                let redirUrl = new URL(metaMatch[1], currentUrl).href;
                html = await fetchURL(redirUrl);
                currentUrl = redirUrl;
            }

            let urlMarea = currentUrl;
            let urlViento = null;

            let iframesUrls = [...html.matchAll(/<iframe[^>]+src=['"]([^'"]+)['"]/gi)].map(m => m[1]);
            for(let src of iframesUrls) {
                if (src.toLowerCase().includes("viento")) {
                    urlViento = new URL(src, currentUrl).href;
                }
                if (src.toLowerCase().includes("marea") || src.toLowerCase().includes("nivel") || src.toLowerCase().includes("index")) {
                    urlMarea = new URL(src, currentUrl).href;
                }
            }

            let estData = { ...est, altura: null, tendencia: "—", historialAltura: [], vientoActual: null, vientoDireccion: null, historialViento: [], ok: false };
            
            let htmlMarea = (urlMarea !== currentUrl) ? await fetchURL(urlMarea) : html;
            let datMatchMarea = htmlMarea.match(/['"]([^'"]+\.dat)['"]/i);
            
            if (datMatchMarea) {
                let datUrl = new URL(datMatchMarea[1], urlMarea).href;
                let csvData = await fetchURL(datUrl); 
                let resAltura = procesarCSV(csvData, 'altura');
                
                if (resAltura && resAltura.valorActual !== null) {
                    estData.altura = resAltura.valorActual;
                    estData.historialAltura = resAltura.historial;
                    estData.ok = true;
                    if (resAltura.historial.length > 0) {
                        let valPrev = resAltura.historial[0].valor;
                        if (estData.altura > valPrev + 0.02) estData.tendencia = "SUBIENDO";
                        else if (estData.altura < valPrev - 0.02) estData.tendencia = "BAJANDO";
                    }
                }
            } else {
                let resTexto = parsearHTML(htmlMarea);
                if (resTexto.altura !== null) {
                    estData.altura = resTexto.altura;
                    estData.tendencia = resTexto.tendencia;
                    estData.ok = true;
                }
            }

            if (urlViento) {
                try {
                    let htmlViento = await fetchURL(urlViento);
                    let datMatchViento = htmlViento.match(/['"]([^'"]+\.dat)['"]/i);
                    if (datMatchViento) {
                        let datUrl = new URL(datMatchViento[1], urlViento).href;
                        let csvData = await fetchURL(datUrl);
                        let resViento = procesarCSV(csvData, 'viento');
                        
                        if (resViento && resViento.valorActual !== null) {
                            estData.vientoActual = resViento.valorActual;
                            estData.vientoDireccion = resViento.dirActual;
                            estData.historialViento = resViento.historial;
                        }
                    }
                } catch(e) { } 
            }

            if (estData.ok) return estData;

        } catch(e) {
            // Intenta la siguiente URL
        }
    }
    return { ...est, altura: null, tendencia: "—", historialAltura: [], vientoActual: null, vientoDireccion: null, historialViento: [], ok: false };
}

async function main() {
  const resultados = [];
  for (const est of ESTACIONES) {
    const dataEstacion = await procesarEstacion(est);
    resultados.push(dataEstacion);
  }

  const dataFinal = { actualizadoEn: obtenerHoraFormateada(), estaciones: resultados };
  fs.writeFileSync('datos.json', JSON.stringify(dataFinal, null, 2));
}

main();
