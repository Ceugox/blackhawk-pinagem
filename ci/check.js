// Roda o script da pagina com um DOM minimo. Falha se a pinagem tiver pino
// repetido dentro do mesmo Mega, pino de matriz ou de encoder em lugar proibido,
// painel fora do Mega decidido, pino desenhado sem papel ou
// pino de BOARDS fora do desenho, CHAVE_FMS fora de 7 x 12 ou sem as 79 teclas
// SW0..SW78 uma vez cada, FMS1 (nomes da FMS-1) fora da forma da CHAVE_FMS (o
// script chama console.error nesses casos). Depois confere a pagina desenhada:
// nomes da FMS-1 nas teclas, passo a passo, abas de matriz e de encoder.
// Tambem confere que o detector pega um defeito plantado de proposito.
const fs = require("fs");
const html = fs.readFileSync(__dirname + "/../index.html", "utf8");
const m = html.match(/<script>([\s\S]*?var BOARDS[\s\S]*?)<\/script>/);
if (!m) { console.log("script da pinagem nao encontrado"); process.exit(1); }

// Roda o script; guarda o HTML que ele escreve (fichas, passos) e os botoes que
// ele cria com clique (abas dos encoders), para o teste da pagina renderizada.
function rodar(src) {
  const escrito = [], cliques = [], nos = [], abasMx = [];
  function node() {
    const n = { setAttribute(k, v) { this["@" + k] = v; }, getAttribute(k) { return this["@" + k]; }, appendChild() {}, insertBefore() {}, removeChild() {}, firstChild: null,
      addEventListener(tipo, fn) { if (tipo === "click") cliques.push({ no: this, fn }); },
      parentNode: null, style: {}, textContent: "", set innerHTML(v) { escrito.push(v); } };
    nos.push(n);
    return n;
  }
  const svg = node(); svg.parentNode = node();
  // As quatro abas da matriz ("Como uma tecla e lida"), como no HTML.
  for (const m of ["fms", "m1", "m2", "fd"]) {
    const b = node(); b.getAttribute = (a) => (a === "data-m" ? m : null); abasMx.push(b);
  }
  global.document = {
    getElementById: () => svg, createElementNS: () => node(),
    createElement: () => node(), querySelectorAll: (s) => (s === "#tabs-mx button" ? abasMx : []),
  };
  const achados = [];
  const original = console.error;
  console.error = (...a) => achados.push(a.join(" "));
  try { new Function(src)(); } finally { console.error = original; }
  return { achados, escrito, cliques, nos, abasMx };
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
// Matriz do FMS desenhada ao abrir: as teclas mostram o botao da FMS-1, e o
// passo a passo da tecla selecionada (L3 C7, SW42) diz que o Painel clica N.
const textos = () => real.nos.map((n) => n.textContent);
for (const nome of ["D➛", "BRT", "A", "+/-", "SPC", "ENT", "IDNT"]) {
  if (!textos().includes(nome)) { console.log("matriz do FMS sem a tecla " + nome); process.exit(1); }
}
if (!real.escrito.some((h) => h.includes("O Painel clica <strong>N</strong>") && h.includes("P L3 C7 SW42"))) {
  console.log("passo a passo do FMS nao diz que SW42 clica N"); process.exit(1);
}
// As outras abas nao herdam os nomes do FMS.
for (const aba of real.abasMx.slice(1)) {
  const antes = real.nos.length, idx = real.cliques.findIndex((c) => c.no === aba);
  real.cliques[idx].fn();
  const novos = real.nos.slice(antes).map((n) => n.textContent);
  if (novos.includes("BRT") || novos.includes("IDNT")) { console.log("aba " + aba.getAttribute("data-m") + " com nome do FMS-1"); process.exit(1); }
  if (aba.getAttribute("data-m") === "fd" && !novos.includes("EN8")) { console.log("aba fd sem os eixos de encoder"); process.exit(1); }
}
// Paineis: as 4 abas, e cada botao de cada painel mostra a combinacao certa.
const abasPn = real.cliques.filter((c) => ["FMS-1", "FDDCP-1", "M1", "M2"].includes(c.no.textContent) && c.no.type === "button");
const esperadoPn = { "FMS-1": 79, "FDDCP-1": 22, "M1": 32, "M2": 32 };
if (abasPn.length !== 4) { console.log("abas de painel: " + abasPn.length + ", esperado 4"); process.exit(1); }
for (const aba of abasPn) {
  const nome = aba.no.textContent, antesC = real.cliques.length;
  aba.fn();
  const botoes = real.cliques.slice(antesC).filter((c) => String(c.no["@aria-label"] || "").startsWith("Painel: "));
  if (botoes.length !== esperadoPn[nome]) { console.log("painel " + nome + " com " + botoes.length + " botões, esperado " + esperadoPn[nome]); process.exit(1); }
  for (const b of botoes) {
    const antes = real.escrito.length;
    try { b.fn(); } catch (e) { console.log("painel " + nome + ", " + b.no["@aria-label"] + " quebrou: " + e.message); process.exit(1); }
    const info = real.escrito.slice(antes).join("");
    if (!/<pre>[PG] /.test(info) || !info.includes("<dd>Mega ")) { console.log("painel " + nome + ", " + b.no["@aria-label"] + " sem combinação"); process.exit(1); }
  }
}
// Combinacoes conferidas a mao (fontes: firmware, ficha do FD, decisao de 23/11)
function infoDe(painel, rotulo) {
  abasPn.find((c) => c.no.textContent === painel).fn();
  const b = real.cliques.filter((c) => c.no["@aria-label"] === "Painel: " + rotulo).pop();
  const antes = real.escrito.length; b.fn(); return real.escrito.slice(antes).join("");
}
const casos = [
  ["FDDCP-1", "NAV SRC / OBS", ["<pre>G FD EN8 +</pre>", "<dd>D26</dd>", "<pre>G FD EN8M +</pre>", "<dd>D28</dd>", "<pre>P FD L1 C1 EN8</pre>", "Mega 2", "Mega 1"]],
  ["FDDCP-1", "BRG 1 / BRG 2", ["<pre>G FD EN9 +</pre>", "<dd>D30</dd>", "<pre>G FD EN9M +</pre>", "<dd>D32</dd>", "<pre>P FD L3 C1 EN9</pre>"]],
  ["FDDCP-1", "HDG", ["<pre>P FD L2 C5 SW43</pre>"]],
  ["FDDCP-1", "ALT", ["<pre>P FD L2 C4 SW44</pre>"]],
  ["FDDCP-1", "HDG P-SYNC", ["<pre>G FD EN5 +</pre>", "<dd>D16</dd>", "<dd>D17</dd>", "<pre>P FD L4 C5 EN5</pre>"]],
  ["FMS-1", "A", ["<pre>P L1 C6 SW39</pre>", "<dd>L1 no D22</dd>", "<dd>C6 no D33</dd>"]],
  ["FMS-1", "ENT", ["<pre>P L7 C11 SW66</pre>"]],
  ["M2", "L4 C8", ["<pre>P M2 L4 C8</pre>", "<dd>C8 no D53</dd>"]],
];
for (const [painel, rotulo, trechos] of casos) {
  const info = infoDe(painel, rotulo);
  for (const tr of trechos) if (!info.includes(tr)) { console.log("painel " + painel + ", " + rotulo + ": falta " + tr); process.exit(1); }
}
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
  ['"W", null, "SK8"]', '"W", null]', "FMS1 fileira 4 com 11 nomes", "fileira do FMS-1 curta"],
  ['|ENT 1187 1044 42 42")', '")', "Painel FMS-1 sem o botão ENT", "botão do FMS-1 fora do painel"],
  ['giro: ["EN8", "EN8M"]', 'giro: ["EN8", "EN7M"]', "giro EN7M de NAV SRC / OBS sem fios", "giro do painel sem fio"],
  ['{ nome: "DECL", x: 387, y: 207, w: 119, h: 114, chave: 37 },', '', "Painel FDDCP-1 sem a tecla SW37", "tecla do FD fora do painel"],
  ['giro: ["EN3"], alvo', 'giro: [], alvo', "Painel FDDCP-1 sem o giro EN3", "giro do FD fora do painel"],
  ['chave: "EN7", giro: ["EN7"]', 'chave: "EN7", giro: ["EN6"]', "giro de REF SEL não é do encoder EN7", "giro trocado entre giratorios"],
  ['giro: ["EN8", "EN8M"]', 'giro: ["EN8M", "EN8"]', "giro de NAV SRC / OBS não é do encoder EN8", "anel e miolo invertidos"],
  ['chave: 50 }', 'chave: 51 }', "HVR sem posição na matriz do FD", "estação com SW que não existe"],
  ['65, 71, 77]', '65, 71, -1]', "SW77 sem posição no FMS", "tecla do FMS some da CHAVE_FMS"],
  ['[ 1, 10, 17', '[ 0, 10, 17', "SW0 repetida no FMS", "SW repetida na CHAVE_FMS"],
  ['65, 71, 77]', '65, 71, 77, -1]', "CHAVE_FMS fileira 1 com 13 colunas", "CHAVE_FMS com coluna a mais"],
  ['[ 5,  7, 13', '[ "5",  7, 13', "valor que não é número", "SW entre aspas na CHAVE_FMS"],
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
