const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const client = new MongoClient(MONGO_URI, { serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true } });

let db;
async function connectDB() {
  await client.connect();
  db = client.db('keyword_notes');
  console.log('MongoDB 연결 성공 ✓');
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/notes', async (req, res) => {
  try { const notes = await db.collection('notes').find().sort({ createdAt: -1 }).toArray(); res.json(notes); }
  catch(e) { res.status(500).json({ error: '불러오기 실패' }); }
});

app.post('/api/notes', async (req, res) => {
  const { keyword, content } = req.body;
  if (!keyword || !keyword.trim()) return res.status(400).json({ error: '키워드를 입력해주세요.' });
  const now = new Date().toISOString();
  const note = { id: uuidv4(), keyword: keyword.trim(), content: (content||'').trim(), createdAt: now, updatedAt: now };
  try { await db.collection('notes').insertOne(note); res.status(201).json(note); }
  catch(e) { res.status(500).json({ error: '저장 실패' }); }
});

app.put('/api/notes/:id', async (req, res) => {
  const { keyword, content } = req.body;
  if (!keyword || !keyword.trim()) return res.status(400).json({ error: '키워드를 입력해주세요.' });
  try {
    const result = await db.collection('notes').findOneAndUpdate(
      { id: req.params.id },
      { $set: { keyword: keyword.trim(), content: (content||'').trim(), updatedAt: new Date().toISOString() } },
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ error: '노트를 찾을 수 없습니다.' });
    res.json(result);
  } catch(e) { res.status(500).json({ error: '수정 실패' }); }
});

app.delete('/api/notes/:id', async (req, res) => {
  try {
    const result = await db.collection('notes').deleteOne({ id: req.params.id });
    if (result.deletedCount === 0) return res.status(404).json({ error: '노트를 찾을 수 없습니다.' });
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: '삭제 실패' }); }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('MongoDB 연결 실패:', err);
  process.exit(1);
});
