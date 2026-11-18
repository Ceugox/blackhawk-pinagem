# Pinagem dos Megas do BlackHawk

Desenho dos dois Arduino Mega 2560 do simulador, com os pinos de cada painel
como o firmware `FMS pronto v7` lê: teclado FMS (matriz 7x12), duas placas de
32 botões (matrizes 4x8) e o Flight Director (matriz 4x6 e o giro de cinco
encoders).

Página: https://ceugox.github.io/blackhawk-pinagem/

Os quatro painéis ficam no Mega 1 (decisão de 18/11/2026); o Mega 2 fica
reservado para os próximos componentes, com o mesmo firmware e nenhum fio. O
Flight Director leva dois fios novos, soldados na placa: ROW4 no A3 e COL1 no A4.

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
papel ou listado em `BOARDS` sem aparecer no desenho. Também planta dezesseis
defeitos e exige que cada um gere o erro certo. Também falha se um sinal
de conector do Flight Director não cair num pino do Mega, se um fio do
Flight Director não sair em nenhum conector ou fio novo, ou se um painel sair
do Mega 1.
