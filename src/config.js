import 'dotenv/config';

const config = {
  app: {
    port: process.env.PORT
  },

  db: {
    main: {
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectionLimit: 10
    },
    mssql: {
      user: process.env.MSSQL_USER,
      password: process.env.MSSQL_PASSWORD,
      server: process.env.MSSQL_HOST,
      database: process.env.MSSQL_DATABASE,
      options: {
        encrypt: false,
        trustServerCertificate: true
      }
    }
  }, 

  jwt: {
    secret: process.env.JWT_KEY
  }
};

export default config;