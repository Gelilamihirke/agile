const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = process.env.DB_PATH || './database.sqlite';
const db = new sqlite3.Database(dbPath);

// Initialize database
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      priority TEXT DEFAULT 'medium',
      due_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_task_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_task_priority ON tasks(priority);
    CREATE INDEX IF NOT EXISTS idx_task_due_date ON tasks(due_date);
  `);
});

class Task {
  static async create(taskData) {
    const id = uuidv4();
    const { title, description, priority, due_date } = taskData;
    
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO tasks (id, title, description, priority, due_date) 
         VALUES (?, ?, ?, ?, ?)`,
        [id, title, description, priority || 'medium', due_date],
        function(err) {
          if (err) reject(err);
          else resolve(Task.findById(id));
        }
      );
    });
  }

  static async findAll(filters = {}) {
    const { status, priority, search } = filters;
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (priority) {
      query += ' AND priority = ?';
      params.push(priority);
    }
    if (search) {
      query += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static async update(id, updates) {
    const { title, description, status, priority, due_date } = updates;
    const fields = [];
    const values = [];

    if (title) { fields.push('title = ?'); values.push(title); }
    if (description) { fields.push('description = ?'); values.push(description); }
    if (status) { fields.push('status = ?'); values.push(status); }
    if (priority) { fields.push('priority = ?'); values.push(priority); }
    if (due_date) { fields.push('due_date = ?'); values.push(due_date); }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`,
        [...values, id],
        function(err) {
          if (err) reject(err);
          else resolve(Task.findById(id));
        }
      );
    });
  }

  static async delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM tasks WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ deleted: this.changes > 0 });
      });
    });
  }

  static async getStats() {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          AVG(CASE WHEN status = 'completed' AND created_at IS NOT NULL 
              THEN julianday(updated_at) - julianday(created_at) ELSE NULL END) as avg_completion_time
        FROM tasks
      `, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
}

module.exports = Task;