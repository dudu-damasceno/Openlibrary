import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import app from './src/app';

dotenv.config();

const PORT = process.env.PORT || 5000;
const server = express();

server.use(cors());
server.use(morgan('dev'));
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

server.use(app); // Use o app.ts como middleware principal

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
