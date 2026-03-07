import cors from "cors";
import * as dotenv from "dotenv";
import express from "express";
import { initializeApp } from "firebase/app";
import { addDoc, collection, getDocs, getFirestore, limit, orderBy, query, where } from "firebase/firestore";
import { getCurrentSeason } from "./season";
import { HighScore } from "../domain/highscore";
import { SlidingWindowRateLimiter } from "./rateLimit";
import { consumeRunTicketOrThrow, normalizeScoreRecord, parseIncomingScore, parseLimit } from "./scoreValidation";
import { RunTicketStore } from "./runTicket";

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
const DEFAULT_QUERY_LIMIT = 50;
const ALLOWED_ORIGINS = [
    "https://nftgame-dusky.vercel.app",
    "https://nftgame-server.vercel.app",
    "http://localhost:5173",
    "http://localhost:4173",
];
const postRateLimiter = new SlidingWindowRateLimiter();
const runTicketStore = new RunTicketStore();

const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(null, false);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
};

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

async function readSeasonScores(season: string, maxRows: number): Promise<HighScore[]> {
    try {
        const ref = collection(database, SCORE_COLLECTION);
        const scoreQuery = query(ref, where("season", "==", season), orderBy("score", "desc"), limit(maxRows));
        const docs = await getDocs(scoreQuery);
        const cleanData: HighScore[] = [];
        docs.forEach((item) => {
            const normalized = normalizeScoreRecord(item.data(), item.id);
            if (normalized) {
                cleanData.push(normalized);
            }
        });
        return cleanData;
    } catch {
        // Fallback keeps endpoint alive if index is missing during rollout.
        const allScores = await readAllScores();
        return allScores
            .filter((score) => score.season === season)
            .sort((a, b) => b.score - a.score)
            .slice(0, maxRows);
    }
}

async function readAllTimeTopScores(maxRows: number): Promise<HighScore[]> {
    try {
        const ref = collection(database, SCORE_COLLECTION);
        const scoreQuery = query(ref, orderBy("score", "desc"), limit(maxRows));
        const docs = await getDocs(scoreQuery);
        const cleanData: HighScore[] = [];
        docs.forEach((item) => {
            const normalized = normalizeScoreRecord(item.data(), item.id);
            if (normalized) {
                cleanData.push(normalized);
            }
        });
        return cleanData;
    } catch {
        const allScores = await readAllScores();
        return allScores.sort((a, b) => b.score - a.score).slice(0, maxRows);
    }
}

export function createApp() {
    const app = express();
    app.use(express.json());
    app.use(cors(corsOptions));
    app.options("*", cors(corsOptions));

    app.get("/health", (_req, res) => {
        res.status(200).send({
            ok: true,
            season: getCurrentSeason(),
            timestamp: new Date().toISOString(),
        });
    });

    app.post("/run-ticket", (req, res) => {
        const ipKey = req.ip || req.socket.remoteAddress || "unknown";
        const ticket = runTicketStore.issue(ipKey);
        res.status(201).send(ticket);
    });

    app.get("/scores", async (req, res) => {
        try {
            const maxRows = parseLimit(req.query.limit, DEFAULT_QUERY_LIMIT);
            const season = typeof req.query.season === "string" && req.query.season.trim()
                ? req.query.season.trim()
                : getCurrentSeason();
            const seasonScores = await readSeasonScores(season, maxRows);
            res.status(200).send(seasonScores);
        } catch (error) {
            res.status(500).send({ error: "Failed to load scores." });
        }
    });

    app.get("/scores/all-time", async (req, res) => {
        try {
            const maxRows = parseLimit(req.query.limit, DEFAULT_QUERY_LIMIT);
            const scores = await readAllTimeTopScores(maxRows);
            res.status(200).send(scores);
        } catch (error) {
            res.status(500).send({ error: "Failed to load all-time scores." });
        }
    });

    app.post("/scores", async (req, res) => {
        try {
            const ipKey = req.ip || req.socket.remoteAddress || "unknown";
            if (!postRateLimiter.consume(ipKey)) {
                res.status(429).send({ error: "Too many score submissions. Try again in a minute." });
                return;
            }
            const playerScore = parseIncomingScore(req.body);
            consumeRunTicketOrThrow(runTicketStore, playerScore.ticketId ?? "", ipKey);
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

const app = createApp();
export default app;

if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
    app.listen(3888);
}
