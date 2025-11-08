import mongoose from "mongoose";

export async function dbConnection() {
  try {
    const uri = process.env.MONGO_URL;
    if (!uri) {
      throw new Error("MONGO_URI is not defined in environment");
    }

    // Mongoose v6+ uses sane defaults; keep options if you need them
    await mongoose.connect(uri);

    console.log("DB connected successfully");

    // Optional: handle disconnects / errors
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected");
    });

    // Graceful shutdown for production (SIGINT, SIGTERM)
    const shutdown = async (signal) => {
      try {
        await mongoose.connection.close(false);
        console.log(`MongoDB connection closed (${signal})`);
        process.exit(0);
      } catch (err) {
        console.error("Error during MongoDB shutdown", err);
        process.exit(1);
      }
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (err) {
    // Avoid leaking sensitive info; log minimal message and rethrow
    console.error("Failed to connect to DB");
    throw err;
  }
}