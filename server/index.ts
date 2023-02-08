import express from "express"
import fs from "fs"
import cors from "cors"
import validateUserInput from "./validateUserInput";
import { PlayerScore } from "./domain/playerscore";

const app = express();
app.use(express.json());
app.use(cors());

app.get("/scores", (req, res) => {
    console.log('getting scores')
    const scores = fs.readFileSync('./highscores.json')
    res.send(scores)
});

app.post("/scores", (req, res) => {
    const scores: PlayerScore[] = JSON.parse(fs.readFileSync('./highscores.json') as any as string)
    const token = req.body.token;
    const imageURL = req.body.imageURL;
    const playerName = req.body.playerName;
    const score = req.body.score;
    // try {
    //     validateUserInput(name, platform, releaseYear, genre, ESRBrating, goodGame)
    // } catch (err) {
    //     res.status(404).send({
    //         error: err.message
    //     });
    //     return;
    // }
    const player1score: PlayerScore = {
        token: token,
        imageURL:imageURL,
        playerName:playerName,
        score:score
    }
    scores.push(player1score);
    fs.writeFileSync("./highscores.json", JSON.stringify(scores))
    res.send(scores)
})
app.listen(3888)