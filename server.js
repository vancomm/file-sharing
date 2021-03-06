/* eslint-disable no-console */
import dotenv from 'dotenv';
import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import FileModel from './models/file.js';

dotenv.config();

mongoose.connect(process.env.DATABASE_URL);

const app = express();

const upload = multer({ dest: 'uploads' });

app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/upload', upload.single('file'), async (req, res) => {
  const fileData = {
    path: req.file.path,
    originalName: req.file.originalname,
  };
  if (req.body.password != null && req.body.password !== '') {
    fileData.password = await bcrypt.hash(req.body.password, 10);
  }
  const file = await FileModel.create(fileData);
  console.log(file);

  res.render('index', { fileLink: `${req.headers.origin}/file/${file.id}` });
});

async function handleDownload(req, res) {
  const file = await FileModel.findById(req.params.id);

  if (file.password != null) {
    if (req.body.password == null) {
      res.render('password');
      return;
    }

    if (!(await bcrypt.compare(req.body.password, file.password))) {
      res.render('password', { error: true });
      return;
    }
  }

  file.downloadCount += 1;

  await file.save();

  res.download(file.path, file.originalName);
}

app.route('/file/:id')
  .get(handleDownload)
  .post(handleDownload);

app.listen(process.env.PORT);
