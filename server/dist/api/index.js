"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// import fs from "fs"
const cors_1 = __importDefault(require("cors"));
// import { PlayerScore } from "../../client/src/domain/playerscore";
// Import the functions you need from the SDKs you need
const app_1 = require("firebase/app");
const firestore_1 = require("firebase/firestore");
// import * as dotenv from 'dotenv';
// dotenv.config();
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
// Your web app's Firebase configuration
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDhHjhc56740EXC5JokTL1Q69MP1JV1qp4",
    authDomain: "day27-f9d4f.firebaseapp.com",
    projectId: "day27-f9d4f",
    storageBucket: "day27-f9d4f.appspot.com",
    messagingSenderId: "58144372448",
    appId: "1:58144372448:web:4ce180b8f52043df26c285"
};
// Initialize Firebase
const dbApp = (0, app_1.initializeApp)(firebaseConfig);
const database = (0, firestore_1.getFirestore)(dbApp);
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.get("/scores", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let cleanData = [];
    console.log('getting scores');
    const allScores = yield (0, firestore_1.getDocs)((0, firestore_1.collection)(database, "highscores"));
    allScores.forEach((item) => {
        let score = item.data();
        score.id = item.id;
        cleanData.push(score);
    });
    // const scores = fs.readFileSync('./highscores.json')
    res.send(cleanData);
}));
app.post("/scores", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // const scores: PlayerScore[] = JSON.parse(fs.readFileSync('./highscores.json') as any as string)
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
    const player1score = {
        token: token,
        imageURL: imageURL,
        playerName: playerName,
        score: score,
        id: ""
    };
    const newScores = yield (0, firestore_1.addDoc)((0, firestore_1.collection)(database, "highscores"), player1score);
    // newScores.push(player1score);
    // fs.writeFileSync("./highscores.json", JSON.stringify(scores))
    res.send(newScores);
}));
app.listen(3888);
