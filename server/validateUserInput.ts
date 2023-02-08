import { ESRBratings, genres, platforms } from "./domain/game";

function validateUserInput(name:string, platform:string, releaseYear:number, genre:string, ESRBrating:string, goodGame:boolean){
   console.log(goodGame)
   const thisYear = new Date().getFullYear();
   console.log(`genres  ${genres}`)
    if (name.length > 15){
        throw Error(`name is too long. max length is 15. received ${name.length}`)
    }

    if (!platforms.find(e=> e === platform.toLowerCase())){
        throw Error(`platform is not a valid platform from the list ${platforms}`)
    }
    if (releaseYear < 1980 || releaseYear > (thisYear+1)){
        throw Error(`year must be between 1980 and next year, ${(thisYear+1)}, received ${releaseYear}`)
    }
    if (!genres.find(e=> e === genre.toLowerCase())){
        throw Error(`genre is not valid from the list ${genres}, recieved ${genre}`)
    }
    if (!ESRBratings.find(e=>e === ESRBrating.toUpperCase())){
        throw Error(`ESRB rating is not valid from the list: ${ESRBratings}, received ${ESRBrating}`)
    }
    if(!(typeof goodGame == "boolean")){
        throw Error(`good Game must be true or false. received ${goodGame}`)
    }
}
export default validateUserInput