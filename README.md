# Pinagem do Mega BlackHawk

Desenho do Arduino Mega 2560 com os pinos do teclado FMS (matriz 7x12) e das
duas placas de 32 botões (matrizes 4x8), como o firmware `FMS pronto v6` lê.

Página: https://ceugox.github.io/blackhawk-pinagem/

A pinagem vem do `firmware/fms_teclado/fms_teclado.ino` do repo
Simulador-BlackHawk (privado). Mudou um pino no firmware, mude a lista
`BOARDS` do `index.html`: o desenho e as fichas saem dela.

## Verificação

```
node ci/check.js
```

Falha se um pino estiver em duas matrizes, numa matriz em pino proibido (serial,
energia, SCL/SDA), desenhado sem papel ou listado em `BOARDS` sem aparecer no
desenho. Também planta três defeitos e exige que o detector pegue cada um.
