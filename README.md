## NFTGAME
Arcade platformer with NFT-based character selection and leaderboard tracking.

## Local Setup
1. Install dependencies:
`cd client && npm install`
`cd ../server && npm install`
2. Configure env:
`client/.env` needs wallet/NFT vars (see `client/README.md`).
`server/.env` needs Firebase vars (see `server/api/index.ts` keys).
3. Run backend:
`cd server && npm run build && npm run start`
4. Run frontend:
`cd client && npm run dev`

## API Contract
1. `GET /health`
2. `GET /scores?season=YYYY-QN`
3. `GET /scores/all-time`
4. `POST /scores`

## Release Checklist
1. `cd server && npm test`
2. `cd client && npm run check && npm run build`
3. Smoke test in desktop browser.
4. Smoke test in Phantom in-app browser.
5. Verify seasonal and all-time score carousels render.
