import dns from "dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true
  })
);

//test route
app.get('/', (req, res) => {
 res.send("AcadHub API is running");
});


app.use("/api/auth", authRoutes);

//connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((error) => {
    console.log("MongoDB connection failed");
    console.log(error.message);
  });


//start the server  
app.listen(5000, () => {
  console.log("Server running on port 5000");
});

