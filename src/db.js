import mysql2 from 'mysql2';  
import mssql from 'mssql';
import config from './config.js';

export const pool = mysql2.createPool(config.db.main).promise();
export const mssqlPool = await mssql.connect(config.db.mssql);

pool.query('SELECT 1')
    .then(() => console.log('db connected'))
    .catch(err => console.error('db connection failed:', err));

try {
  await mssqlPool.request().query('SELECT 1');
  console.log('MSSQL connected');
} catch (err) {
  console.error('MSSQL connection failed:', err);
}