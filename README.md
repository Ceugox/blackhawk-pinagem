# Pinagem dos Megas do BlackHawk

Desenho dos dois Arduino Mega 2560 do simulador, com os pinos de cada painel
como os firmwares `Mega 1 pronto v8` e `Mega 2 pronto v1` leem: teclado FMS
(matriz 7x12), duas placas de 32 botões (matrizes 4x8) e o Flight Director
(matriz 4x6 e o giro de nove encoders, dois deles duplos).

Página: https://ceugox.github.io/blackhawk-pinagem/

Os quatro painéis ficam no Mega 1 (decisão de 18/11/2026). O giro de EN6 a
EN9 do Flight Director vai no Mega 2, do D22 ao D33, com firmware próprio
(decisão de 23/11/2026); o resto do Mega 2 fica livre. O Flight Director leva
fios novos, soldados na placa: ROW4 no A3 e COL1 no A4 (Mega 1), e os 12 fios
de giro de EN6 a EN9 mais um GND (Mega 2).

A pinagem vem do `firmware/fms_teclado/fms_teclado.ino` (Mega 1) e do
`firmware/mega2/mega2.ino` (Mega 2) do repo Simulador-BlackHawk (privado).
Cada Mega tem o seu mapa de papéis: o mesmo número de pino pode ser de painéis
diferentes em cada um. Mudou um pino no firmware, mude a lista
`BOARDS` do `index.html`: os desenhos e as fichas saem dela. Os conectores do
Flight Director ficam em `CONECTORES_FD`, logo abaixo.

## Verificação

```
node ci/check.js
```

Falha se um pino estiver em dois painéis do mesmo Mega, se uma matriz ou um encoder usar
pino proibido (serial, D13, energia, SCL/SDA), se um pino for desenhado sem
papel ou listado em `BOARDS` sem aparecer no desenho. Também planta 21
defeitos e exige que cada um gere o erro certo. Também falha se um sinal
de conector do Flight Director não cair num pino do Mega, se um fio do
Flight Director não sair em nenhum conector ou fio novo, ou se um painel sair
do Mega decidido para ele.
