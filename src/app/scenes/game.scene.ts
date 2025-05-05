import Phaser from "phaser";

export class GameScene extends Phaser.Scene {

    private spaceship!: Phaser.Physics.Arcade.Image;
    private stepsPositionX!: number;
    private movingLeft = false;
    private movingRight = false;
    private shooting = false;
    private lastShotTime = 0;
    private shotCooldown = 400; 
    private score = 0;    
    private livesDead = 0; 
    private bullets!: Phaser.Physics.Arcade.Group;
    private asteroids!: Phaser.Physics.Arcade.Group;
    private textScore!: Phaser.GameObjects.BitmapText;
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
       
        // Vamos a probar texto retro
        this.load.image('knighthawks', 'assets/fonts/retro/knight3.png');
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
        this.spaceship.setBounce(0); 
       

        // Configuración de texto retro
        const config = {
            image: 'knighthawks',
            width: 16,
            height: 18,
            chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ| 0123456789*#!@:.,\\?-+=^$£()\'',
            charsPerRow: 19,
            'spacing.x': 0,
            'spacing.y': 1,
            'offset.x': 0,
            'offset.y': 0,
            lineSpacing: 5
        };

        this.cache.bitmapFont.add('knighthawks', Phaser.GameObjects.RetroFont.Parse(this, config));

        this.textScore = this.add.bitmapText(20, 20, 'knighthawks', 'SCORE\n'+this.score, 20);


        class Asteroid extends Phaser.Physics.Arcade.Image {
            impactsLeft: number = 5;
        }

         // Crear grupo de asteroides
         this.asteroids = this.physics.add.group({
            classType: Asteroid,
            runChildUpdate: true,
            bounceX: 1,
            bounceY: 1,
            collideWorldBounds: false,
        });

        // Generar asteroides cada cierto tiempo
        this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                const x = Phaser.Math.Between(0, this.cameras.main.width);
                const asteroid = this.asteroids.create(x, -80, "asteroid") as Asteroid;
                asteroid.impactsLeft= 5; 
                // Escala aleatoria (tamaño)
                const scale = Phaser.Math.FloatBetween(0.4, 0.8);
                asteroid.setScale(scale);
                
                const baseRadius = 80; 
                const radius = baseRadius * scale;
                
                asteroid.setCircle(
                  radius,
                  asteroid.width * scale / 2 - radius,
                  asteroid.height * scale / 2 - radius
                );

                // Movimiento
                asteroid.setVelocity(
                    Phaser.Math.Between(-40, 40),
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
        // Colisión entre asteroides y nave
        this.physics.add.overlap(this.spaceship, this.asteroids, (ship, asteroid) => {
    
            this.livesDead++; 
            lives.setFrame(this.livesDead); 
            asteroid.destroy(); 
           
            
            // Detener la animación de todos los objetos animados
            this.anims.pauseAll();

            // También puedes detener tweens activos si los hay
            this.tweens.killAll();
            this.physics.pause();

        // 3. Mostrar mensaje
        const gameOverText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            "¡Has sido destruido!",
            {
                fontSize: "30px",
                color: "#ff0000",
                fontStyle: "bold",
                backgroundColor: "#00000033",
                padding: { x: 20, y: 10 },
                align: "center",
        
            }
        ).setOrigin(0.5);
    
        if (this.livesDead > 3) {
            this.scene.start("GameOverScene");
        } else
        this.time.delayedCall(5000, () => {
            
        gameOverText.destroy();
    
        // Eliminar todos los asteroides
        this.asteroids.clear(true, true);
        // Reanudar físicas y animaciones
        this.physics.resume();
        this.anims.resumeAll();
    
        // Posicionar la nave nuevamente en el centro
        this.spaceship.setPosition(this.cameras.main.centerX, this.cameras.main.displayHeight - 130);
    
        
        });
        });

        // Grupo de balas
        this.bullets = this.physics.add.group();

        this.physics.add.collider(this.bullets, this.asteroids, (bullet, asteroid) => {
            this.score += 10;
            bullet.destroy(); 
            asteroid.destroy(); 
           this.textScore.setText('SCORE\n'+this.score)
        });


        this.stepsPositionX = canvasWidth / 30;

        // ------------------ Controles Móvil ------------------

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

        // ------------------ Controles PC ------------------
       
       
        if (this.input && this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        }
    
       
        if (this.input && this.input.keyboard) {
            this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        }
        
        // Eliminar objetos que se salen de la pantalla
        this.physics.world.on('worldbounds', (body: Phaser.Physics.Arcade.Body) => {
            body.gameObject.destroy();
        });

        const lives = this.add.sprite(canvasWidth - 86, 40, "lives", 0);
        
        // Profundidad de los objetos
        background.setDepth(0);
        this.asteroids.setDepth(1); 
        this.spaceship.setDepth(2); 
        ctrl_left.setDepth(3);
        ctrl_right.setDepth(3);
        ctrl_shot.setDepth(3);
        lives.setDepth(3);

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

        if (this.movingLeft || this.cursors?.left.isDown) {
            this.spaceship.x -= moveStep;
        }

        if (this.movingRight || this.cursors?.right.isDown) {
            this.spaceship.x += moveStep;
        }

        if (this.shooting && time > this.lastShotTime + this.shotCooldown || this.spaceKey?.isDown && time > this.lastShotTime + this.shotCooldown) {
            const bullet = this.bullets.create(this.spaceship.x, this.spaceship.y-55, "guns") as Phaser.Physics.Arcade.Image;
            bullet.setVelocityY(-400);
            bullet.setCollideWorldBounds(false);
            
            this.lastShotTime = time;
        }
        
    }
}
