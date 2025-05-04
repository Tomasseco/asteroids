import { Component, OnInit } from '@angular/core';
import Phaser from 'phaser';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
})
export class GameComponent  implements OnInit {

  constructor() { }

  ngOnInit() {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: innerWidth,
      height: innerHeight,
      parent: 'game-container',
      scene: [],
      physics: {
        default: 'arcade',
        arcade: {
          //gravity: { y: 0 , x: 0},
          debug: false
        },
      },
    };
    new Phaser.Game(config);
  }
}