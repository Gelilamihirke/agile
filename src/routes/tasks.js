const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { validateTask, validateTaskUpdate } = require('../middleware/validation');
const logger = require('../utils/logger');

// Get all tasks with filters
router.get('/', async (req, res, next) => {
  try {
    const { status, priority, search } = req.query;
    const tasks = await Task.findAll({ status, priority, search });
    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
});

// Get task statistics
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await Task.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

// Get single task
router.get('/:id', async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
});

// Create task
router.post('/', validateTask, async (req, res, next) => {
  try {
    const task = await Task.create(req.body);
    logger.info(`Task created: ${task.id}`);
    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
});

// Update task
router.put('/:id', validateTaskUpdate, async (req, res, next) => {
  try {
    const task = await Task.update(req.params.id, req.body);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    logger.info(`Task updated: ${task.id}`);
    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
});

// Delete task
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await Task.delete(req.params.id);
    if (!result.deleted) {
      return res.status(404).json({ error: 'Task not found' });
    }
    logger.info(`Task deleted: ${req.params.id}`);
    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;