import express from "express";
import joi from "joi";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

console.log(process.env.MONGO_URI);

