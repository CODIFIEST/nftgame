"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const game_1 = require("./domain/game");
function validateUserInput(name, platform, releaseYear, genre, ESRBrating, goodGame) {
    console.log(goodGame);
    const thisYear = new Date().getFullYear();
    console.log(`genres  ${game_1.genres}`);
    if (name.length > 15) {
        throw Error(`name is too long. max length is 15. received ${name.length}`);
    }
    if (!game_1.platforms.find(e => e === platform.toLowerCase())) {
        throw Error(`platform is not a valid platform from the list ${game_1.platforms}`);
    }
    if (releaseYear < 1980 || releaseYear > (thisYear + 1)) {
        throw Error(`year must be between 1980 and next year, ${(thisYear + 1)}, received ${releaseYear}`);
    }
    if (!game_1.genres.find(e => e === genre.toLowerCase())) {
        throw Error(`genre is not valid from the list ${game_1.genres}, recieved ${genre}`);
    }
    if (!game_1.ESRBratings.find(e => e === ESRBrating.toUpperCase())) {
        throw Error(`ESRB rating is not valid from the list: ${game_1.ESRBratings}, received ${ESRBrating}`);
    }
    if (!(typeof goodGame == "boolean")) {
        throw Error(`good Game must be true or false. received ${goodGame}`);
    }
}
exports.default = validateUserInput;
