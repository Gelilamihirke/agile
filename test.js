const request = require("supertest");
const app = require("./app");

(async () => {
  try {
    // Test health endpoint
    const health = await request(app).get("/health");
    
    // Test creating a task
    const createTask = await request(app)
      .post("/api/tasks")
      .send({ 
        title: "Demo Task",
        description: "This is a test task",
        priority: "high"
      });
    
    // Test getting all tasks
    const getTasks = await request(app).get("/api/tasks");
    
    // Test getting task statistics
    const getStats = await request(app).get("/api/tasks/stats");
    
    if (
      health.statusCode === 200 &&
      health.body.status === "OK" &&
      createTask.statusCode === 201 &&
      createTask.body.success === true &&
      getTasks.statusCode === 200 &&
      getTasks.body.success === true &&
      getStats.statusCode === 200 &&
      getStats.body.success === true
    ) {
      console.log("✅ All tests passed!");
      
      // Test deleting the created task
      if (createTask.body.data && createTask.body.data.id) {
        const deleteTask = await request(app)
          .delete(`/api/tasks/${createTask.body.data.id}`);
        
        if (deleteTask.statusCode === 200) {
          console.log("✅ Cleanup completed!");
        }
      }
      
      process.exit(0);
    } else {
      console.log("❌ Test failed");
      process.exit(1);
    }
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
})();