const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 8080;

const DATA_FILE = path.join(__dirname, 'data', 'inventory.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

if (!fs.existsSync(path.dirname(DATA_FILE))) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([
    {
      id: 1,
      name: 'Laptop cá nhân',
      category: 'Điện tử',
      location: 'Phòng làm việc',
      quantity: 1,
      price: 25000000,
      purchaseDate: '2023-05-15',
      notes: 'Máy dùng để làm việc',
      image: ''
    }
  ], null, 2));
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

function readData() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.get('/api/items', (req, res) => {
  const items = readData();
  res.json(items);
});

app.post('/api/items', upload.single('image'), (req, res) => {
  const items = readData();
  const newItem = {
    id: Date.now(),
    name: req.body.name || 'Không tên',
    category: req.body.category || 'Khác',
    location: req.body.location || 'Chưa rõ',
    quantity: parseInt(req.body.quantity) || 1,
    price: parseFloat(req.body.price) || 0,
    purchaseDate: req.body.purchaseDate || '',
    notes: req.body.notes || '',
    image: req.file ? `/uploads/${req.file.filename}` : ''
  };
  items.push(newItem);
  writeData(items);
  res.json({ success: true, item: newItem });
});

app.delete('/api/items/:id', (req, res) => {
  let items = readData();
  const id = parseInt(req.params.id);
  items = items.filter(item => item.id !== id);
  writeData(items);
  res.json({ success: true });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
