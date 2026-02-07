import express from "express";
import { dbConnection } from "./Database/dbConnection.js";
import { bootstrap } from "./src/bootstrap.js";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";

dotenv.config();
const app = express();

// configure allowed origins via environment variable (comma separated)
// e.g. ALLOWED_ORIGINS=https://zsindia.com,https://admin.zsindia.com,http://localhost:3000
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS || 
  'https://zsindia.com,https://admin.zsindia.com,https://www.zsindia.com,http://localhost:3000,http://localhost:3001'
)
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

/**
 * ❌ REMOVED
 * This breaks CORS because credentials=true cannot be used with '*'
 *
 * app.use('/api/v1/serial-numbers/verify', cors({
 *   origin: '*',
 *   methods: ['GET']
 * }));
 */

// 🔧 FIX: single global CORS config
const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin like mobile apps or curl
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, origin); // 🔧 FIX: reflect exact origin
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'token', 'Cache-Control'],
};

// 🔧 FIX: apply CORS BEFORE routes
app.use(cors(corsOptions));

// 🔧 FIX: explicitly allow preflight requests
app.options('*', cors(corsOptions));

const port = 5000;

// app.post('/webhook', express.raw({type: 'application/json'}),createOnlineOrder );
// app.use(express.json());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan("dev"));
app.use(express.static("uploads"));

bootstrap(app);
dbConnection();

app.listen(process.env.PORT || port, () =>
  console.log(`ZS India app listening on port ${port}!`)
);
