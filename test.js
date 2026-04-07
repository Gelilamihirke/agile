const request = require("supertest");
const app = require("./app");

(async () => {
  try {
    // test health
    const health = await request(app).get("/health");

    // test creating task
    const task = await request(app)
      .post("/tasks")
      .send({ title: "Demo Task" });

    if (
      health.statusCode === 200 &&
      health.body.status === "OK" &&
      task.statusCode === 201 &&
      task.body.title === "Demo Task"
    ) {
      console.log("✅ All tests passed");
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