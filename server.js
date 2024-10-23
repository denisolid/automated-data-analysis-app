import express from 'express';
import multer from 'multer';
import csvParser from 'csv-parser';
import fs from 'fs';
import { generateToken, authenticateToken } from './src/auth.js';
import jwt from 'jsonwebtoken';
import { initMongoConnection } from './src/db/dbConnection.js';
import { createDynamicModel } from './src/db/models/DynamicRecord.js';

const app = express();
const upload = multer({ dest: 'uploads/' });

const PORT = process.env.PORT || 3000;
initMongoConnection();
// Middleware для обработки JSON
app.use(express.json());

// Простая проверка, что сервер работает
app.get('/', (req, res) => {
  res.send('Data Analysis Tool Backend is running!');
});

// Роут для загрузки CSV файла
app.post('/upload-csv', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'File not uploaded' });
  }

  const results = [];
  const filePath = req.file.path;

  // Читаем CSV и получаем заголовки
  fs.createReadStream(filePath)
    .pipe(csvParser())
    .on('data', (data) => {
      if (results.length === 0) {
        // Получаем заголовки из первой строки
        const csvFields = Object.keys(data);
        const DynamicRecord = createDynamicModel(csvFields); // Создаем модель на основе заголовков

        results.push(data);
        // После получения заголовков, можно сразу начать сохранять
      } else {
        results.push(data); // Добавляем остальные строки
      }
    })
    .on('end', async () => {
      try {
        const DynamicRecord = createDynamicModel(Object.keys(results[0])); // Снова создаем модель, чтобы сохранить данные
        const savedRecords = await DynamicRecord.insertMany(results);
        res.json({
          message: 'CSV processed and data saved successfully',
          data: savedRecords,
        });
      } catch (err) {
        console.error('Error during saving:', err);
        res
          .status(500)
          .json({ message: 'Error saving data', error: err.message || err });
      }
    });
});

let users = [];

// Регистрация пользователя
app.post('/register', (req, res) => {
  const { email, password } = req.body;
  const user = { id: users.length + 1, email, password };
  users.push(user);

  const token = generateToken(user);
  res.json({ message: 'User registered successfully', token });
});

// Логин пользователя
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });

  const token = generateToken(user);
  res.json({ message: 'Logged in successfully', token });
});

// Пример защищенного маршрута
app.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: `Hello, ${req.user.email}` });
});

// Получение всех записей из базы данных
app.get('/data-records', async (req, res) => {
  const { page = 1, limit = 10, field1 } = req.query; // Параметры фильтрации и пагинации

  try {
    const query = field1 ? { field1: field1 } : {}; // Фильтрация по полю field1
    const records = await DataRecordSchema.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await DataRecordSchema.countDocuments(query);

    res.json({
      records,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching data', error: err });
  }
});
// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
