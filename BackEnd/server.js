const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

let db = {
    user: null,
    tasks: [],
    assignments: [],
    notes: []
};

app.get('/api/auth', (req, res) => {
    res.json({ user: db.user });
});

app.post('/api/login', (req, res) => {
    const { name, role } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    db = {
        user: { name, role: role || 'CSE-7th' },
        tasks: [],
        assignments: [],
        notes: []
    };

    res.json({ message: 'Login successful', user: db.user });
});

app.post('/api/logout', (req, res) => {
    db = {
        user: null,
        tasks: [],
        assignments: [],
        notes: []
    };
    res.json({ message: 'Logged out and session data wiped' });
});

app.get('/api/tasks', (req, res) => {
    res.json(db.tasks);
});

app.post('/api/tasks', (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Task text required' });

    const newTask = { id: Date.now(), text, completed: false };
    db.tasks.push(newTask);
    res.status(201).json(newTask);
});

app.put('/api/tasks/:id/toggle', (req, res) => {
    const id = parseInt(req.params.id);
    db.tasks = db.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    res.json(db.tasks);
});

app.put('/api/tasks/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { text } = req.body;
    db.tasks = db.tasks.map(t => t.id === id ? { ...t, text } : t);
    res.json(db.tasks);
});

app.delete('/api/tasks/:id', (req, res) => {
    const id = parseInt(req.params.id);
    db.tasks = db.tasks.filter(t => t.id !== id);
    res.json(db.tasks);
});

app.get('/api/assignments', (req, res) => {
    res.json(db.assignments);
});

app.post('/api/assignments', (req, res) => {
    const { title, date } = req.body;
    if (!title || !date) return res.status(400).json({ error: 'Title and date required' });

    const newAssign = { id: Date.now(), title, date, completed: false };
    db.assignments.push(newAssign);
    res.status(201).json(newAssign);
});

app.put('/api/assignments/:id/toggle', (req, res) => {
    const id = parseInt(req.params.id);
    db.assignments = db.assignments.map(a => a.id === id ? { ...a, completed: !a.completed } : a);
    res.json(db.assignments);
});

app.put('/api/assignments/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { title, date } = req.body;
    db.assignments = db.assignments.map(a => a.id === id ? { ...a, title, date } : a);
    res.json(db.assignments);
});

app.delete('/api/assignments/:id', (req, res) => {
    const id = parseInt(req.params.id);
    db.assignments = db.assignments.filter(a => a.id !== id);
    res.json(db.assignments);
});

app.get('/api/notes', (req, res) => {
    res.json(db.notes);
});

app.post('/api/notes', (req, res) => {
    const { title, body } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'Title and body required' });

    const newNote = { id: Date.now(), title, body };
    db.notes.push(newNote);
    res.status(201).json(newNote);
});

app.put('/api/notes/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { title, body } = req.body;
    db.notes = db.notes.map(n => n.id === id ? { ...n, title, body } : n);
    res.json(db.notes);
});

app.delete('/api/notes/:id', (req, res) => {
    const id = parseInt(req.params.id);
    db.notes = db.notes.filter(n => n.id !== id);
    res.json(db.notes);
});

app.listen(PORT, () => {
    console.log(`🚀 CampusMate Server running on http://localhost:${PORT}`);
});