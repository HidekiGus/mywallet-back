import express from "express";
import joi from "joi";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";

dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URI);

const server = express();

server.use(express.json());
server.use(cors());

const loginSchema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().required()
});

//POST Login
server.post("/login", async(req, res) => {
    const { email, password } = req.body;

    const validate = loginSchema.validate({ email, password });

    if (validate.error) {
        res.sendStatus(422)
        return;
    } else {
        try {
            await mongoClient.connect();
            const db = mongoClient.db("wallet");
            const usersCollection = db.collection("users");
            const sessionsCollection = db.collection("sessions");
            const user = await usersCollection.findOne({ email: email });
            const token = uuid();

            const corpo = { name: user.name, 
                            token };

            if (!user) {
                res.sendStatus(404);
                return;
            } else if (bcrypt.compareSync(password, user.password)) {
                res.send(corpo).status(200);
                await sessionsCollection.insertOne({ token, userId: user._id });
                return;
            }
        } catch(error) {
            res.sendStatus(500);
            return;
        }
        
    }
});

//POST SignUp
server.post("/signup", async(req, res) => {
    const userSchema = joi.object({
        name: joi.string().required(),
        email: joi.string().email().required(),
        password: joi.string().required(),
        passwordCheck: joi.string().required()
    });

    const { name, email, password, passwordCheck } = req.body;

    const validate = userSchema.validate(req.body);

    await mongoClient.connect();
    const db = mongoClient.db("wallet");
    const usersCollection = db.collection("users");

    const doPasswordsCheck = (password === passwordCheck);
    const emailUsed = await usersCollection.findOne({ email });

    if (validate.error) {
        res.sendStatus(422);
        return;
    } else if (emailUsed !== null) {
        res.sendStatus(409);
        return;
    } else if (doPasswordsCheck) {
        try {
            const encryptedPassword = bcrypt.hashSync(password, 10);
            await usersCollection.insertOne({ name, email, password: encryptedPassword });
            res.sendStatus(201);
            return;
        } catch(error) {
            res.sendStatus(500);
            return;
        }
    } else {
        res.sendStatus(400);
        return;
    }
});



server.listen(5000, ()=>{console.log("Servidor rodando!")});