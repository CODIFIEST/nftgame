type HighScore ={
    token:string,
    score:number,
    imageURL:string,
    playerName:string,
    season:string,
    id:string,
    ticketId?: string,
    runStartedAt?: string,
    runEndedAt?: string,
    maxCombo?: number,
    collectedStars?: number,
    maxLevelReached?: number,
   
}
export type {HighScore}
