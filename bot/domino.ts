type TileValue = `${number}-${number}`;

class Tile {
  right: string;
  left: string;
  priorityLeft = 0;
  priorityRight = 0;

  constructor(value: TileValue) {
    const [left, right] = value.split("-");
    this.left = left;
    this.right = right;
  }

  isBucha() {
    return this.right === this.left;
  }

  sum() {
    return parseInt(this.right) + parseInt(this.left);
  }

  get priority() {
    return this.priorityLeft + this.priorityRight;
  }

  private calcPriorityForOpponentTiles(missing: string[]) {
    if (missing.includes(this.left)) {
      this.priorityRight += 2;
    }

    if (missing.includes(this.right)) {
      this.priorityLeft += 2;
    }
  }

  private calcPriorityForPartnerNumber(missingNumbers: string[], commonPartnerNumber?: string) {
    if (missingNumbers.includes(this.left)) {
      this.priorityRight -= 1;
    }

    if (commonPartnerNumber === this.left) {
      this.priorityLeft -= 1;
    }

    if (missingNumbers.includes(this.right)) {
      this.priorityLeft -= 1;
    }

    if (commonPartnerNumber === this.right) {
      this.priorityRight -= 1;
    }
  }

  private calcPriorityForCommonValue(commonValue: string) {
    if (this.left === commonValue && this.right === commonValue) {
      this.priorityLeft -= 1;
      this.priorityRight -= 1;
    } else if (this.left === commonValue) {
      this.priorityLeft -= 2;
    } else if (this.right === commonValue) {
      this.priorityRight -= 2;
    }
  }

  calcPriority(missing: MissingTable, commonPlayerNumber?: string, commonPartnerNumber?: string) {
    this.calcPriorityForOpponentTiles(missing.op1);
    this.calcPriorityForOpponentTiles(missing.op2);
    this.calcPriorityForPartnerNumber(missing.partner, commonPartnerNumber);

    if (this.isBucha()) {
      this.priorityLeft += 1;
      this.priorityRight += 1;
    }

    if (commonPlayerNumber) {
      this.calcPriorityForCommonValue(commonPlayerNumber);
    }
  }
}

function reverse(tile: TileValue) {
  const [left, right] = tile.split("-");

  return `${right}-${left}`;
}

export type PlayerNumber = 1 | 2 | 3 | 4;

export interface GameState {
  jogador: PlayerNumber;
  mao: TileValue[];
  mesa: TileValue[];
  jogadas: Turn[];
}

export interface Move {
  pedra: TileValue;
  lado: "direita" | "esquerda";
}

export interface PossibleMove {
  tile: Tile;
  tileSide: "left" | "right";
  tableSide: "direita" | "esquerda";
}

interface PossibleMoveWithPriority {
  tableSide: "direita" | "esquerda";
  priority: number;
  tile: string;
  sum: number;
}
export interface Turn {
  jogador: PlayerNumber;
  pedra: TileValue;
  lado?: "esquerda" | "direita";
}

interface MissingTable {
  partner: string[];
  op1: string[];
  op2: string[];
}

function getPartner(player: PlayerNumber): PlayerNumber {
  switch (player) {
    case 1:
      return 3;
    case 2:
      return 4;
    case 3:
      return 1;
    case 4:
      return 2;
  }
}

function getOponnents(player: PlayerNumber): [PlayerNumber, PlayerNumber] {
  switch (player) {
    case 1:
      return [2, 4];
    case 2:
      return [1, 3];
    case 3:
      return [2, 4];
    case 4:
      return [1, 3];
  }
}

function getPreviousPlayer(player: PlayerNumber): PlayerNumber {
  if (player === 1) {
    return 4;
  }

  return (player - 1) as PlayerNumber;
}

function getMostCommonNumber(mao: TileValue[], remainingTiles: TileValue[]) {
  const tileQtd: { [key: string]: number } = {};

  for (const tile of mao) {
    const [left, right] = tile.split("-");

    if (tileQtd[left]) {
      tileQtd[left] += 1;
    } else {
      tileQtd[left] = 1;
    }

    if (tileQtd[right]) {
      tileQtd[right] += 1;
    } else {
      tileQtd[right] = 1;
    }
  }

  let mostCommonValue = "";
  let max = 0;

  for (const key of Object.keys(tileQtd)) {
    if (tileQtd[key] > max) {
      max = tileQtd[key];
      mostCommonValue = key;
    } else if (tileQtd[key] === max) {
      if (key < mostCommonValue) {
        mostCommonValue = key;
      }
    }
  }

  const toBePlayed = remainingTiles.filter(t => t.split("-").includes(mostCommonValue));

  if (toBePlayed.length > tileQtd[mostCommonValue]) {
    return undefined;
  }

  return mostCommonValue;
}

function assumePartnerCommonNumber(game: GameState) {
  const partner = getPartner(game.jogador);

  let lastPartnerMove;
  for (let i = game.jogadas.length - 1; i > 0; i--) {
    if (game.jogadas[i].lado && game.jogadas[i].jogador === partner) {
      lastPartnerMove = game.jogadas[i];
    }
  }

  if (!lastPartnerMove) {
    return;
  }

  if (lastPartnerMove.lado === "direita") {
    return lastPartnerMove.pedra.split("-")[1];
  }
  if (lastPartnerMove.lado === "esquerda") {
    return lastPartnerMove.pedra.split("-")[0];
  }
}

function sortDescending(arr: PossibleMoveWithPriority[]): void {
  for (let i = 1; i < arr.length; i++) {
    const move = arr[i];
    let j = i - 1;

    while (
      j >= 0 &&
      (move.priority > arr[j].priority || (move.priority === arr[j].priority && move.sum > arr[j].sum))
    ) {
      arr[j + 1] = arr[j];
      j--;
    }

    arr[j + 1] = move;
  }
}

export function playGame(game: GameState): Move | {} {
  let remainingTiles: TileValue[] = [
    "0-0",
    "0-1",
    "0-2",
    "0-3",
    "0-4",
    "0-5",
    "0-6",
    "1-1",
    "1-2",
    "1-3",
    "1-4",
    "1-5",
    "1-6",
    "2-2",
    "2-3",
    "2-4",
    "2-5",
    "2-6",
    "3-3",
    "3-4",
    "3-5",
    "3-6",
    "4-4",
    "4-5",
    "4-6",
    "5-5",
    "5-6",
    "6-6",
  ];

  const possibleMoves: PossibleMove[] = [];

  const player = game.jogador;
  const partner = getPartner(player);
  const [op1, op2] = getOponnents(player);

  const missingTilesByPlayer: { [key: string]: string[] } = {
    [player]: [],
    [partner]: [],
    [op1]: [],
    [op2]: [],
  };

  remainingTiles = remainingTiles.filter(t => {
    return game.mesa.some(tileOnTable => tileOnTable === t || tileOnTable === reverse(t));
  });

  let previousPlayer = getPreviousPlayer(player);

  while (game.jogadas[game.jogadas.length - 1].jogador !== previousPlayer) {
    missingTilesByPlayer[previousPlayer].push(
      game.mesa[0].split("-")[0],
      game.mesa[game.mesa.length - 1].split("-")[1],
    );

    previousPlayer = getPreviousPlayer(previousPlayer);
  }

  for (let i = game.jogadas.length - 1; i > 0; i--) {
    const lastPlayer = game.jogadas[i].jogador;

    const before = game.jogadas[i - 1].jogador;

    let lastOpponent = getPreviousPlayer(lastPlayer);

    while (before !== lastOpponent) {
      missingTilesByPlayer[lastOpponent].push(
        game.jogadas[i - 1].lado === "direita"
          ? game.jogadas[i - 1].pedra.split("-")[1]
          : game.jogadas[i - 1].pedra.split("-")[0],
      );
      let lastPlayOnOtherSide: Turn | undefined;
      const otherside = game.jogadas[i - 1].lado === "direita" ? "esquerda" : "direita";

      lastPlayOnOtherSide = game.jogadas
        .slice(0, i - 1)
        .reverse()
        .find(t => t.lado === otherside);

      if (lastPlayOnOtherSide) {
        missingTilesByPlayer[lastOpponent].push(
          lastPlayOnOtherSide.lado === "direita"
            ? lastPlayOnOtherSide.pedra.split("-")[1]
            : lastPlayOnOtherSide.pedra.split("-")[0],
        );
      }
      lastOpponent = getPreviousPlayer(lastOpponent);
    }
  }

  for (const key of Object.keys(missingTilesByPlayer)) {
    missingTilesByPlayer[key] = Array.from(new Set(missingTilesByPlayer[key]));
  }

  const tableRightNumber = game.mesa[game.mesa.length - 1][2];
  const tableLeftNumber = game.mesa[0][0];

  for (const tile of game.mao) {
    const [left, right] = tile.split("-");

    if (left === tableRightNumber) {
      possibleMoves.push({ tile: new Tile(tile), tableSide: "direita", tileSide: "left" });
    }

    if (right === tableRightNumber) {
      possibleMoves.push({ tile: new Tile(tile), tableSide: "direita", tileSide: "right" });
    }

    if (left === tableLeftNumber) {
      possibleMoves.push({ tile: new Tile(tile), tableSide: "esquerda", tileSide: "left" });
    }

    if (right === tableLeftNumber) {
      possibleMoves.push({ tile: new Tile(tile), tableSide: "esquerda", tileSide: "right" });
    }
  }

  const missing = {
    partner: missingTilesByPlayer[partner],
    op1: missingTilesByPlayer[op1],
    op2: missingTilesByPlayer[op2],
  };

  if (possibleMoves.length === 0) {
    return {};
  }

  const playerCommonNumber = getMostCommonNumber(game.mao, remainingTiles);
  let partnerCommonNumber = assumePartnerCommonNumber(game);

  const n = partnerCommonNumber;
  if (n) {
    const toBePlayed = remainingTiles
      .filter(t => t.split("-").includes(n))
      .filter(t => !game.mao.some(m => m === t || m === reverse(t)));

    if (toBePlayed.length === 0) {
      partnerCommonNumber = undefined;
    }
  }

  const arr: PossibleMoveWithPriority[] = possibleMoves.map(pm => {
    pm.tile.calcPriority(missing, playerCommonNumber, partnerCommonNumber);

    if (pm.tileSide === "left") {
      return {
        tableSide: pm.tableSide,
        priority: pm.tile.priorityLeft,
        tile: `${pm.tile.left}-${pm.tile.right}`,
        sum: pm.tile.sum(),
      };
    }
    return {
      tableSide: pm.tableSide,
      priority: pm.tile.priorityRight,
      tile: `${pm.tile.left}-${pm.tile.right}`,
      sum: pm.tile.sum(),
    };
  });

  sortDescending(arr);

  const { tableSide, tile } = arr[0];

  return { lado: tableSide, pedra: tile };
}
