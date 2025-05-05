import Phaser from "phaser";

export class GameScene extends Phaser.Scene {

    private spaceship!: Phaser.Physics.Arcade.Image;
    private bullets!: Phaser.Physics.Arcade.Group;
    private asteroids!: Phaser.Physics.Arcade.Group;

    private stepsPositionX!: number;
    private movingLeft = false;
    private movingRight = false;
    private shooting = false;
    private lastShotTime = 0;
    private shotCooldown = 400;

    private score = 0;
    private livesDead = 0;
    private textScore!: Phaser.GameObjects.BitmapText;
    private lives!: Phaser.GameObjects.Sprite;

    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private spaceKey!: Phaser.Input.Keyboard.Key;

    constructor() {
        super({ key: "GameScene" });
    }

    preload() {
        this.load.image("asteroid", "assets/asteroid.png");
        this.load.image("ctrl_left", "assets/ctrl_left.png");
        this.load.image("ctrl_right", "assets/ctrl_right.png");
        this.load.image("ctrl_shot", "assets/ctrl_shot.png");
        this.load.image("background", "assets/background.jpg");
        this.load.image("spaceship", "assets/spaceship.png");
        this.load.image("guns", "assets/guns.png");
        this.load.spritesheet("lives", "assets/lives.png", {
            frameWidth: 138,
            frameHeight: 56
        });
        this.load.image("knighthawks", "assets/fonts/retro/knight3.png");
    }

    create() {
        const { width, height } = this.cameras.main;

        // Fondo
        const background = this.add.image(width / 2, height / 2, "background");
        background.setScale(Math.max(width / background.width, height / background.height));
        background.setScrollFactor(0).setDepth(0);

        // Fuente bitmap
        const fontConfig = {
            image: 'knighthawks',
            width: 16,
            height: 18,
            chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ| 0123456789*#!@:.,\\?-+=^$£()\'',
            charsPerRow: 19,
            "offset.x": 0,
            "offset.y": 0,
            "spacing.x": 0,
            "spacing.y": 0,
            lineSpacing: 0
        };
        this.cache.bitmapFont.add('knighthawks', Phaser.GameObjects.RetroFont.Parse(this, fontConfig));

        this.textScore = this.add.bitmapText(20, 20, 'knighthawks', 'SCORE\n0', 20).setDepth(3);

        // Nave
        this.spaceship = this.physics.add.image(width / 2, height - 130, "spaceship");
        this.spaceship.setCollideWorldBounds(true).setBounce(0).setDepth(2);

        // Vidas
        this.lives = this.add.sprite(width - 86, 40, "lives", 0).setDepth(3);

        // Controles táctiles
        const ctrl_left = this.add.image(38, height - 38, "ctrl_left").setInteractive().setDepth(3);
        const ctrl_right = this.add.image(115, height - 38, "ctrl_right").setInteractive().setDepth(3);
        const ctrl_shot = this.add.image(width - 40, height - 38, "ctrl_shot").setInteractive().setDepth(3);

        ctrl_left.on("pointerdown", () => this.movingLeft = true);
        ctrl_left.on("pointerup", () => this.movingLeft = false);
        ctrl_left.on("pointerout", () => this.movingLeft = false);

        ctrl_right.on("pointerdown", () => this.movingRight = true);
        ctrl_right.on("pointerup", () => this.movingRight = false);
        ctrl_right.on("pointerout", () => this.movingRight = false);

        ctrl_shot.on("pointerdown", () => this.shooting = true);
        ctrl_shot.on("pointerup", () => this.shooting = false);
        ctrl_shot.on("pointerout", () => this.shooting = false);

        // Controles de teclado
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        } else {
            console.warn("Keyboard input is not available.");
        }
        if (this.input.keyboard) {
            this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        } else {
            console.warn("Keyboard input is not available.");
        }

        // Grupo de balas
        this.bullets = this.physics.add.group();

        // Clase extendida para asteroides
        class Asteroid extends Phaser.Physics.Arcade.Image {
            impactsLeft: number = 5;
        }

        // Grupo de asteroides
        this.asteroids = this.physics.add.group({ classType: Asteroid, runChildUpdate: true });

        // Generación de asteroides
        this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                const x = Phaser.Math.Between(0, width);
                const asteroid = this.asteroids.create(x, -80, "asteroid") as Asteroid;

                const scale = Phaser.Math.FloatBetween(0.4, 0.8);
                asteroid.setScale(scale);
                asteroid.impactsLeft = 5;

                const baseRadius = 80;
                const radius = baseRadius * scale;
                asteroid.setCircle(
                    radius,
                    asteroid.width * scale / 2 - radius,
                    asteroid.height * scale / 2 - radius
                );

                asteroid.setVelocity(Phaser.Math.Between(-40, 40), Phaser.Math.Between(100, 200));
                asteroid.setAngularVelocity(Phaser.Math.Between(-100, 100));
                asteroid.setBounce(1);
                asteroid.setCollideWorldBounds(false);
                asteroid.setDepth(1);
            }
        });

        // Colisiones
        this.physics.add.collider(this.asteroids, this.asteroids);

        this.physics.add.overlap(this.spaceship, this.asteroids, (ship, asteroidObj) => {
            const asteroid = asteroidObj as Asteroid;
            this.livesDead++;
            this.lives.setFrame(this.livesDead);
            asteroid.destroy();

            this.physics.pause();
            this.anims.pauseAll();

            const msg = this.add.text(width / 2, height / 2, "¡Has sido destruido!", {
                fontSize: "30px",
                color: "#ff0000",
                fontStyle: "bold",
                backgroundColor: "#00000066",
                padding: { x: 20, y: 10 }
            }).setOrigin(0.5).setDepth(10);

            if (this.livesDead > 3) {
                this.time.delayedCall(2000, () => this.scene.start("GameOverScene"));
            } else {
                this.time.delayedCall(5000, () => {
                    msg.destroy();
                    this.asteroids.clear(true, true);
                    this.spaceship.setPosition(width / 2, height - 130);
                    this.physics.resume();
                    this.anims.resumeAll();
                });
            }
        });

        this.physics.add.overlap(this.bullets, this.asteroids, (bullet, asteroidObj) => {
            const asteroid = asteroidObj as Asteroid;
            bullet.destroy();
            asteroid.impactsLeft--;

            if (asteroid.impactsLeft <= 0) {
                asteroid.destroy();
                this.score += 10;
                this.textScore.setText(`SCORE\n${this.score}`);
            }
        });

        // Eliminar objetos fuera del mundo
        this.physics.world.on('worldbounds', (body: Phaser.Physics.Arcade.Body) => {
            body.gameObject.destroy();
        });

        this.stepsPositionX = width / 12;
    }

    override update(time: number) {
        const moveStep = this.stepsPositionX / 5;

        if (this.movingLeft || this.cursors.left.isDown) {
            this.spaceship.x -= moveStep;
        } else if (this.movingRight || this.cursors.right.isDown) {
            this.spaceship.x += moveStep;
        }

        if ((this.shooting || this.spaceKey.isDown) && time > this.lastShotTime + this.shotCooldown) {
            const bullet = this.bullets.create(this.spaceship.x, this.spaceship.y - 55, "guns") as Phaser.Physics.Arcade.Image;
            bullet.setVelocityY(-400);
            bullet.setCollideWorldBounds(false);
            this.lastShotTime = time;
        }
    }
}
