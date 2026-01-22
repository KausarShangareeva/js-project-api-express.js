import cors from "cors";
import express from "express";
import data from "./data.json";

const port = process.env.PORT || 3000;
const app = express();

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    name: "Happy Thoughts API",
    endpoints: [
      { method: "GET", path: "/", description: "API docs" },
      { method: "GET", path: "/thoughts", description: "Get all thoughts" },
      {
        method: "GET",
        path: "/thoughts/:id",
        description: "Get single thought by id",
      },
    ],
  });
});

app.get("/thoughts", (req, res) => {
  res.send(data.thoughts);
});

app.get("/thoughts/:id", (req, res) => {
  const id = req.params.id;

  const thought = data.thought.find((t) => t._id === id);

  if (!thought) {
    return res.status(404).json({
      message: "not found",
      id,
    });
  }

  res.json(thought);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
