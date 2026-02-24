import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
const mongoURL = process.env.MONGO_URL || "mongodb://localhost/happythoughts";

mongoose.connect(mongoURL);
mongoose.Promise = Promise;

// --- User Model ---
const User = mongoose.model("User", {
  name: {
    type: String,
    required: [true, "Name is required"],
    minlength: [2, "Name must be at least 2 characters"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    match: [/.+@.+\..+/, "Please enter a valid email"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
  },
  accessToken: {
    type: String,
    default: () => bcrypt.genSaltSync(),
  },
});

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
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

// --- Auth Middleware ---
const auth = async (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) {
    return res.status(401).json({ error: "Not logged in" });
  }
  const user = await User.findOne({ accessToken: token });
  if (!user) {
    return res.status(401).json({ error: "Invalid token" });
  }
  req.user = user;
  next();
};

// --- Seed database ---
if (process.env.RESET_DB === "true") {
  const seedDB = async () => {
    await Thought.deleteMany();
    const thoughts = [
      {
        message: "Code is like humor. When you have to explain it, it's bad.",
        hearts: 12,
      },
      {
        message: "First, solve the problem. Then, write the code.",
        hearts: 25,
      },
      {
        message: "The best error message is the one that never shows up.",
        hearts: 8,
      },
      { message: "Talk is cheap. Show me the code.", hearts: 31 },
      {
        message: "It works on my machine! Then we ship your machine.",
        hearts: 19,
      },
      { message: "Simplicity is the soul of efficiency.", hearts: 14 },
      { message: "Make it work, make it right, make it fast.", hearts: 22 },
      {
        message:
          "Every great developer you know got there by solving problems they were unqualified to solve.",
        hearts: 17,
      },
      {
        message:
          "The only way to learn a new programming language is by writing programs in it.",
        hearts: 9,
      },
      {
        message:
          "Programming is the art of telling another human what one wants the computer to do.",
        hearts: 11,
      },
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
      { method: "POST", path: "/register", description: "Register a new user" },
      { method: "POST", path: "/login", description: "Login" },
      { method: "GET", path: "/thoughts", description: "Get all thoughts" },
      { method: "GET", path: "/thoughts/:id", description: "Get one thought" },
      {
        method: "POST",
        path: "/thoughts",
        description: "Create a thought (auth)",
      },
      {
        method: "PATCH",
        path: "/thoughts/:id",
        description: "Update a thought (auth)",
      },
      {
        method: "DELETE",
        path: "/thoughts/:id",
        description: "Delete a thought (auth)",
      },
      {
        method: "POST",
        path: "/thoughts/:id/like",
        description: "Like a thought",
      },
    ],
  });
});

// POST /register - create a new user
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(400)
        .json({ error: "That email address already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await new User({
      name,
      email,
      password: hashedPassword,
    }).save();
    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      accessToken: user.accessToken,
    });
  } catch (err) {
    res.status(400).json({ error: "Could not register", details: err.message });
  }
});

// POST /login - login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Wrong password" });
    }
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      accessToken: user.accessToken,
    });
  } catch (err) {
    res.status(400).json({ error: "Could not login", details: err.message });
  }
});

// GET /thoughts - get all thoughts (newest first)
app.get("/thoughts", async (req, res) => {
  try {
    const thoughts = await Thought.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("user", "name");
    res.json(thoughts);
  } catch (err) {
    res.status(400).json({ error: "Could not get thoughts" });
  }
});

// GET /thoughts/:id - get one thought
app.get("/thoughts/:id", async (req, res) => {
  try {
    const thought = await Thought.findById(req.params.id).populate(
      "user",
      "name",
    );
    if (!thought) {
      return res.status(404).json({ error: "Thought not found" });
    }
    res.json(thought);
  } catch (err) {
    res.status(400).json({ error: "Invalid id" });
  }
});

// POST /thoughts - create a new thought (auth required)
app.post("/thoughts", auth, async (req, res) => {
  try {
    const thought = await new Thought({
      message: req.body.message,
      user: req.user._id,
    }).save();
    const populated = await thought.populate("user", "name");
    res.status(201).json(populated);
  } catch (err) {
    res
      .status(400)
      .json({ error: "Could not save thought", details: err.message });
  }
});

// PATCH /thoughts/:id - update a thought (auth, only owner)
app.patch("/thoughts/:id", auth, async (req, res) => {
  try {
    const thought = await Thought.findById(req.params.id);
    if (!thought) {
      return res.status(404).json({ error: "Thought not found" });
    }
    if (String(thought.user) !== String(req.user._id)) {
      return res
        .status(403)
        .json({ error: "You can only edit your own thoughts" });
    }
    thought.message = req.body.message;
    await thought.save();
    const populated = await thought.populate("user", "name");
    res.json(populated);
  } catch (err) {
    res
      .status(400)
      .json({ error: "Could not update thought", details: err.message });
  }
});

// DELETE /thoughts/:id - delete a thought (auth, only owner)
app.delete("/thoughts/:id", auth, async (req, res) => {
  try {
    const thought = await Thought.findById(req.params.id);
    if (!thought) {
      return res.status(404).json({ error: "Thought not found" });
    }
    if (String(thought.user) !== String(req.user._id)) {
      return res
        .status(403)
        .json({ error: "You can only delete your own thoughts" });
    }
    await thought.deleteOne();
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
      { new: true },
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
