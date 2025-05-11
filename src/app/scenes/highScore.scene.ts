import Phaser from 'phaser';

// key que vamos a usar en localStorage
const STORAGE_KEY = 'highScores';

export class HighScoreScene extends Phaser.Scene {
  outputText!: Phaser.GameObjects.BitmapText;
  typedText: string = '';
  letterTexts: Phaser.GameObjects.BitmapText[] = [];
  score: string = '';
  width: number = 0;
  height: number = 0;
  constructor() {
    super({ key: 'HighScoreScene' });
  }

  init(passedData: { score: string }) {
    this.data.set('score', passedData.score);
    this.typedText = '';
    this.letterTexts = [];

    this.score = String(passedData.score).padStart(8, '.');
    ({ width: this.width, height: this.height } = this.cameras.main);
  }

  preload() {
    this.load.image('background', 'assets/background.png');
  }

  create() {
    // Fuente bitmap
    const fontConfig = {
      image: 'knighthawks',
      width: 16,
      height: 18,
      chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ| 0123456789*#!@:.,\\?-+=^$£()'",
      charsPerRow: 19,
      'offset.x': 0,
      'offset.y': 0,
      'spacing.x': 0,
      'spacing.y': 0,
      lineSpacing: 5,
    };
    this.cache.bitmapFont.add(
      'knighthawks',
      Phaser.GameObjects.RetroFont.Parse(this, fontConfig)
    );

    // Fondo

    const background = this.add.image(
      this.width / 2,
      this.height / 2,
      'background'
    );
    background.setScale(
      Math.max(this.width / background.width, this.height / background.height)
    );
    background.setScrollFactor(0).setDepth(0);

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const cols = 6; // número de columnas en la cuadrícula
    const spacing = 60; // espacio entre letras
    const startX = this.width / 2 - (cols * spacing) / 2; // posición inicial X
    const startY = this.height / 2; // posición inicial Y

    this.add
      .bitmapText(this.width / 2, 40, 'knighthawks', 'TYPE YOUR INITIALS', 20)
      .setOrigin(0.5)
      .setDepth(12);

    const newScoreText = this.add.bitmapText(
      this.width / 2 - 20,
      70,
      'knighthawks',
      'YOUR SCORE\n' + this.data.get('score'),
      20
    );

    this.outputText = this.add
      .bitmapText(this.width / 2 - 180, 70, 'knighthawks', '...', 40)
      .setDepth(12);

    // Iterar las letras y posicionarlas en la cuadrícula
    letters.forEach((letter: string, index: number) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const x = startX + col * spacing;
      const y = startY + row * spacing;

      const letterText = this.add
        .bitmapText(x, y, 'knighthawks', letter, 40)
        .setDepth(12)
        .setInteractive({ useHandCursor: true });
      this.letterTexts.push(letterText);
    });

    // Añadir el evento de clic a cada letra
    this.input.on('gameobjectdown', (pointer: any, gameObject: any) => {
      const letter = gameObject.text;
      this.onLetterSelected(letter);
    });
  }

  // Añadir el evento de clic a cada letra
  // Cada vez que se hace clic en una letra, se añade a la cadena de texto
  private onLetterSelected(letter: string): void {
    this.typedText += letter;

    this.outputText.setText(this.typedText).setDepth(12);

    // Si se ha escrito más de 2 letras, se ocultan las letras
    // y se muestra el nuevo top 10
    // y se añade el nuevo score al localStorage
    // se muestra el menu salir o partida nueva
    if (this.typedText.length == 3) {
      this.letterTexts.forEach((txt) => txt.setVisible(false));

      const playerName = this.typedText;
      const playerScore = playerName + this.score;

      const top10 = addScore(playerScore);

      // Mostrar el nuevo top 10
      top10.updatedList.forEach((score, idx) => {
        this.add
          .bitmapText(
            this.width / 2,
            280 + idx * 40,
            'knighthawks',
            idx + 1 + '. ' + score,
            25
          )
          .setOrigin(0.5);
      });

      if (top10.isNewTop) {
        // Mostrar nuevo record
        this.add
          .bitmapText(
            this.cameras.main.centerX,
            190,
            'knighthawks',
            'NEW RECORD!',
            30
          )
          .setOrigin(0.5).tint = 0x00ff00;
      }

      this.add
        .bitmapText(
          this.cameras.main.width / 2,
          this.cameras.main.height - 120,
          'knighthawks',
          'NEW GAME',
          30
        )
        .setInteractive()
        .setOrigin(0.5).tint = 0x00ff00;
      this.add
        .bitmapText(
          this.cameras.main.width / 2,
          this.cameras.main.height - 50,
          'knighthawks',
          'EXIT',
          30
        )
        .setInteractive()
        .setOrigin(0.5).tint = 0x00ff00;
      this.input.on('gameobjectdown', (pointer: any, gameObject: any) => {
        if (gameObject.text === 'NEW GAME') {
          this.game.sound.stopAll();
          this.typedText = '';
          this.letterTexts.forEach((txt) => txt.destroy());
          this.outputText.destroy();
          this.scene.stop('HighScoreScene');
          this.scene.start('GameScene');
        } else if (gameObject.text === 'EXIT') {
          this.game.sound.stopAll();
          this.game.destroy(true);
          window.close();
        }
      });
    }
  }
}

// ---------- Funciones para manejar el localStorage ----------
// función para obtener los puntajes
function getHighScores(): string[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

// función para agregar un puntaje al localStorage
function setHighScores(scores: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
}

function addScore(newScore: string) {
  const scores = getHighScores();
  scores.push(newScore);
  scores.sort((a: string, b: string) => {
    // Función auxiliar que devuelve el número al final de la cadena, o 0 si no hay ninguno
    const extractNum = (s: string): number => {
      const m = s.match(/(\d+)$/);
      return m ? parseInt(m[1], 10) : 0;
    };

    const na = extractNum(a);
    const nb = extractNum(b);
    // Orden descendente por número
    return nb - na;
  });

  const top10 = scores.slice(0, 10);

  // Es el nuevo top 10?
  const isNewTop = top10[0] === newScore;

  // Volvemos a guardar la lista
  setHighScores(top10);

  return {
    updatedList: top10,
    isNewTop,
  };
}
