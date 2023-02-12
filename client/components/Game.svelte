<script lang="ts">
    import axios from "axios";
    import player1 from "../src/stores/player1";
    import fs from "fs";
    import * as Phaser from "phaser";
    import type { PlayerScore } from "../src/domain/playerscore";
    import { playerImage } from "../src/stores/playerImage";
    import HighScoreList from "./HighScoreList.svelte";
    import highscores from "../src/stores/highscores";
    import player1nft from "../src/stores/player1nft";
    import playerName from "../src/stores/playername";
    playerImage.set("./sadcanto.png");  // use this if we don't want to use the NFT image
    const imgURL = $playerImage;
    async function getHighScores() {
        const result = await axios.get("http://localhost:3888/scores");
        return result.data;
    }

    let scores: PlayerScore[] = getHighScores() as any as PlayerScore[];

    console.log(scores);
    var config = {
        type: Phaser.AUTO,
        width: 1400,
        height: 1000,
        physics: {
            default: "arcade",
            arcade: {
                gravity: { y: 300 },
                debug: false,
            },
        },
        scene: {
            preload: preload,
            create: create,
            update: update,
        },
    };

    var player;
    // var imgURL;
    var player1name;
    var platforms;
    var cursors;
    var stars;
    var score = 0;
    var scoreText;
    var highScoreText;
    var bombs;
    let level = 1;
    var displayLevel;
    var game = new Phaser.Game(config);

    function preload() {
        // console.log(`preload `+ {playerImage})
        this.load.image("sky", "./newsky.png");
        this.load.image("ground", "./platform.png");
        this.load.image("star", "./star.png");
        this.load.image("bomb", "./bomb.png");
        this.load.image("dude", imgURL, {
            frameWidth: 32,
            frameHeight: 48,
        });
        // this.load.Image("dude", $playerImage);
        // { frameWidth: 32, frameHeight: 48 }
        // console.log(`${$playerImage}playerImage`);
        // console.log($playerImage)
    }

    function create() {
        // console.log(`create `);
        // // console.log({playerImage})
        // imgURL = $playerImage;
        this.add.image(700, 500, "sky").setScale(1);

        platforms = this.physics.add.staticGroup();

        platforms.create(700, 1050, "ground").setScale(4).refreshBody();

        platforms.create(50, 700, "ground");
        platforms.create(900, 700, "ground");
        platforms.create(750, 420, "ground");
        player1name = this.add.text(16, 4, `Player1: ${$playerName}`,{ fontSize: "32px"});
        displayLevel = this.add.text(16,36, `Level: ${level} of 10`, { fontSize: "32px"});
        scoreText = this.add.text(520, 4, "score: 0", {
            fontSize: "32px",
            // fill: "#000",
        });
        highScoreText = this.add.text(520, 36, `High score: ${$highscores[0].score}`, {
            fontSize: "32px",
            // fill: "#000",
        });

        // this.load.Image("dude", imgURL);
        player = this.physics.add.sprite(100, 450, "dude");

        player.setBounce(0.2);
        player.setCollideWorldBounds(true);

        stars = this.physics.add.group({
            key: "star",
            repeat: 11,
            setXY: { x: 12, y: 0, stepX: 70 },
        });

        stars.children.iterate((child) => {
            child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        });
// this part blanked out for anims 
        // this.anims.create({
        //     key: "left",
        //     frames: this.anims.generateFrameNumbers("dude", {
        //         start: 0,
        //         end: 3,
        //     }),
        //     frameRate: 10,
        //     repeat: -1,
        // });

        // this.anims.create({
        //     key: "turn",
        //     frames: [
        //         {
        //             key: "dude",
        //             frame: 4,
        //         },
        //     ],
        //     frameRate: 20,
        // });

        // this.anims.create({
        //     key: "right",
        //     frames: this.anims.generateFrameNumbers("dude", {
        //         start: 5,
        //         end: 8,
        //     }),
        //     frameRate: 10,
        //     repeat: -1,
        // });
        // player.body.setGravityY(400); this did not override default gravity
        // this.physics.add.collider(player, platforms);
        cursors = this.input.keyboard.createCursorKeys();
        bombs = this.physics.add.group();
        this.physics.add.collider(bombs, platforms);
        this.physics.add.collider(player, bombs, hitBomb, null, this);

        this.physics.add.collider(stars, platforms);
        this.physics.add.collider(player, platforms);
        this.physics.add.overlap(player, stars, collectStar, null, this);
    }

    function hitBomb(player, bomb) {
        console.log(score);
        this.physics.pause();
        player.setTint(0xff0000);
        player.anims.play("turn");
        // let currentScore: PlayerScore = {
        //     token: $player1.token,
        //     imageURL: $player1.imageURL,
        //     score: score,
        //     playerName: $player1.playerName,
        // };
        // scores.push(currentScore);
        async function updateScores() {
            const result = await axios.post("http://localhost:3888/scores", {
                token: $player1nft.tokenAddress,
                imageURL: $player1nft.imageURL,
                score: score,
                playerName: $playerName,
            });
        }
        updateScores();

        // console.log(currentScore);
        console.log(scores);
        if (score > $highscores[0].score) {
            console.log("High score!");
            console.log(score, " noice.");

            //insert to the top of the array and say yay!
        } else {
            console.log("Nope");
            console.log($highscores);
            //push to the end then sort or not lol
        }

        let gameOver = true;
        //do a modal for game restart here ##TODO
        setTimeout(() => {
            location.reload();
        }, 6000);
     

    }

    function collectStar(player, star) {
        star.disableBody(true, true);

        score += 10;
        scoreText.setText("Score: " + score);
        if (score > $highscores[0].score){
        highScoreText.setText("High Score: " + score);
        }
        if (stars.countActive(true) === 0) {
            level ++;
            displayLevel.setText(`Level: ${level} of 10`)
            stars.children.iterate((child) => {
                child.enableBody(true, child.x, 0, true, true);
            });
            var x =
                player.x < 400
                    ? Phaser.Math.Between(400, 800)
                    : Phaser.Math.Between(0, 400);
            var bomb = bombs.create(x, 16, "bomb");
            bomb.setBounce(1);
            bomb.setCollideWorldBounds(true);
            bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
        }
    }

    function update() {
        // console.log(`update ${$playerImage}`);
        if (cursors.left.isDown) {
            player.setVelocityX(-160);
            player.anims.play("left", true);
        } else if (cursors.right.isDown) {
            player.setVelocityX(160);
            player.anims.play("right", true);
        } else {
            player.setVelocityX(0);
            player.anims.play("turn");
        }
        if (cursors.up.isDown && player.body.touching.down) {
            player.setVelocityY(-430);
        }
    }
</script>

<HighScoreList />
