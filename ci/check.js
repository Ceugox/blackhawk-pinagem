// Roda o script da pagina com um DOM minimo. Falha se a pinagem tiver pino
// repetido dentro do mesmo Mega, pino de matriz ou de encoder em lugar proibido,
// painel fora do Mega decidido, pino desenhado sem papel ou
// pino de BOARDS fora do desenho (o script chama console.error nesses casos).
// Tambem confere que o detector pega um defeito plantado de proposito.
const fs = require("fs");
const html = fs.readFileSync(__dirname + "/../index.html", "utf8");
const m = html.match(/<script>([\s\S]*?var BOARDS[\s\S]*?)<\/script>/);
if (!m) { console.log("script da pinagem nao encontrado"); process.exit(1); }

// Roda o script; guarda o HTML que ele escreve (fichas, passos) e os botoes que
// ele cria com clique (abas dos encoders), para o teste da pagina renderizada.
function rodar(src) {
  const escrito = [], cliques = [];
  function node() {
    return { setAttribute() {}, appendChild() {}, insertBefore() {},
      addEventListener(tipo, fn) { if (tipo === "click") cliques.push({ no: this, fn }); },
      parentNode: null, style: {}, textContent: "", set innerHTML(v) { escrito.push(v); } };
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
  return { achados, escrito, cliques };
}
function erros(src) { return rodar(src).achados; }

const real = rodar(m[1]);
if (real.achados.length) { console.log("pinagem com erro: " + real.achados.join("; ")); process.exit(1); }

// A pagina renderizada: a ficha tem de mandar o giro de EN6-EN9 para o Mega 2,
// e cada aba de encoder (Mega 1 e Mega 2) tem de abrir sem erro e mostrar a
// linha certa da serial. Sem isso, um erro so nesse caminho quebraria no navegador.
const ficha = real.escrito.join("\n");
for (const [en, pino] of [["EN6-A", "D22"], ["EN8M-B", "D29"], ["EN9M-A", "D32"]]) {
  if (!new RegExp(en + "</td><td class=\"pinv\">" + pino + " do Mega 2<").test(ficha)) {
    console.log("ficha sem " + en + " no " + pino + " do Mega 2"); process.exit(1);
  }
}
if (!/A3<\/td>/.test(ficha) || / do Mega 1</.test(ficha)) { console.log("ficha do Mega 1 com sufixo errado"); process.exit(1); }
const abas = real.cliques.filter((c) => / · /.test(c.no.textContent));
const esperadas = ["EN1", "EN2", "EN3", "EN4", "EN5", "EN6", "EN7", "EN8", "EN8M", "EN9", "EN9M"];
if (abas.map((c) => c.no.textContent.split(" · ")[0]).join() !== esperadas.join()) {
  console.log("abas de encoder erradas: " + abas.map((c) => c.no.textContent).join(", ")); process.exit(1);
}
for (const aba of abas) {
  const en = aba.no.textContent.split(" · ")[0], antes = real.escrito.length;
  try { aba.fn(); } catch (e) { console.log("aba " + en + " quebrou: " + e.message); process.exit(1); }
  const passos = real.escrito.slice(antes).join("");
  const mega = /^EN[6-9]/.test(en) ? 2 : 1;
  if (!passos.includes("<pre>G FD " + en + " +</pre>") || !passos.includes("no Mega " + mega)) {
    console.log("aba " + en + " sem a linha G FD " + en + " ou sem o Mega " + mega); process.exit(1);
  }
}

// [trecho original, trecho com defeito, erro que tem de aparecer, nome]
const plantados = [
  ['"12","44"', '"12","45"', "D45 proibido", "pino repetido entre matrizes"],
  ['"12","44"', '"12","1"', "D1 proibido", "matriz na serial do USB"],
  ['"12","44"', '"12","5V"', "5V proibido", "matriz no 5V"],
  ['"12","44"', '"12","SCL"', "SCL proibido", "matriz no SCL repetido"],
  ['"12","44"', '"12","13"', "D13 proibido em matriz", "matriz no D13 do LED"],
  ['"12","44"', '"12","54"', "D54 proibido", "pino que nao existe no Mega"],
  ['"10","9","8"], 236', '"10","9"], 236', "D8 fora do desenho", "pino de BOARDS fora do desenho"],
  ['["A10","A11"]', '["A9","A11"]', "A9 proibido", "giro de encoder em pino da matriz do Flight Director"],
  ['["16","17"]', '["16","13"]', "D13 proibido", "giro de encoder no D13 do LED"],
  ['"A8","A9"]', '"A8","22"]', "D22 proibido", "Flight Director em pino do FMS"],
  ['["14","15"]', '["14","54"]', "D54 proibido", "giro de encoder em pino que nao existe"],
  ['["ROW4","COL1"]', '["ROW4","COL7"]', "Fio novo COL7 sem pino do Mega", "sinal de conector sem pino (coluna que nao existe)"],
  ['["EN4-A","EN4-B","COL6","COL5"]', '["EN7M-A","EN4-B","COL6","COL5"]', "H4 EN7M-A sem pino do Mega", "sinal de encoder sem giro ligado"],
  ['var ONDE = { fms: 0, m1: 0, m2: 0, fd: 0,', 'var ONDE = { fms: 0, m1: 0, m2: 0, fd: 1,', "Flight Director fora do Mega 1", "painel fora do Mega 1"],
  ['var ONDE = { fms: 0, m1: 0, m2: 0, fd: 0, fd2: 1 }', 'var ONDE = { fms: 0, m1: 0, m2: 0, fd: 0, fd2: 0 }', "fora do Mega 2", "giro de EN6-EN9 fora do Mega 2"],
  ['["32","33"]', '["32","31"]', "D31 proibido no Mega 2", "pino repetido dentro do Mega 2"],
  ['["22","23"]', '["22","1"]', "D1 proibido no Mega 2", "giro do Mega 2 na serial do USB"],
  ['"EN9M-B","GND2"]', '"EN9M-B"]', "GND2 sem conector nem fio novo", "GND do Mega 2 fora da ficha"],
  ['"EN8M-A","EN8M-B",', '', "EN8M-A sem conector nem fio novo", "miolo do duplo fora da ficha"],
  ['"W", null, "SK8"', '"W", "Z", "SK8"', "FMS L4 C11: nome e SW não batem", "botao do FMS-1 em posicao sem tecla"],
  ['"G", "H", "I"', '"G", "G", "I"', "FMS-1 G repetido", "botao do FMS-1 repetido"],
  ['["ROW4","COL1"]', '["COL1"]', "ROW4 sem conector nem fio novo", "fio do Flight Director fora dos conectores"],
  ['["GND","ROW3"', '["ROW3"', "GND sem conector nem fio novo", "GND dos encoders fora dos conectores"],
];
for (const [de, para, esperado, nome] of plantados) {
  if (!m[1].includes(de)) { console.log("defeito plantado nao se aplica: " + nome); process.exit(1); }
  const achados = erros(m[1].replace(de, para));
  if (!achados.some((e) => e.includes(esperado))) {
    console.log("detector nao pegou: " + nome + " (esperava \"" + esperado + "\", veio: " + (achados.join("; ") || "nada") + ")");
    process.exit(1);
  }
}
console.log("pinagem ok; detector pegou os " + plantados.length + " defeitos plantados");
