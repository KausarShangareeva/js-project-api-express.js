# Happy Thoughts API

Hi there! I built this Happy Thoughts API as part of my Technigo JavaScript Bootcamp 2025 journey. This is a RESTful API built with Express.js and MongoDB that lets users create, read, update, and delete happy thoughts, as well as like them.

## Key Features

- Full CRUD operations: Create, Read, Update, and Delete thoughts
- Like (heart) a thought
- Data stored in MongoDB with Mongoose models
- Input validation (message must be 5-140 characters)
- Error handling with proper HTTP status codes
- Database seeding with sample data

## Tech Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- dotenv

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | API documentation |
| GET | `/thoughts` | Get all thoughts (newest first, limit 20) |
| GET | `/thoughts/:id` | Get a single thought by ID |
| POST | `/thoughts` | Create a new thought |
| PATCH | `/thoughts/:id` | Update a thought |
| DELETE | `/thoughts/:id` | Delete a thought |
| POST | `/thoughts/:id/like` | Like a thought (+1 heart) |

## Getting Started

1. Install dependencies: `npm install`
2. Create a `.env` file with your MongoDB connection string:
   ```
   MONGO_URL=mongodb+srv://your-connection-string
   RESET_DB=true
   ```
3. Start the server: `npm run dev`
4. After seeding, set `RESET_DB=false` in `.env`

## View it live

Backend: _add your Render link here_
