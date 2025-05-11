import Phaser from 'phaser';

class Asteroid extends Phaser.Physics.Arcade.Image {
  impactsLeft: number = 5;
  marker?: Phaser.GameObjects.Graphics;
  impactText?: Phaser.GameObjects.Text;
  blinkTween?: Phaser.Tweens.Tween;
}

export class GameScene extends Phaser.Scene {
  private spaceship!: Phaser.Physics.Arcade.Sprite;
  private bullets!: Phaser.Physics.Arcade.Group;
  private asteroids!: Phaser.Physics.Arcade.Group;

  private stepsPositionX!: number;
  private movingLeft = false;
  private movingRight = false;
  private shooting = false;
  private lastShotTime = 0;
  private shotCooldown = 180;
  private controlsEnabled = true;
  private isPaused = false;

  private score = 0;
  private livesDead = 0;
  private textRetro!: Phaser.GameObjects.BitmapText;
  private lives!: Phaser.GameObjects.Sprite;
  private pauseOverlayText!: Phaser.GameObjects.BitmapText;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private pauseKey!: Phaser.Input.Keyboard.Key;

  private asteroidEvent!: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'GameScene' });
  }

  init() {
    this.score = 0;
    this.livesDead = 0;
    this.movingLeft = false;
    this.movingRight = false;
    this.shooting = false;
    this.lastShotTime = 0;
    this.shotCooldown = 180;
    this.controlsEnabled = true;
    this.isPaused = false;
    this.stepsPositionX = 0;
    this.spaceship = null!;
    this.bullets = null!;
    this.asteroids = null!;
    this.cursors = null!;
    this.spaceKey = null!;
    this.pauseKey = null!;
    this.pauseOverlayText = null!;
    this.textRetro = null!;
    this.lives = null!;
    this.asteroidEvent = null!;
    this.physics.resume();
    this.anims.resumeAll();

    this.data.reset();
    this.data.set('score', this.score);
  }

  preload() {
    this.load.image('asteroid', 'assets/asteroid.png');
    this.load.image('ctrl_left', 'assets/ctrl_left.png');
    this.load.image('ctrl_right', 'assets/ctrl_right.png');
    this.load.image('ctrl_shot', 'assets/ctrl_shot.png');
    this.load.image('background', 'assets/background.jpg');
    this.load.image('guns', 'assets/guns.png');
    this.load.spritesheet('spaceship_sprite', 'assets/spaceship_sprite.png', {
        frameWidth: 68,
        frameHeight: 110,
      });
    
    this.load.spritesheet('explosion_sprite', 'assets/explosion.png', {
      frameWidth: 190,
      frameHeight: 190,
    });
    this.load.spritesheet('lives', 'assets/lives.png', {
      frameWidth: 138,
      frameHeight: 56,
    });
    this.load.image('knighthawks', 'assets/fonts/retro/knight3.png');

    // Sonidos
    this.load.audio('backgroundMusic', 'assets/sounds/music.mp3');
    this.load.audio('explosion', 'assets/sounds/explosion.mp3');
    this.load.audio('impactguns', 'assets/sounds/impactguns.mp3');
  }

  create() {
    //localStorage.removeItem('highScores');
    const { width, height } = this.cameras.main;

    // Fondo
    const background = this.add.image(width / 2, height / 2, 'background');
    background.setScale(
      Math.max(width / background.width, height / background.height)
    );
    background.setScrollFactor(0).setDepth(0);

    // Música de fondo
    const music = this.sound.add('backgroundMusic', {
      loop: true,
      volume: 0.5,
    });
    if (this.sound instanceof Phaser.Sound.WebAudioSoundManager) {
      this.sound.context.resume().then(() => {
        music.play();
      });
    }

    this.events.on('shutdown', this.shutdown, this);

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

    this.textRetro = this.add
      .bitmapText(20, 20, 'knighthawks', 'SCORE\n0', 20)
      .setDepth(3);

    // Animación de explosión
    this.anims.create({
      key: 'explosion',
      frames: this.anims.generateFrameNumbers('explosion_sprite', {
        start: 0,
        end: 4,
      }),
      frameRate: 30,
      repeat: 0,
      yoyo: true,
    });

    this.anims.create({
        key: 'fly',
        frames: this.anims.generateFrameNumbers('spaceship_sprite', {
          start: 0,    // primer frame
          end: 1       // último frame (ajústalo al número real de frames)
        }),
        frameRate: 8,   // fotogramas por segundo
        repeat: -1      // -1 significa “loop infinito”
      });

    // Nave
    this.spaceship = this.physics.add
    .sprite(width / 2, height - 130, 'spaceship_sprite')
    .setCollideWorldBounds(true)
    .setBounce(0)
    .setCollideWorldBounds(true).setBounce(0).setDepth(2);

    this.spaceship.play('fly');

    // Vidas
    this.lives = this.add.sprite(width - 86, 40, 'lives', 0).setDepth(3);

    // Controles táctiles
    const ctrl_left = this.add
      .image(38, height - 38, 'ctrl_left')
      .setInteractive()
      .setDepth(3);
    const ctrl_right = this.add
      .image(115, height - 38, 'ctrl_right')
      .setInteractive()
      .setDepth(3);
    const ctrl_shot = this.add
      .image(width - 40, height - 38, 'ctrl_shot')
      .setInteractive()
      .setDepth(3);

    ctrl_left.on('pointerdown', () => (this.movingLeft = true));
    ctrl_left.on('pointerup', () => (this.movingLeft = false));
    ctrl_left.on('pointerout', () => (this.movingLeft = false));

    ctrl_right.on('pointerdown', () => (this.movingRight = true));
    ctrl_right.on('pointerup', () => (this.movingRight = false));
    ctrl_right.on('pointerout', () => (this.movingRight = false));

    ctrl_shot.on('pointerdown', () => (this.shooting = true));
    ctrl_shot.on('pointerup', () => (this.shooting = false));
    ctrl_shot.on('pointerout', () => (this.shooting = false));

    // Controles de teclado
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
    } else {
      console.warn('Keyboard input is not available.');
    }
    if (this.input.keyboard) {
      this.spaceKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE
      );
      this.pauseKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.P
      );
    } else {
      console.warn('Keyboard input is not available.');
    }

    this.pauseOverlayText = this.add
      .bitmapText(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        'knighthawks',
        'PAUSA',
        50
      )
      .setOrigin(0.5)
      .setDepth(10)
      .setVisible(false);

    // Grupo de balas
    this.bullets = this.physics.add.group();

    // Grupo de asteroides
    this.asteroids = this.physics.add.group({
      classType: Asteroid,
      runChildUpdate: true,
    });

    // Generación de asteroides
    this.asteroidEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        const x = Phaser.Math.Between(0, width);
        const asteroid = this.asteroids.create(x, -80, 'asteroid') as Asteroid;

        const scale = Phaser.Math.FloatBetween(0.4, 0.8);
        asteroid.setScale(scale);

        const baseRadius = 80;
        const radius = baseRadius * scale;
        asteroid.setCircle(
          radius,
          (asteroid.width * scale) / 2 - radius,
          (asteroid.height * scale) / 2 - radius
        );

        asteroid.setVelocity(
          Phaser.Math.Between(-50, 50),
          Phaser.Math.Between(80, 200)
        );
        asteroid.setAngularVelocity(Phaser.Math.Between(-100, 100));
        asteroid.setBounce(1);
        asteroid.setCollideWorldBounds(false);
        asteroid.setDepth(1);
      },
    });

    // Colisiones
    this.physics.add.collider(this.asteroids, this.asteroids);

    // Colisiones entre asteroides y nave
    // -------------------------------------------------
    this.physics.add.overlap(
      this.spaceship,
      this.asteroids,
      (ship, asteroidObj) => {
        this.livesDead++;
        this.lives.setFrame(this.livesDead);
        this.spaceship.visible = false;
        // Desactivar controles
        this.controlsEnabled = false;

        // Sonido de explosión
        const explosionSound = this.sound.add('explosion');
        explosionSound.play();

        // Elimina marcador y texto del asteroide que impactó la nave
        const impacted = asteroidObj as Asteroid;
        impacted.marker?.destroy();
        impacted.impactText?.destroy();

        const spaceship = ship as Phaser.Physics.Arcade.Image;
        let explosion = this.add.sprite(
          spaceship.x,
          spaceship.y,
          'explosion_sprite'
        );
        explosion.play('explosion');
        explosion.setDepth(11);
        explosion.setScale(0.8);
        explosion.on('animationcomplete', () => {
          this.physics.pause();
          this.anims.pauseAll();
          explosion.destroy();
        });

        asteroidObj.destroy();

        const message = this.add
          .bitmapText(width / 2, height / 2, 'knighthawks', 'WARNING!', 30)
          .setOrigin(0.5)
          .setDepth(10)
          .setTint(0xe4faa7);
        message.setDropShadow(2, 2, 0x000000, 1);

        const messageLives = this.add
          .bitmapText(
            width / 2,
            height / 2 + 40,
            'knighthawks',
            'LIVES: ' + (3 - this.livesDead),
            30
          )
          .setOrigin(0.5)
          .setDepth(10)
          .setTint(0xe4faa7);

        // Al GAME OVER, reiniciar el juego
        if (this.livesDead > 2) {
          this.time.delayedCall(1000, () => {
            this.scene.manager.start('GameOverScene', {
              score: this.score,
            });
          });
        } else {
          this.time.delayedCall(3000, () => {
            // Eliminar marcas y textos de todos los asteroides
            this.asteroids.getChildren().forEach((ast) => {
              const a = ast as Asteroid;
              a.marker?.destroy();
              a.impactText?.destroy();
            });

            // Limpiar asteroides
            this.asteroids.clear(true, true);

            // Reset de nave
            this.spaceship.setPosition(width / 2, height - 130);
            this.physics.resume();
            this.anims.resumeAll();
            message.destroy();
            messageLives.destroy();
            // Reanudar controles
            this.controlsEnabled = true;
            this.spaceship.visible = true;
          });
        }
      }
    );

    // Colisiones entre balas y asteroides
    // -------------------------------------------------
    this.physics.add.overlap(
      this.bullets,
      this.asteroids,
      (bullet, asteroidObj) => {
        const asteroid = asteroidObj as Asteroid & {
          marker?: Phaser.GameObjects.Graphics;
          impactText?: Phaser.GameObjects.Text;
        };

        const bulletImpact = bullet as Phaser.GameObjects.Graphics;

        // Sonido de impacto
        const impactSound = this.sound.add('impactguns');
        impactSound.setVolume(0.3);
        impactSound.play();

        let explosion = this.add.sprite(
          bulletImpact.x,
          bulletImpact.y,
          'explosion_sprite'
        );
        explosion.play('explosion');
        explosion.setDepth(11);
        explosion.setScale(0.2);
        bullet.destroy();
        asteroid.impactsLeft--;

        // Aumentamos el marcador por impacto
        this.score += 10;

        const fadingText = this.add
          .text(asteroid.x, asteroid.y, '+10 pts', {
            font: '16px Arial',
            color: '#00ff00',
          })
          .setOrigin(0.5)
          .setDepth(10);

        // Animar para desvanecer el texto
        this.tweens.add({
          targets: fadingText,
          alpha: 0,
          duration: 2000,
          ease: 'Linear',
          onComplete: () => {
            fadingText.destroy();
          },
        });

        explosion.on('animationcomplete', () => {
          explosion.destroy();
        });

        // Si es el primer impacto, creamos marcador y texto
        if (!asteroid.marker) {
          const marker = this.add.graphics();
          marker.lineStyle(2, 0x00ff00, 1);
          marker.setDepth(10);
          asteroid.marker = marker;

          const impactText = this.add
            .text(0, 0, '', {
              font: '16px Arial',
              color: '#00ff00',
              padding: { x: 4, y: 2 },
            })
            .setOrigin(0.5)
            .setDepth(11);
          asteroid.impactText = impactText;
        }

        // Si impactos se agotan, eliminamos todo
        if (asteroid.impactsLeft <= 0) {
          // Sonido de explosión
          const explosionSound = this.sound.add('explosion');
          explosionSound.play();

          asteroid.marker?.destroy();
          asteroid.impactText?.destroy();
          asteroid.destroy();
          this.score += 100;

          let explosion = this.add.sprite(
            asteroid.x,
            asteroid.y,
            'explosion_sprite'
          );
          explosion.play('explosion');
          explosion.setDepth(11);
          explosion.setScale(0.8);

          explosion.on('animationcomplete', () => {
            explosion.destroy();
          });
        }
        this.textRetro.setText('SCORE\n' + this.score);
        this.data.set('score', this.score);
      }
    );

    // Eliminar objetos fuera del mundo
    this.physics.world.on('worldbounds', (body: Phaser.Physics.Arcade.Body) => {
      body.gameObject.destroy();
    });

    this.stepsPositionX = width / 12;
  }

  override update(time: number, delta: number) {
    if (!this.controlsEnabled) return;

    if (Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
      this.isPaused = !this.isPaused;

      if (this.isPaused) {
        this.physics.world.pause();
        this.anims.pauseAll();
        this.asteroidEvent.paused = true;
        this.pauseOverlayText.setVisible(true);
      } else {
        this.physics.world.resume();
        this.anims.resumeAll();
        this.asteroidEvent.paused = false;
        this.pauseOverlayText.setVisible(false);
      }
    }

    // Si está en pausa, no actualizar nada más
    if (this.isPaused) {
      return;
    }
    const speed = 900; // px/s
  

    const dist = (speed * delta) / 2000; // px a mover este frame

    if (this.cursors.left.isDown) {
      this.spaceship.x -= dist;
    } else if (this.cursors.right.isDown) {
      this.spaceship.x += dist;
    }

    if (
      (this.shooting || this.spaceKey.isDown) &&
      time > this.lastShotTime + this.shotCooldown
    ) {
      const bullet = this.bullets.create(
        this.spaceship.x,
        this.spaceship.y - 55,
        'guns'
      ) as Phaser.Physics.Arcade.Image;
      bullet.setVelocityY(-400);
      bullet.setCollideWorldBounds(false);
      this.lastShotTime = time;
    }

    this.asteroids.getChildren().forEach((asteroidObj) => {
      const asteroid = asteroidObj as Asteroid & {
        marker?: Phaser.GameObjects.Graphics;
        impactText?: Phaser.GameObjects.Text;
      };

      if (asteroid.marker) {
        const g = asteroid.marker;
        g.clear();

        const size = 15;
        const halfW = asteroid.displayWidth / 2;
        const halfH = asteroid.displayHeight / 2;
        const x = asteroid.x;
        const y = asteroid.y;

        let lineColor = 0x00ff00;

        // Si el asteroide está muy perjudicado, parpadeamos en rojo
        if (asteroid.impactsLeft < 3) {
          asteroid.impactText?.setColor('#ff0000');
          lineColor = 0xff0000;

          asteroid.setTint(0xff0000);

          if (!asteroid.blinkTween) {
            asteroid.blinkTween = this.tweens.add({
              targets: asteroid,
              alpha: { from: 1, to: 0.3 },
              duration: 300,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut',
            });
          }
        } else {
          asteroid.impactText?.setColor('#00ff00');
          lineColor = 0x00ff00;
          g.lineStyle(2, lineColor, 1);
        }

        // Esquinas (punto de mira)
        g.strokeLineShape(
          new Phaser.Geom.Line(
            x - halfW,
            y - halfH,
            x - halfW + size,
            y - halfH
          )
        );
        g.strokeLineShape(
          new Phaser.Geom.Line(
            x - halfW,
            y - halfH,
            x - halfW,
            y - halfH + size
          )
        );

        g.strokeLineShape(
          new Phaser.Geom.Line(
            x + halfW,
            y - halfH,
            x + halfW - size,
            y - halfH
          )
        );
        g.strokeLineShape(
          new Phaser.Geom.Line(
            x + halfW,
            y - halfH,
            x + halfW,
            y - halfH + size
          )
        );

        g.strokeLineShape(
          new Phaser.Geom.Line(
            x - halfW,
            y + halfH,
            x - halfW + size,
            y + halfH
          )
        );
        g.strokeLineShape(
          new Phaser.Geom.Line(
            x - halfW,
            y + halfH,
            x - halfW,
            y + halfH - size
          )
        );

        g.strokeLineShape(
          new Phaser.Geom.Line(
            x + halfW,
            y + halfH,
            x + halfW - size,
            y + halfH
          )
        );
        g.strokeLineShape(
          new Phaser.Geom.Line(
            x + halfW,
            y + halfH,
            x + halfW,
            y + halfH - size
          )
        );

        g.lineStyle(1, lineColor, 1);
        g.strokeLineShape(
          new Phaser.Geom.Line(x, y - halfH, x, y - halfH - 20)
        );
        g.strokeLineShape(
          new Phaser.Geom.Line(x, y - halfH - 20, x + 20, y - halfH - 20)
        );

        // Texto con impactos restantes
        if (asteroid.impactText) {
          asteroid.impactText.setPosition(x + 80, y - halfH - 20);
          asteroid.impactText.setText(
            '[Impacts:' + (5 - asteroid.impactsLeft) + '/5]'
          );
        }
      }
    });
  }

  shutdown() {
    this.input.keyboard?.removeAllListeners();
  }
}
