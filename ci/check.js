// Roda o script da pagina com um DOM minimo e falha se a pinagem tiver
// pino repetido ou pino desenhado sem papel (o script chama console.error).
const fs = require("fs");
const html = fs.readFileSync(__dirname + "/../index.html", "utf8");
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { console.error("script nao encontrado"); process.exit(1); }
function node() {
  return { setAttribute() {}, getAttribute() { return "all"; }, appendChild() {}, insertBefore() {},
    addEventListener() {}, parentNode: null, style: {}, set textContent(v) {}, set innerHTML(v) {} };
}
const svg = node(); svg.parentNode = node();
global.document = {
  getElementById: () => svg,
  createElementNS: () => node(),
  createElement: () => node(),
  querySelectorAll: () => [],
};
let erros = 0;
console.error = (...a) => { erros++; process.stderr.write(a.join(" ") + "\n"); };
new Function(m[1])();
if (erros) process.exit(1);
console.log("pinagem ok");
