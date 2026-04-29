const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ── HTML 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'public')));

// 메모리 저장소
let notes = [];

// ── GET /api/notes — 전체 목록
app.get('/api/notes', (req, res) => {
  res.json(notes);
});

// ── POST /api/notes — 새 노트 저장
app.post('/api/notes', (req, res) => {
  const { keyword, content } = req.body;
  if (!keyword || !keyword.trim()) {
    return res.status(400).json({ error: '키워드를 입력해주세요.' });
  }
  const now = new Date().toISOString();
  const note = {
    id: uuidv4(),
    keyword: keyword.trim(),
    content: (content || '').trim(),
    createdAt: now,
    updatedAt: now
  };
  notes.unshift(note);
  res.status(201).json(note);
});

// ── PUT /api/notes/:id — 수정
app.put('/api/notes/:id', (req, res) => {
  const { keyword, content } = req.body;
  const idx = notes.findIndex(n => n.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '노트를 찾을 수 없습니다.' });
  if (!keyword || !keyword.trim()) {
    return res.status(400).json({ error: '키워드를 입력해주세요.' });
  }
  notes[idx] = {
    ...notes[idx],
    keyword: keyword.trim(),
    content: (content || '').trim(),
    updatedAt: new Date().toISOString()
  };
  res.json(notes[idx]);
});

// ── DELETE /api/notes/:id — 삭제
app.delete('/api/notes/:id', (req, res) => {
  const before = notes.length;
  notes = notes.filter(n => n.id !== req.params.id);
  if (notes.length === before) return res.status(404).json({ error: '노트를 찾을 수 없습니다.' });
  res.json({ ok: true });
});

// ── SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
