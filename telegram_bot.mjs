import TelegramBot from "node-telegram-bot-api/lib/telegram.js";
import { connectToDB } from "./connectDB.mjs"; // Changed import from 'db' to 'connectToDB'

// Use environment variables for production/deployment
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true ,  request: {
    agentOptions: {
      // Forces the use of IPv4 (family: 4) for API requests
      family: 4,
      keepAlive: true,
    },
  },});

let articlesCollection;

// IIFE to establish MongoDB connection on startup
(async () => {
  try {
    const { articlesCollection: collection } = await connectToDB();
    articlesCollection = collection;
  } catch (error) {
    console.error("Bot failed to connect to database:", error);
    // Optionally, shut down the bot or implement reconnection logic
  }
})();

// ... (rest of the sendMessageInChunks function)

// Removed: const stmt = db.prepare("SELECT * FROM articles");

bot.onText(/\/show/gi, async (msg) => {
  if (!articlesCollection) {
    return bot.sendMessage(
      msg.chat.id,
      "Database is not ready. Please try again in a moment."
    );
  }

  // Use MongoDB find() method to get the latest 5 articles
  const articles = await articlesCollection
    .find({}) // All articles
    .sort({ createdAt: -1 }) // Sort by newest first
    .limit(5)
    .toArray();

  if (articles.length === 0) {
    return bot.sendMessage(msg.chat.id, "No articles found yet.");
  }

  for (const article of articles) {
    // ... existing logic to send messages
    await sendMessageInChunks(
      msg.chat.id,
      `<b>🔥${article.title}</b>\n ${article.content
        .toString()
        .replaceAll(/[*\n\r]+/gi, "")}`,
      bot
    );
  }
});

bot.onText(/\/summary/gi, async (msg) => {
  if (!articlesCollection) {
    return bot.sendMessage(
      msg.chat.id,
      "Database is not ready. Please try again in a moment."
    );
  }

  // Use MongoDB find() method to get the latest 5 articles
  const articles = await articlesCollection
    .find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .toArray();

  if (articles.length === 0) {
    return bot.sendMessage(msg.chat.id, "No articles found yet.");
  }

  for (const article of articles) {
    // ... existing logic to send messages
    await bot.sendMessage(
      msg.chat.id,
      `<b>🔥${article.title}</b>\n ${article.summarize}`,
      { parse_mode: "HTML" }
    );
  }
});
