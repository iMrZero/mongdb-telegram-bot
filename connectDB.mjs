import { MongoClient } from "mongodb";

// Use environment variables for sensitive connection info
const MONGODB_URI = process.env.DATABASE_URL;
const DB_NAME = "Cluster0"; // Or your actual database name
const COLLECTION_NAME = "articles";

let client;
let articlesCollection;

export async function connectToDB() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set in environment variables.");
  }

  // Reuse existing connection if possible (less critical for short-lived cron, but good practice)
  if (client && articlesCollection) {
    // If you need to check if it's still alive:
    // try { await client.db().admin().ping(); } catch { /* reconnect below */ }
    return { client, articlesCollection };
  }

  client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    articlesCollection = db.collection(COLLECTION_NAME);

    return { client, articlesCollection };
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    // Ensure client is closed on failure
    if (client) {
      await client.close();
    }
    throw error;
  }
}
