import cors from "cors";
import * as dotenv from "dotenv";
import express from "express";
import { initializeApp } from "firebase/app";
import { addDoc, collection, getDocs, getFirestore } from "firebase/firestore";
import { getCurrentSeason } from "./season";
import { HighScore } from "../domain/highscore";

dotenv.config();

const firebaseConfig = {
    apiKey: process.env.apiKey,
    authDomain: process.env.authDomain,
    projectId: process.env.projectId,
    storageBucket: process.env.storageBucket,
    messagingSenderId: process.env.messagingSenderId,
    appId: process.env.appId,
};

const dbApp = initializeApp(firebaseConfig);
const database = getFirestore(dbApp);
const SCORE_COLLECTION = "23mayhighscores";

function normalizeScoreRecord(raw: unknown, id: string): HighScore | null {
    const data = (raw ?? {}) as Partial<HighScore>;
    if (typeof data.score !== "number" || Number.isNaN(data.score)) {
        return null;
    }
    return {
        token: String(data.token ?? ""),
        imageURL: String(data.imageURL ?? ""),
        playerName: String(data.playerName ?? "anonymous"),
        score: Math.max(0, Math.floor(data.score)),
        season: String(data.season ?? getCurrentSeason()),
        id,
    };
}

function parseIncomingScore(body: unknown): Omit<HighScore, "id"> {
    const payload = (body ?? {}) as Partial<HighScore>;
    const scoreValue = Number(payload.score ?? 0);
    if (!Number.isFinite(scoreValue) || scoreValue < 0) {
        throw new Error("Score must be a non-negative number.");
    }
    const playerName = String(payload.playerName ?? "anonymous").trim() || "anonymous";
    return {
        token: String(payload.token ?? ""),
        imageURL: String(payload.imageURL ?? ""),
        playerName: playerName.slice(0, 32),
        score: Math.floor(scoreValue),
        season: getCurrentSeason(),
    };
}

async function readAllScores(): Promise<HighScore[]> {
    const cleanData: HighScore[] = [];
    const allScores = await getDocs(collection(database, SCORE_COLLECTION));
    allScores.forEach((item) => {
        const normalized = normalizeScoreRecord(item.data(), item.id);
        if (normalized) {
            cleanData.push(normalized);
        }
    });
    return cleanData;
}

export function createApp() {
    const app = express();
    app.use(express.json());
    app.use(cors());

    app.get("/health", (_req, res) => {
        res.status(200).send({
            ok: true,
            season: getCurrentSeason(),
            timestamp: new Date().toISOString(),
        });
    });

    app.get("/scores", async (req, res) => {
        try {
            const season = typeof req.query.season === "string" && req.query.season.trim()
                ? req.query.season.trim()
                : getCurrentSeason();
            const allScores = await readAllScores();
            const seasonScores = allScores.filter((score) => score.season === season);
            res.status(200).send(seasonScores);
        } catch (error) {
            res.status(500).send({ error: "Failed to load scores." });
        }
    });

    app.get("/scores/all-time", async (_req, res) => {
        try {
            const scores = await readAllScores();
            res.status(200).send(scores);
        } catch (error) {
            res.status(500).send({ error: "Failed to load all-time scores." });
        }
    });

    app.post("/scores", async (req, res) => {
        try {
            const playerScore = parseIncomingScore(req.body);
            const created = await addDoc(collection(database, SCORE_COLLECTION), playerScore);
            res.status(201).send({
                ...playerScore,
                id: created.id,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Invalid payload.";
            res.status(400).send({ error: message });
        }
    });

    return app;
}

if (process.env.NODE_ENV !== "test") {
    const app = createApp();
    app.listen(3888);
}
