# Pinagem dos Megas do BlackHawk

Desenho dos dois Arduino Mega 2560 do simulador, com os pinos de cada painel
como o firmware `FMS pronto v7` lê: teclado FMS (matriz 7x12), duas placas de
32 botões (matrizes 4x8) e o Flight Director (matriz 4x6 e o giro de cinco
encoders).

Página: https://ceugox.github.io/blackhawk-pinagem/

O firmware é o mesmo em todos os Megas e cada painel tem pinos fixos, então
qualquer painel pode ir em qualquer Mega. A página deixa marcar qual painel
está em qual Mega e desenha cada placa só com os fios dela.

A pinagem vem do `firmware/fms_teclado/fms_teclado.ino` do repo
Simulador-BlackHawk (privado). Mudou um pino no firmware, mude a lista
`BOARDS` do `index.html`: os desenhos e as fichas saem dela. Os conectores do
Flight Director ficam em `CONECTORES_FD`, logo abaixo.

## Verificação

```
node ci/check.js
```

Falha se um pino estiver em dois painéis, se uma matriz ou um encoder usar
pino proibido (serial, D13, energia, SCL/SDA), se um pino for desenhado sem
papel ou listado em `BOARDS` sem aparecer no desenho. Também planta onze
defeitos e exige que cada um gere o erro certo.
