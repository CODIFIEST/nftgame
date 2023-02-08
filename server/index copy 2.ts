import express from "express"
import fs from "fs"
import type { Game } from "./domain/game"
import cors from "cors"
import validateUserInput from "./validateUserInput";

const app = express();
app.use(express.json());
app.use(cors());

app.get("/games", (req, res) => {
    console.log('game time')
    const games = fs.readFileSync('./videogames.json')
    res.send(games)
});

app.post("/games", (req, res) => {
    const games: Game[] = JSON.parse(fs.readFileSync('./videogames.json') as any as string)
    const name = req.body.name;
    const platform = req.body.platform;
    const releaseYear = req.body.releaseYear;
    const genre = req.body.genre;
    const ESRBrating = req.body.ESRBrating;
    const goodGame = req.body.goodGame;
    try {
        validateUserInput(name, platform, releaseYear, genre, ESRBrating, goodGame)
    } catch (err) {
        res.status(404).send({
            error: err.message
        });
        return;
    }
    const game: Game = {
        name: name,
        platform: platform,
        releaseYear: releaseYear,
        genre: genre,
        ESRBrating: ESRBrating,
        goodGame: goodGame
    }
    games.push(game);
    fs.writeFileSync("./videogames.json", JSON.stringify(games))
    res.send(games)
})
app.listen(3000)