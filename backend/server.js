import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
const mongoURL = process.env.MONGO_URL || "mongodb://localhost/happythoughts";
mongoose.connect(mongoURL);
mongoose.Promise = Promise;

// --- Thought Model ---
const Thought = mongoose.model("Thought", {
  message: {
    type: String,
    required: [true, "Message is required"],
    minlength: [5, "Message must be at least 5 characters"],
    maxlength: [140, "Message must be at most 140 characters"],
  },
  hearts: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// --- Seed database ---
// Set RESET_DB=true in .env to seed on startup
if (process.env.RESET_DB === "true") {
  const seedDB = async () => {
    await Thought.deleteMany();
    const thoughts = [
      { message: "Berlin baby", hearts: 37 },
      { message: "My family!", hearts: 0 },
      { message: "The smell of coffee in the morning....", hearts: 23 },
      { message: "Summer is coming...", hearts: 2 },
      { message: "Cute monkeys", hearts: 2 },
      { message: "The weather is nice!", hearts: 0 },
      { message: "Netflix and late night ice-cream", hearts: 1 },
      { message: "good vibes and good things", hearts: 3 },
      { message: "cold beer", hearts: 2 },
      { message: "I am happy that I feel healthy and have energy again", hearts: 13 },
    ];
    await Thought.insertMany(thoughts);
    console.log("Database seeded!");
  };
  seedDB();
}

// --- Routes ---

// GET / - API documentation
app.get("/", (req, res) => {
  res.json({
    name: "Happy Thoughts API",
    endpoints: [
      { method: "GET", path: "/thoughts", description: "Get all thoughts" },
      { method: "GET", path: "/thoughts/:id", description: "Get one thought" },
      { method: "POST", path: "/thoughts", description: "Create a thought" },
      { method: "PATCH", path: "/thoughts/:id", description: "Update a thought" },
      { method: "DELETE", path: "/thoughts/:id", description: "Delete a thought" },
      { method: "POST", path: "/thoughts/:id/like", description: "Like a thought" },
    ],
  });
});

// GET /thoughts - get all thoughts (newest first)
app.get("/thoughts", async (req, res) => {
  try {
    const thoughts = await Thought.find().sort({ createdAt: -1 }).limit(20);
    res.json(thoughts);
  } catch (err) {
    res.status(400).json({ error: "Could not get thoughts" });
  }
});

// GET /thoughts/:id - get one thought
app.get("/thoughts/:id", async (req, res) => {
  try {
    const thought = await Thought.findById(req.params.id);
    if (!thought) {
      return res.status(404).json({ error: "Thought not found" });
    }
    res.json(thought);
  } catch (err) {
    res.status(400).json({ error: "Invalid id" });
  }
});

// POST /thoughts - create a new thought
app.post("/thoughts", async (req, res) => {
  try {
    const thought = await new Thought({ message: req.body.message }).save();
    res.status(201).json(thought);
  } catch (err) {
    res.status(400).json({ error: "Could not save thought", details: err.message });
  }
});

// PATCH /thoughts/:id - update a thought
app.patch("/thoughts/:id", async (req, res) => {
  try {
    const thought = await Thought.findByIdAndUpdate(
      req.params.id,
      { message: req.body.message },
      { new: true, runValidators: true }
    );
    if (!thought) {
      return res.status(404).json({ error: "Thought not found" });
    }
    res.json(thought);
  } catch (err) {
    res.status(400).json({ error: "Could not update thought", details: err.message });
  }
});

// DELETE /thoughts/:id - delete a thought
app.delete("/thoughts/:id", async (req, res) => {
  try {
    const thought = await Thought.findByIdAndDelete(req.params.id);
    if (!thought) {
      return res.status(404).json({ error: "Thought not found" });
    }
    res.json(thought);
  } catch (err) {
    res.status(400).json({ error: "Could not delete thought" });
  }
});

// POST /thoughts/:id/like - add a heart to a thought
app.post("/thoughts/:id/like", async (req, res) => {
  try {
    const thought = await Thought.findByIdAndUpdate(
      req.params.id,
      { $inc: { hearts: 1 } },
      { new: true }
    );
    if (!thought) {
      return res.status(404).json({ error: "Thought not found" });
    }
    res.json(thought);
  } catch (err) {
    res.status(400).json({ error: "Could not like thought" });
  }
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
