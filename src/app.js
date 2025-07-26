import express from 'express';
import config from './config.js';
import cors from 'cors';
import morgan from 'morgan';
import 'dotenv/config';
import router from './index.router.js';

const app = express();

app.use(cors({
  origin: [
    'http://localhost:8080',
    'https://asset.biginspiredfoods.com'
  ],
  allowedHeaders: ['Content-Type','Authorization']
}));

app.use(morgan('dev'));
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(express.urlencoded({ extended: true }));

app.use('/api', router);

app.listen(config.app.port, () => {
    console.log(`Server is running on port ${config.app.port}`);
});


// console.log('env:', process.env.PORT);
// console.log('config:', config.app.port);
// console.log('config:', config.db.main);