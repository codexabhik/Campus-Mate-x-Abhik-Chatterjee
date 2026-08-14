const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

let currentUser = null;
let tasks = [];
let assignments = [];
let notes = [];

app.get('/api/auth', (req, res) => {
    res.json({ user: currentUser });
});

app.post('/api/login', (req, res) => {
    const { name, role } = req.body;
    currentUser = { name, role };
    tasks = [];
    assignments = [];
    notes = [];
    res.json({ success: true, user: currentUser });
});

app.post('/api/logout', (req, res) => {
    currentUser = null;
    tasks = [];
    assignments = [];
    notes = [];
    res.json({ success: true });
});

app.get('/api/tasks', (req, res) => res.json(tasks));

app.post('/api/tasks', (req, res) => {
    const newTask = { id: Date.now(), text: req.body.text, completed: false };
    tasks.push(newTask);
    res.status(201).json(newTask);
});

app.put('/api/tasks/:id/toggle', (req, res) => {
    const id = parseInt(req.params.id);
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        res.json(task);
    } else {
        res.status(404).json({ error: 'Task not found' });
    }
});

app.put('/api/tasks/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.text = req.body.text;
        res.json(task);
    } else {
        res.status(404).json({ error: 'Task not found' });
    }
});

app.delete('/api/tasks/:id', (req, res) => {
    const id = parseInt(req.params.id);
    tasks = tasks.filter(t => t.id !== id);
    res.json({ success: true });
});

app.get('/api/assignments', (req, res) => res.json(assignments));

app.post('/api/assignments', (req, res) => {
    const newAssign = { id: Date.now(), title: req.body.title, date: req.body.date, completed: false };
    assignments.push(newAssign);
    res.status(201).json(newAssign);
});

app.put('/api/assignments/:id/toggle', (req, res) => {
    const id = parseInt(req.params.id);
    const assign = assignments.find(a => a.id === id);
    if (assign) {
        assign.completed = !assign.completed;
        res.json(assign);
    } else {
        res.status(404).json({ error: 'Assignment not found' });
    }
});

app.put('/api/assignments/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const assign = assignments.find(a => a.id === id);
    if (assign) {
        assign.title = req.body.title;
        assign.date = req.body.date;
        res.json(assign);
    } else {
        res.status(404).json({ error: 'Assignment not found' });
    }
});

app.delete('/api/assignments/:id', (req, res) => {
    const id = parseInt(req.params.id);
    assignments = assignments.filter(a => a.id !== id);
    res.json({ success: true });
});

app.get('/api/notes', (req, res) => res.json(notes));

app.post('/api/notes', (req, res) => {
    const newNote = { id: Date.now(), title: req.body.title, body: req.body.body };
    notes.push(newNote);
    res.status(201).json(newNote);
});

app.put('/api/notes/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const note = notes.find(n => n.id === id);
    if (note) {
        note.title = req.body.title;
        note.body = req.body.body;
        res.json(note);
    } else {
        res.status(404).json({ error: 'Note not found' });
    }
});

app.delete('/api/notes/:id', (req, res) => {
    const id = parseInt(req.params.id);
    notes = notes.filter(n => n.id !== id);
    res.json({ success: true });
});

app.use(express.static(path.join(__dirname, '../FrontEnd')));

app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../FrontEnd/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});