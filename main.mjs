import Parser from "rss-parser";
import { getDB } from "./connectDB.mjs";
import { summarize } from "./summary.mjs";
const parser = new Parser();
const feedUrls = [
  "https://css-tricks.com/feed/",
  "https://developer.chrome.com/feed.xml",
  "https://www.smashingmagazine.com/feed/",
  "https://javascriptweekly.com/rss/",
];
const feeds = await getFeeds(feedUrls);
insertFeeds(feeds);
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
async function insertFeeds(feeds) {
  // 1. Get the collection object from the connection function
  const { client, articlesCollection } = await getDB();

  // We will collect all articles to insert them in a single batch
  const articlesToInsert = [];

  for (const feed of feeds) {
    const title = feed.title;
    const desc = feed.description;
    const link = feed.link;
    const content = feed.items
      .map((item) => item.content)
      .join(" ")
      .replaceAll(/<[^>]*>/g, ""); // Strips HTML tags

    // Skip if link already exists (basic deduplication)
    const existingArticle = await articlesCollection.findOne({ link: link });
    if (existingArticle) {
      console.log(`Skipping existing article: ${title}`);
      continue;
    }

    console.log(`Summarizing ${title}...`);
    const summarizedContent = await summarize(content);

    articlesToInsert.push({
      title: title,
      desc: desc,
      content: content,
      summarize: summarizedContent,
      link: link,
      // Add a timestamp for ordering
      createdAt: new Date(),
    });
  }

  if (articlesToInsert.length > 0) {
    // 2. Insert all new articles in one go
    const result = await articlesCollection.insertMany(articlesToInsert);
    console.log(`Successfully inserted ${result.insertedCount} new articles.`);
  } else {
    console.log("No new articles to insert.");
  }

  // Close the connection when the script finishes (Important for GitHub Actions)
  await client.close();
}

// ... (rest of the file content)
// Ensure the main logic is wrapped in an async function to use await
(async () => {
  const feeds = await getFeeds(feedUrls);
  await insertFeeds(feeds); // Wait for insertion to complete
})();
