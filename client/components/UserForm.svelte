<script lang="ts">
    import axios from "axios";

    let name: string = "";
    let age: number = 0;
    let ethAddress: string = "";
    async function submitForm() {
        console.log(name, age, ethAddress);
        const result = await axios.post("http://localhost:3000/user", {
            name: name,
            age: age,
            ethAddress: ethAddress,
        });
        console.log(result);
    }
</script>

<main>
   
    <input type="text" placeholder="Name" bind:value={name} />
    <input type="number" placeholder="Age" bind:value={age} />
    <input type="text" placeholder="Eth Address" bind:value={ethAddress} />

    <button
        on:click={async () => {
            await submitForm();
        }}>Submit</button
    >
</main>
