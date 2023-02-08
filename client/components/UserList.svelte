<script lang="ts">
    import axios from "axios"
    import { onMount } from "svelte";
    let users=[];
    async function getUsers() {
       const result =  await axios.get('http://localhost:3000/user')
       console.log(result.data) //result.data has all the goods from axios
       return result.data
    }

    onMount(async ()=>{
       users = await getUsers();
    })
</script>
{#each users as user }
   <br> {user.name} 
    
{/each}