<script lang="ts">
    import axios from "axios"
let name: string="";
let platform:string="";
let releaseYear:number=0;
let genre:string="";
let ESRBrating:string="";
let goodGame:boolean=false;
async function submitForm() {
   const result = await axios.post('http://localhost:3000/games', {
        name:name,
        platform:platform,
        releaseYear:releaseYear,
        genre:genre,
        ESRBrating:ESRBrating,
        goodGame:goodGame,
    })
    console.log (result)
    
}

</script>

<main>
    <input bind:value={name} type="text" placeholder="Name">
    <input bind:value={platform} type="text" placeholder="Platform">
    <input bind:value={releaseYear} type="number" placeholder="Year of Release">
    <input bind:value={genre} type="text" placeholder="Genre">
    <input bind:value={ESRBrating} type="text" placeholder="ESRB Rating">
    <input bind:value={goodGame} type="boolean" placeholder="Good Game?">

    <button on:click={async ()=>{
        await submitForm();
    }}>Submit Game</button>
</main>