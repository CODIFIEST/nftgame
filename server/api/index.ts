import express from "express"
// import fs from "fs"
import cors from "cors"
import validateUserInput from "../validateUserInput";
// import { PlayerScore } from "../../client/src/domain/playerscore";
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore,deleteDoc, setDoc, doc, getDoc, getDocs, collection, addDoc } from "firebase/firestore";
import { HighScore } from "../domain/highscore";
import * as dotenv from 'dotenv';
dotenv.config();
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: process.env.apiKey,
    authDomain: process.env.authDomain,
    projectId: process.env.projectId,
    storageBucket: process.env.storageBucket,
    messagingSenderId: process.env.messagingSenderId,
    appId: process.env.appId
  };
  
  // Initialize Firebase
const dbApp = initializeApp(firebaseConfig);
const database = getFirestore(dbApp)

const app = express();
app.use(express.json());
app.use(cors());

app.get("/scores", async (req, res) => {
    let cleanData:HighScore[]=[];
    console.log('getting scores')
   const allScores = await getDocs(collection(database, "highscores")) 
   allScores.forEach((item)=>{
    let score = item.data() as any as HighScore
    score.id = item.id
cleanData.push(score)
   })
    // const scores = fs.readFileSync('./highscores.json')
    res.send(cleanData)
});

app.post("/scores", async (req, res) => {
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
    const player1score:HighScore = {
        token: token,
        imageURL:imageURL,
        playerName:playerName,
        score:score,
        id:""
    }
    const newScores = await addDoc(collection(database, "highscores"), player1score)
    // newScores.push(player1score);
    // fs.writeFileSync("./highscores.json", JSON.stringify(scores))
    console.log(`new score saved ${newScores}`)
   
    res.send(newScores)
})
app.listen(3888)