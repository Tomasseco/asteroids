import Phaser from "phaser";

export class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: "GameOverScene" });
    }
    
    init(passedData: { score: number }) {
        this.data.set('score', passedData.score);
    }

    preload() {
        this.load.image("game_over", "assets/gameover.png");
        this.load.image("background", "assets/background.png");
    }
    
    create() {
        const { width, height } = this.cameras.main;

        // Fondo
        const background = this.add.image(width / 2, height / 2, "background");
        background
            .setScale(Math.max(width / background.width, height / background.height))
            .setScrollFactor(0).setDepth(0);

        // Imagen de Game Over
        const game_over = this.add.image(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 20,
            "game_over"
        );
        game_over.setOrigin(0.5, 0.5).setScale(0.9);

        // Obtenemos la puntuación
        const score = this.data.get("score") as number;

        // Después de 3 segundos, arrancamos HighScoreScene
        this.time.delayedCall(
            3000,
            () => {
                this.scene.start("HighScoreScene", { score: score });
            },
            [],
            this
        );
    }
}
