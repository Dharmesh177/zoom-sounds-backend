import express from "express";
import { dbConnection } from "./Database/dbConnection.js";
import { bootstrap } from "./src/bootstrap.js";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from 'cors'

dotenv.config();
const app = express();
// configure allowed origins via environment variable (comma separated)
// e.g. ALLOWED_ORIGINS=https://zsindia.com,https://admin.zsindia.com
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'https://zsindia.com').split(',').map(s => s.trim()).filter(Boolean);

app.use('/api/v1/serial-numbers/verify', cors({
  origin: '*',
  methods: ['GET']
}));

// whitelist function for CORS
const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin like mobile apps or curl
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

const port = 5000;
// app.post('/webhook', express.raw({type: 'application/json'}),createOnlineOrder );
// app.use(express.json());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan("dev"));
app.use(express.static("uploads"));



bootstrap(app);
dbConnection();
app.listen(process.env.PORT || port, () => console.log(`Zoom sounds app listening on port ${port}!`));
