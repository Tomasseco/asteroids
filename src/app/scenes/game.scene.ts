import Phaser from "phaser";

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: "GameScene" });
    }
    
    preload() {

        //this.load.image("press_screen", "assets/touch_screen.png");
    }
    
    create() {
      // TODO: agregar fondo, nave, asteroides, etc.
        this.cameras.main.setBackgroundColor(0x000000);

    }
    }
