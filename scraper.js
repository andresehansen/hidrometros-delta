const fs = require('fs');

// Las URLs de AGP (algunas con el puerto 53880)
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

// Función moderna con "disfraz" de navegador
async function fetchURL(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);
  
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "es-AR,es;q=0.9,en-US;q=0.8,en;q=0.7"
      },
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

function parsearHTML(html) {
    let altura = null; let tendencia = "ESTABLE"; let fechaHora = null;
    const alturaPatterns = [
      /(\d+\.\d{2})\s*m/i, /<b>\s*(\d+[.,]\d{2,3})\s*<\/b>/i,
      /altura[^>]*>\s*(\d+[.,]\d{2})/i, /nivel[^>]*>\s*(\d+[.,]\d{2})/i,
      /"valor"\s*[>:]\s*"?(\d+[.,]\d{2,3})"?/i, />\s*(\d+[.,]\d{2,3})\s*</,
      /(\d{1,2}[.,]\d{2})/ 
    ];
    for (const pat of alturaPatterns) {
      const m = html.match(pat);
      if (m) { altura = parseFloat(m[1].replace(",", ".")); if (altura > 0 && altura < 15) break; }
    }
    if (/subi[eo]ndo|↑|▲|up|subida/i.test(html)) tendencia = "SUBIENDO";
    if (/bajando|descend|↓|▼|down|bajada/i.test(html)) tendencia = "BAJANDO";
    if (/estable|igual|→|►/i.test(html)) tendencia = "ESTABLE";
    
    const fechaMatch = html.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})[^\d]*(\d{1,2}:\d{2})/);
    if (fechaMatch) fechaHora = `${fechaMatch[1]} ${fechaMatch[2]}`;
    return { altura, tendencia, fechaHora };
}

function obtenerHoraFormateada() {
    const d = new Date();
    d.setHours(d.getHours() - 3); // Ajuste a Hora Argentina
    let horas = d.getHours();
    const minutos = d.getMinutes().toString().padStart(2, '0');
    const ampm = horas >= 12 ? 'PM' : 'AM';
    horas = horas % 12; horas = horas ? horas : 12; 
    const dia = d.getDate().toString().padStart(2, '0');
    const mes = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${dia}/${mes}/${d.getFullYear()}, ${horas}:${minutos} ${ampm}`;
}

async function main() {
  const resultados = [];
  console.log("Iniciando recolección de alturas...");

  for (const est of ESTACIONES) {
    try {
      console.log(`Buscando: ${est.nombre}...`);
      const html = await fetchURL(est.url);
      const datos = parsearHTML(html);
      
      if (datos.altura === null) {
         console.log(`❌ Sin altura detectada en el código para: ${est.nombre}`);
      } else {
         console.log(`✅ Éxito en ${est.nombre}: ${datos.altura}m`);
      }
      
      resultados.push({ ...est, ...datos, ok: datos.altura !== null });
    } catch (e) {
      console.log(`❌ Error de conexión con ${est.nombre}: ${e.message}`);
      resultados.push({ ...est, altura: null, tendencia: "—", fechaHora: null, ok: false });
    }
    // Pausa inteligente para no saturar al servidor
    await new Promise(r => setTimeout(r, 1000)); 
  }

  const dataFinal = { actualizadoEn: obtenerHoraFormateada(), estaciones: resultados };
  fs.writeFileSync('datos.json', JSON.stringify(dataFinal, null, 2));
  console.log("Archivo datos.json guardado correctamente.");
}

main();
