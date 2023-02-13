"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const cors_1 = __importDefault(require("cors"));
const validateUserInput_1 = __importDefault(require("./validateUserInput"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.get("/games", (req, res) => {
    console.log('game time');
    const games = fs_1.default.readFileSync('./videogames.json');
    res.send(games);
});
app.post("/games", (req, res) => {
    const games = JSON.parse(fs_1.default.readFileSync('./videogames.json'));
    const name = req.body.name;
    const platform = req.body.platform;
    const releaseYear = req.body.releaseYear;
    const genre = req.body.genre;
    const ESRBrating = req.body.ESRBrating;
    const goodGame = req.body.goodGame;
    try {
        (0, validateUserInput_1.default)(name, platform, releaseYear, genre, ESRBrating, goodGame);
    }
    catch (err) {
        res.status(404).send({
            error: err.message
        });
        return;
    }
    const game = {
        name: name,
        platform: platform,
        releaseYear: releaseYear,
        genre: genre,
        ESRBrating: ESRBrating,
        goodGame: goodGame
    };
    games.push(game);
    fs_1.default.writeFileSync("./videogames.json", JSON.stringify(games));
    res.send(games);
});
app.listen(3000);
