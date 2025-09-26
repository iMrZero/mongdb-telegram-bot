import { MongoClient } from "mongodb";

// MongoDB connection string is retrieved from environment variables for security
const uri =
  process.env.DATABASE_URL ||
  "mongodb+srv://abdullatifrabiesoc_db_user:tzBCe5xdv44VKvIV@cluster0.adiosdp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

if (!uri) {
  throw new Error("DATABASE_URL environment variable is not set.");
}

const client = new MongoClient(uri);

// Connect to the MongoDB cluster once
async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected successfully to MongoDB Atlas");
    // Access a specific database (e.g., 'news-bot') and collection (e.g., 'articles')
    const db = client.db("news-bot"); // Replace 'news-bot' with your desired database name
    const articlesCollection = db.collection("articles");
    return { client, articlesCollection };
  } catch (e) {
    console.error("MongoDB Connection Error:", e);
    // Exit process if connection fails in a critical script like main.mjs
    // For a 24/7 bot, you might want to retry
    throw e;
  }
}

// Export a function that connects and returns the collection needed by other files
export const getDB = connectToDatabase;
