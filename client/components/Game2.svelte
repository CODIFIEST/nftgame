<!-- <script>
    import { onMount } from 'svelte';
    // import Phaser from 'phaser';
    
    let game;

    
    onMount(async () => {
      const Phaser = await import('phaser');
      const gameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        scene: {
          preload: preload,
          create: create,
          update: update,
        },
        physics: {
          default: 'arcade',
          arcade: {
            debug: false,
          },
        },
      };
    
      game = new Phaser.Game(gameConfig);
    });
    
    function preload() {
      this.load.image('invader', 'assets/invader.png');
      this.load.image('ship', 'assets/ship.png');
      this.load.image('bullet', 'assets/bullet.png');
    }
    
    function create() {
      this.ship = this.physics.add.sprite(400, 550, 'ship');
      this.ship.setCollideWorldBounds(true);
    
      this.invaders = this.physics.add.group({
        key: 'invader',
        repeat: 9,
        setXY: { x: 70, y: 50, stepX: 80 },
      });
    
      this.physics.add.collider(this.ship, this.invaders);
    
      this.bullets = this.physics.add.group({
        classType: Phaser.GameObjects.Image,
        defaultKey: 'bullet',
        maxSize: 30,
      });
    
      this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }
    
    function update() {
      if (this.input.keyboard.checkDown(this.spacebar, 250)) {
        let bullet = this.bullets.get();
    
        if (bullet) {
          bullet.fire(this.ship.x, this.ship.y);
        }
      }
    
      this.input.keyboard.on('keydown_LEFT', () => {
        this.ship.setVelocityX(-200);
      });
    
      this.input.keyboard.on('keydown_RIGHT', () => {
        this.ship.setVelocityX(200);
      });
    
      this.input.keyboard.on('keyup', () => {
        this.ship.setVelocityX(0);
      });
    }
    
    Phaser.GameObjects.Image.prototype.fire = function fire(x, y) {
      this.setPosition(x, y - 50);
      this.setActive(true);
      this.setVisible(true);
    
      this.setVelocityY(-500);
    };
    </script>
    
    <style>
      canvas {
        display: block;
      }
    </style> -->