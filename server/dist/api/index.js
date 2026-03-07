"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.createApp = void 0;
const cors_1 = __importDefault(require("cors"));
const dotenv = __importStar(require("dotenv"));
const express_1 = __importDefault(require("express"));
const app_1 = require("firebase/app");
const firestore_1 = require("firebase/firestore");
const season_1 = require("./season");
const rateLimit_1 = require("./rateLimit");
const scoreValidation_1 = require("./scoreValidation");
dotenv.config();
const firebaseConfig = {
    apiKey: process.env.apiKey,
    authDomain: process.env.authDomain,
    projectId: process.env.projectId,
    storageBucket: process.env.storageBucket,
    messagingSenderId: process.env.messagingSenderId,
    appId: process.env.appId,
};
const dbApp = (0, app_1.initializeApp)(firebaseConfig);
const database = (0, firestore_1.getFirestore)(dbApp);
const SCORE_COLLECTION = "23mayhighscores";
const DEFAULT_QUERY_LIMIT = 50;
const ALLOWED_ORIGINS = [
    "https://nftgame-dusky.vercel.app",
    "https://nftgame-server.vercel.app",
    "http://localhost:5173",
    "http://localhost:4173",
];
const postRateLimiter = new rateLimit_1.SlidingWindowRateLimiter();
const corsOptions = {
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
function readAllScores() {
    return __awaiter(this, void 0, void 0, function* () {
        const cleanData = [];
        const allScores = yield (0, firestore_1.getDocs)((0, firestore_1.collection)(database, SCORE_COLLECTION));
        allScores.forEach((item) => {
            const normalized = (0, scoreValidation_1.normalizeScoreRecord)(item.data(), item.id);
            if (normalized) {
                cleanData.push(normalized);
            }
        });
        return cleanData;
    });
}
function readSeasonScores(season, maxRows) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const ref = (0, firestore_1.collection)(database, SCORE_COLLECTION);
            const scoreQuery = (0, firestore_1.query)(ref, (0, firestore_1.where)("season", "==", season), (0, firestore_1.orderBy)("score", "desc"), (0, firestore_1.limit)(maxRows));
            const docs = yield (0, firestore_1.getDocs)(scoreQuery);
            const cleanData = [];
            docs.forEach((item) => {
                const normalized = (0, scoreValidation_1.normalizeScoreRecord)(item.data(), item.id);
                if (normalized) {
                    cleanData.push(normalized);
                }
            });
            return cleanData;
        }
        catch (_a) {
            // Fallback keeps endpoint alive if index is missing during rollout.
            const allScores = yield readAllScores();
            return allScores
                .filter((score) => score.season === season)
                .sort((a, b) => b.score - a.score)
                .slice(0, maxRows);
        }
    });
}
function readAllTimeTopScores(maxRows) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const ref = (0, firestore_1.collection)(database, SCORE_COLLECTION);
            const scoreQuery = (0, firestore_1.query)(ref, (0, firestore_1.orderBy)("score", "desc"), (0, firestore_1.limit)(maxRows));
            const docs = yield (0, firestore_1.getDocs)(scoreQuery);
            const cleanData = [];
            docs.forEach((item) => {
                const normalized = (0, scoreValidation_1.normalizeScoreRecord)(item.data(), item.id);
                if (normalized) {
                    cleanData.push(normalized);
                }
            });
            return cleanData;
        }
        catch (_a) {
            const allScores = yield readAllScores();
            return allScores.sort((a, b) => b.score - a.score).slice(0, maxRows);
        }
    });
}
function createApp() {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use((0, cors_1.default)(corsOptions));
    app.options("*", (0, cors_1.default)(corsOptions));
    app.get("/health", (_req, res) => {
        res.status(200).send({
            ok: true,
            season: (0, season_1.getCurrentSeason)(),
            timestamp: new Date().toISOString(),
        });
    });
    app.get("/scores", (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const maxRows = (0, scoreValidation_1.parseLimit)(req.query.limit, DEFAULT_QUERY_LIMIT);
            const season = typeof req.query.season === "string" && req.query.season.trim()
                ? req.query.season.trim()
                : (0, season_1.getCurrentSeason)();
            const seasonScores = yield readSeasonScores(season, maxRows);
            res.status(200).send(seasonScores);
        }
        catch (error) {
            res.status(500).send({ error: "Failed to load scores." });
        }
    }));
    app.get("/scores/all-time", (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const maxRows = (0, scoreValidation_1.parseLimit)(req.query.limit, DEFAULT_QUERY_LIMIT);
            const scores = yield readAllTimeTopScores(maxRows);
            res.status(200).send(scores);
        }
        catch (error) {
            res.status(500).send({ error: "Failed to load all-time scores." });
        }
    }));
    app.post("/scores", (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const ipKey = req.ip || req.socket.remoteAddress || "unknown";
            if (!postRateLimiter.consume(ipKey)) {
                res.status(429).send({ error: "Too many score submissions. Try again in a minute." });
                return;
            }
            const playerScore = (0, scoreValidation_1.parseIncomingScore)(req.body);
            const created = yield (0, firestore_1.addDoc)((0, firestore_1.collection)(database, SCORE_COLLECTION), playerScore);
            res.status(201).send(Object.assign(Object.assign({}, playerScore), { id: created.id }));
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Invalid payload.";
            res.status(400).send({ error: message });
        }
    }));
    return app;
}
exports.createApp = createApp;
const app = createApp();
exports.default = app;
if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
    app.listen(3888);
}
