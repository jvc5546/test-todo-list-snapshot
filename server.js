const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/todoapp';

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

let db;
let todosCollection;

async function connectToMongo() {
  try {
    const client = await MongoClient.connect(MONGODB_URI, {
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 30000,
    });

    db = client.db();
    todosCollection = db.collection('todos');

    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    setTimeout(connectToMongo, 5000);
  }
}

app.get('/api/todos', async (req, res) => {
  try {
    const todos = await todosCollection.find({}).sort({ createdAt: -1 }).toArray();
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/todos', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Todo text is required' });
    }

    const newTodo = {
      text: text.trim(),
      completed: false,
      createdAt: new Date()
    };

    const result = await todosCollection.insertOne(newTodo);
    const insertedTodo = await todosCollection.findOne({ _id: result.insertedId });

    res.status(201).json(insertedTodo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { completed } = req.body;

    const result = await todosCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { completed } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const updatedTodo = await todosCollection.findOne({ _id: new ObjectId(id) });
    res.json(updatedTodo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await todosCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

connectToMongo().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
