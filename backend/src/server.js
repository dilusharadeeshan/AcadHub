import express from 'express';

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
 res.send("AcadHub API is running");
});

app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;

  res.status(201).json({
    message: "Register request received",
    user: {
      name,
      email
    }
  });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});

