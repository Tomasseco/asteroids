import Phaser from "phaser";

export class GameScene extends Phaser.Scene {

    private spaceship!: Phaser.Physics.Arcade.Image;
    private stepsPositionX!: number;
    private movingLeft = false;
    private movingRight = false;
    private shooting = false;
    private lastShotTime = 0;
    private shotCooldown = 200; 
    private bullets!: Phaser.Physics.Arcade.Group;
    private asteroids!: Phaser.Physics.Arcade.Group;

    constructor() {
        super({ key: "GameScene" });
    }

    preload() {
        this.load.image("ctrl_left", "assets/ctrl_left.png");
        this.load.image("ctrl_right", "assets/ctrl_right.png");
        this.load.image("ctrl_shot", "assets/ctrl_shot.png");
        this.load.image("background", "assets/background.jpg");
        this.load.image("spaceship", "assets/spaceship.png");
        this.load.image("guns", "assets/guns.png");
        this.load.image("asteroid", "assets/asteroid.png");
    }

    create() {
        this.cameras.main.setBackgroundColor(0x000000);
        const background = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, "background");
        const canvasWidth = this.cameras.main.width;
        const canvasHeight = this.cameras.main.height;
        const scaleX = canvasWidth / background.width;
        const scaleY = canvasHeight / background.height;
        background.setScale(Math.max(scaleX, scaleY));
        background.setScrollFactor(0);

        const ctrl_left = this.add.image(38, canvasHeight - 38, "ctrl_left").setInteractive();
        const ctrl_right = this.add.image(115, canvasHeight - 38, "ctrl_right").setInteractive();
        const ctrl_shot = this.add.image(canvasWidth - 40, canvasHeight - 38, "ctrl_shot").setInteractive();

        this.spaceship = this.physics.add.image(this.cameras.main.centerX, canvasHeight - 130, "spaceship");
        this.spaceship.setCollideWorldBounds(true);

        this.stepsPositionX = canvasWidth / 12;

        // Grupo de balas
        this.bullets = this.physics.add.group();

        // Movimiento a la izquierda
        ctrl_left.on("pointerdown", () => {
            this.movingLeft = true;
        });
        ctrl_left.on("pointerup", () => {
            this.movingLeft = false;
        });
        ctrl_left.on("pointerout", () => {
            this.movingLeft = false;
        });

        // Movimiento a la derecha
        ctrl_right.on("pointerdown", () => {
            this.movingRight = true;
        });
        ctrl_right.on("pointerup", () => {
            this.movingRight = false;
        });
        ctrl_right.on("pointerout", () => {
            this.movingRight = false;
        });

        // Disparo
        ctrl_shot.on("pointerdown", () => {
            this.shooting = true;
        });
        ctrl_shot.on("pointerup", () => {
            this.shooting = false;
        });
        ctrl_shot.on("pointerout", () => {
            this.shooting = false;
        });

        // Eliminar balas que salen de pantalla
        this.physics.world.on('worldbounds', (body: Phaser.Physics.Arcade.Body) => {
            body.gameObject.destroy();
        });

        // Crear grupo de asteroides
        this.asteroids = this.physics.add.group({
            bounceX: 1,
            bounceY: 1,
            collideWorldBounds: false
        });

        // Generar asteroides cada cierto tiempo
        this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                const x = Phaser.Math.Between(0, this.cameras.main.width);
                const asteroid = this.asteroids.create(x, 0, "asteroid") as Phaser.Physics.Arcade.Image;
        
                // Escala aleatoria (tamaño)
                const scale = Phaser.Math.FloatBetween(0.8, 1.2);
                asteroid.setScale(scale);
        
                // Movimiento
                asteroid.setVelocity(
                    Phaser.Math.Between(-50, 50),
                    Phaser.Math.Between(100, 200)
                );
        
                // Rotación
                asteroid.setAngularVelocity(Phaser.Math.Between(-100, 100));
        
                // Rebote
                asteroid.setBounce(1);
                asteroid.setCollideWorldBounds(false);
            }
        });

        // Hacer que los asteroides colisionen entre sí
        this.physics.add.collider(this.asteroids, this.asteroids);
        this.physics.add.overlap(this.spaceship, this.asteroids, () => {
            // TODO: Falta manejar las colisiones de asteroide con la nave y restar vidas.
            console.log("Colisión entre la nave y un asteroide");
           
        });
    }

    override update(time: number, delta: number) {
        const moveStep = this.stepsPositionX / 5;

        if (this.movingLeft) {
            this.spaceship.x -= moveStep;
        }

        if (this.movingRight) {
            this.spaceship.x += moveStep;
        }

        if (this.shooting && time > this.lastShotTime + this.shotCooldown) {
            const bullet = this.bullets.create(this.spaceship.x, this.spaceship.y-55, "guns") as Phaser.Physics.Arcade.Image;
            bullet.setVelocityY(-400);
            bullet.setCollideWorldBounds(false);
            
            this.lastShotTime = time;
        }
    }
}
