import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(express.json());

//test route
app.get('/', (req, res) => {
 res.send("AcadHub API is running");
});


//register route with validation
app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Name, email and password are required"
    });
  }

  if (name.length < 2) {
    return res.status(400).json({
      message: "Name must be at least 2 characters long"
    });
  }

  if (!email.includes("@")) {
    return res.status(400).json({
      message: "Please enter a valid email address"
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      message: "Password must be at least 8 characters long"
    });
  }

  res.status(201).json({
    message: "Register request received",
    user: {
      name,
      email
    }
  });
});

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

