import Phaser from "phaser";

export class LogoScene extends Phaser.Scene {
    constructor() {
        super({ key: "LogoScene" });
    }
    
    preload() {
        this.load.image("logo", "assets/logo.png");
        this.load.image("press_screen", "assets/touch_screen.png");
    }
    
    create() {
        const logo = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, "logo");
        const msg_touch_screen = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, "press_screen");
        logo.setOrigin(0.5, 0.8);
        msg_touch_screen.setOrigin(0.5, -6);
        logo.setScale(0.9);
    
        this.tweens.add({
        targets: msg_touch_screen,
        alpha: { from: 1, to: 0.5 },
        duration: 500,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
        });
    
        this.input.on("pointerdown", () => {
        this.scene.start("GameScene");
        });
    }
    }
