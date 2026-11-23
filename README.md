# Pinagem dos Megas do BlackHawk

Desenho dos dois Arduino Mega 2560 do simulador, com os pinos de cada painel
como os firmwares `Mega 1 pronto v8` e `Mega 2 pronto v1` leem: teclado FMS
(matriz 7x12), as placas de 32 botões M1 e M2 (matrizes 4x8, as duas no Mega 1;
M1/M2 são nomes de placa, não de Mega) e o Flight Director
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

O nome de botão da janela FMS-1 em cada tecla do teclado FMS vem de
`FMS1`, uma cópia à mão de `ComandoFms.Teclas` (`painel/src/Fms.cs` do
Simulador-BlackHawk). Mudou a tabela no Painel, mude `FMS1` junto: o CI daqui
confere a forma (7 × 12, vazios nas mesmas posições da `CHAVE_FMS`, 79 nomes
sem repetir), mas não tem como saber se dois nomes foram trocados de lugar.

## Verificação

```
node ci/check.js
```

Falha se um pino estiver em dois painéis do mesmo Mega, se uma matriz ou um encoder usar
pino proibido (serial, D13, energia, SCL/SDA), se um pino for desenhado sem
papel ou listado em `BOARDS` sem aparecer no desenho, se a ficha não mandar o
giro de EN6 a EN9 ao Mega 2 ou se alguma aba de encoder quebrar. Falha também
se a `CHAVE_FMS` não tiver uma fileira por pino de linha e uma coluna por pino
de coluna do FMS (7 × 12), só números, com as 79 teclas SW0 a SW78 uma vez cada,
se `FMS1` não tiver a forma da `CHAVE_FMS` ("FMS1 fileira N com X nomes", "FMS
Ln Cn: nome e SW não batem", "FMS-1 X repetido"), se a matriz do FMS não mostrar
os nomes da FMS-1, se o passo a passo não disser que a SW42 clica N, ou se o
nome do FMS-1 aparecer em M1, M2 ou Flight Director. Também planta 28
defeitos e exige que cada um gere o erro certo. Também falha se um sinal
de conector do Flight Director não cair num pino do Mega, se um fio do
Flight Director não sair em nenhum conector ou fio novo, ou se um painel sair
do Mega decidido para ele.
