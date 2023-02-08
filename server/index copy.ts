import express, { json } from "express"
import fs from "fs"
import { User } from "./domain/user";
import cors from "cors"

const app = express();
app.use(express.json())
app.use(cors())

// at /users, i need to open that file, users.json, and return that to the client.
app.get("/user", (req,res)=>{
    console.log("we got something")
    const users = fs.readFileSync('./users.json')
    res.send(users)
});

app.post("/user", (req, res)=>{
    console.log('called post user route')
    const users:User[] = JSON.parse(fs.readFileSync('./users.json')as any as string);
    const name = req.body.name;
    const age = req.body.age;
    const ethAddress = req.body.ethAddress;
    const user:User= {
        name:name,
        age:age,
        ethAddress:ethAddress,
    }
    console.log(user)
   
    console.log(users)
    // req.body has all the data
    users.push(user);
    fs.writeFileSync("./users.json", JSON.stringify(users))
 
    res.send(users); 
})
app.listen(3000)
