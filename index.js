const { TwitterApi } = require('twitter-api-v2');

async function run() {
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;

    // 1. GENERATE CAPTION WITH GEMINI
    console.log("Generating caption with Gemini...");
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiKey}`;
    const prompt = "Write a short, engaging tweet (under 200 characters) about automotive tech or vehicle engineering. Include 2 relevant hashtags. Do not include quotes or emojis.";

    const aiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const aiData = await aiRes.json();
    if (!aiRes.ok) throw new Error(`Gemini Error: ${JSON.stringify(aiData)}`);
    const caption = aiData.candidates[0].content.parts[0].text.trim();
    console.log("Generated Caption:\n", caption);

    // 2. FETCH RELEVANT IMAGE FROM UNSPLASH
    console.log("Fetching image from Unsplash...");
    const unsplashRes = await fetch(
      `https://api.unsplash.com/photos/random?query=automotive+engine+technology&orientation=landscape&client_id=${unsplashKey}`
    );
    const unsplashData = await unsplashRes.json();
    if (!unsplashRes.ok) throw new Error(`Unsplash Error: ${JSON.stringify(unsplashData)}`);
    const imageUrl = unsplashData.urls.regular;

    // 3. UPLOAD MEDIA & TWEET VIA X API
    console.log("Initializing Twitter client...");
    const twitterClient = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
    });

    console.log("Downloading image buffer...");
    const imgResponse = await fetch(imageUrl);
    const arrayBuffer = await imgResponse.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    console.log("Uploading media buffer to X...");
    const mediaId = await twitterClient.v1.uploadMedia(imageBuffer, { mimeType: 'image/jpeg' });

    console.log("Publishing tweet...");
    const tweet = await twitterClient.v2.tweet({
      text: caption,
      media: { media_ids: [mediaId] }
    });

    console.log("Tweet published successfully! ID:", tweet.data.id);
  } catch (error) {
    console.error("Pipeline failed:", error);
    process.exit(1);
  }
}

run();
