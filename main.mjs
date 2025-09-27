import Parser from "rss-parser";
import { getDB } from "./connectDB.mjs";
import { summarize } from "./summary.mjs";
// --- Main Execution Block ---
async function main() {
  let client;

  try {
    // 1. Establish connection and get client/collection
    const { client: mongoClient, articlesCollection } = await connectToDB();
    client = mongoClient; // Save client reference for closing

    const parser = new Parser();
    const feedUrls = [
      // ... your feedUrls ...
    ];

    const feeds = await getFeeds(parser, feedUrls);

    // 2. CRITICAL FIX: AWAIT the insert function
    await insertFeeds(articlesCollection, feeds);

    console.log("Feeds successfully processed and inserted.");
  } catch (error) {
    console.error("An error occurred during the cron job:", error);
    // Exit with an error code if something fails
    process.exit(1);
  } finally {
    // 3. CRITICAL FIX: Ensure the connection is closed after all work is complete
    if (client) {
      await client.close();
      console.log("MongoDB connection closed.");
    }
  }
}

// Execute the main async function
main();
async function getFeeds(urls) {
  let feedsContent = [];
  for (const url of urls) {
    try {
      const listOfFeeds = await parser.parseURL(url);
      feedsContent.push(listOfFeeds);
      // console.log(listOfFeeds.title);
    } catch (error) {
      console.error(`parsing error on ${url}`);
    }
  }
  return feedsContent;
}
// 4. IMPORTANT: Update the function signature and use MongoDB insert methods
async function insertFeeds(articlesCollection, feeds) {
  // Array to hold all documents to be inserted
  const documentsToInsert = [];

  for (const feed of feeds) {
    // ... (your existing feed processing logic) ...

    for (const item of feed.items) {
      const summaryText = await summarize(item.content);

      // Create a document object for MongoDB
      documentsToInsert.push({
        title: item.title,
        desc: item.contentSnippet, // Assuming you want a snippet for desc
        content: item.content,
        summarize: summaryText,
        link: item.link,
        createdAt: new Date(), // Add a timestamp for sorting
      });
    }
  }

  if (documentsToInsert.length > 0) {
    // Insert all articles in one go
    // NOTE: Consider using updateMany or bulkWrite to prevent duplicates in a real cron job
    const result = await articlesCollection.insertMany(documentsToInsert, {
      ordered: false,
    });
    console.log(`Inserted ${result.insertedCount} new articles.`);
  }
}
// ... (rest of the file content)
// Ensure the main logic is wrapped in an async function to use await
// (async () => {
//   const feeds = await getFeeds(feedUrls);
//   await insertFeeds(feeds); // Wait for insertion to complete
// })();
