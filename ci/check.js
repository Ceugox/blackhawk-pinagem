// Roda o script da pagina com um DOM minimo. Falha se a pinagem tiver pino
// repetido, pino de matriz em lugar proibido, pino desenhado sem papel ou
// pino de BOARDS fora do desenho (o script chama console.error nesses casos).
// Tambem confere que o detector pega um defeito plantado de proposito.
const fs = require("fs");
const html = fs.readFileSync(__dirname + "/../index.html", "utf8");
const m = html.match(/<script>([\s\S]*?var BOARDS[\s\S]*?)<\/script>/);
if (!m) { console.log("script da pinagem nao encontrado"); process.exit(1); }

function erros(src) {
  function node() {
    return { setAttribute() {}, appendChild() {}, insertBefore() {}, addEventListener() {},
      parentNode: null, style: {}, set textContent(v) {}, set innerHTML(v) {} };
  }
  const svg = node(); svg.parentNode = node();
  global.document = {
    getElementById: () => svg, createElementNS: () => node(),
    createElement: () => node(), querySelectorAll: () => [],
  };
  const achados = [];
  const original = console.error;
  console.error = (...a) => achados.push(a.join(" "));
  try { new Function(src)(); } finally { console.error = original; }
  return achados;
}

const reais = erros(m[1]);
if (reais.length) { console.log("pinagem com erro: " + reais.join("; ")); process.exit(1); }

const plantados = [
  ['"12","44"', '"12","45"', "pino repetido entre matrizes"],
  ['"12","44"', '"12","1"', "matriz na serial do USB"],
  ['"12","44"', '"12","54"', "pino que nao existe no Mega"],
];
for (const [de, para, nome] of plantados) {
  if (!m[1].includes(de)) { console.log("defeito plantado nao se aplica: " + nome); process.exit(1); }
  if (!erros(m[1].replace(de, para)).length) { console.log("detector nao pegou: " + nome); process.exit(1); }
}
console.log("pinagem ok; detector pegou os " + plantados.length + " defeitos plantados");
