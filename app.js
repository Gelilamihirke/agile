const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// in-memory database
let tasks = [];

// Home route
app.get("/", (req, res) => {
  res.send("🚀 Task Manager API is running!");
});

// Add a task
app.post("/tasks", (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Task title is required" });
  }

  const newTask = {
    id: tasks.length + 1,
    title,
  };

  tasks.push(newTask);
  res.status(201).json(newTask);
});

// Get all tasks
app.get("/tasks", (req, res) => {
  res.json(tasks);
});

// Health check (for pipeline)
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

module.exports = app;

// Run server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}