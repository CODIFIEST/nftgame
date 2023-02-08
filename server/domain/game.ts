type Game ={
    name:string,
    platform:string,
    releaseYear:number,
    genre:string,
    ESRBrating:string,
    goodGame:boolean,

}
const platforms=[
    "ps4",
    "ps3",
    "ps5",
    "xbox",
    "switch",
    "pc"
]
const genres=[
    "sandbox",
    "rts",
    "fps",
    "moba",
    "rpg",
    "sports",
    "platformer"
]
const ESRBratings=[
    'E',
    'T',
    'M',
    'A'
]
export {platforms, genres, ESRBratings}
export type {Game}