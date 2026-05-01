import session from "express-session";
import MySQLStoreFactory from "express-mysql-session";

const MySQLStore = MySQLStoreFactory(session);

const options = {
  host: process.env.DB_HOST,
  port: 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

const sessionStore = new MySQLStore(options);

export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  store: sessionStore, // ini penting
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 hari
    httpOnly: true,
    secure: false,
  },
});

// app.use(session({
//   secret: process.env.SESSION_SECRET!,
//   resave: false,
//   saveUninitialized: false,
//   cookie: {
//     secure: false,
//     httpOnly: true,
//     maxAge: 1000 * 60 * 60 * 24
//   }
// }));