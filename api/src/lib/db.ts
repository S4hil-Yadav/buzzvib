import mongoose from "mongoose";

interface Logger {
  logInfo?: (msg: string) => void;
  logError?: (msg: string) => void;
}

export async function connectDB(logger?: Logger) {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    (logger?.logInfo ?? console.log)("Connected to MongoDB:", conn.connection.host);
  } catch (error) {
    (logger?.logError ?? console.error)("MongoDB connection error:", error);
    process.exit(1);
  }
}
