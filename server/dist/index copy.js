"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
// at /users, i need to open that file, users.json, and return that to the client.
app.get("/user", (req, res) => {
    console.log("we got something");
    const users = fs_1.default.readFileSync('./users.json');
    res.send(users);
});
app.post("/user", (req, res) => {
    console.log('called post user route');
    const users = JSON.parse(fs_1.default.readFileSync('./users.json'));
    const name = req.body.name;
    const age = req.body.age;
    const ethAddress = req.body.ethAddress;
    const user = {
        name: name,
        age: age,
        ethAddress: ethAddress,
    };
    console.log(user);
    console.log(users);
    // req.body has all the data
    users.push(user);
    fs_1.default.writeFileSync("./users.json", JSON.stringify(users));
    res.send(users);
});
app.listen(3000);
