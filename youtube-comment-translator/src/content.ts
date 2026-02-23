// Content script for YouTube comment extraction and translation
// Only runs on YouTube pages (*://*.youtube.com/*)

interface CommentData {
  text: string;
  likeCount: number;
  element: Element;
}

/**
 * Dummy function to extract comment text and like count from YouTube DOM
 * This is a placeholder for actual DOM parsing logic
 */
function extractCommentsFromDOM(): CommentData[] {
  console.log('[Placeholder] Extracting comments from YouTube DOM');
  
  // TODO: Implement actual DOM parsing logic
  // This should find comment elements and extract:
  // - Comment text from the appropriate element
  // - Like count from the like button/counter element
  
  // Example structure for YouTube comments:
  // - Comments container: #comments
  // - Individual comment: ytd-comment-thread-renderer
  // - Comment text: #content-text
  // - Like count: #vote-count-middle or similar
  
  const dummyComments: CommentData[] = [
    { text: '이것은 한국어 댓글입니다', likeCount: 100, element: document.createElement('div') },
    { text: 'This is an English comment', likeCount: 50, element: document.createElement('div') },
    { text: '또 다른 한국어 댓글', likeCount: 200, element: document.createElement('div') },
    { text: 'Another English comment', likeCount: 30, element: document.createElement('div') },
    { text: '세 번째 한국어 댓글', likeCount: 150, element: document.createElement('div') },
  ];
  
  return dummyComments;
}

/**
 * Checks if a text contains Korean characters
 */
function containsKorean(text: string): boolean {
  // Korean Unicode range: AC00-D7A3 (Hangul Syllables)
  const koreanRegex = /[\uAC00-\uD7A3]/;
  return koreanRegex.test(text);
}

/**
 * Filters comments to only those containing Korean text
 */
function filterKoreanComments(comments: CommentData[]): CommentData[] {
  return comments.filter((comment) => containsKorean(comment.text));
}

/**
 * Calculates the top 15% of comments by like count
 * @param comments Array of comments with like counts
 * @returns Top 15% of comments sorted by like count (descending)
 */
function getTop15PercentByLikes(comments: CommentData[]): CommentData[] {
  if (comments.length === 0) {
    return [];
  }
  
  // Sort by like count in descending order
  const sortedComments = [...comments].sort((a, b) => b.likeCount - a.likeCount);
  
  // Calculate top 15%
  const top15PercentCount = Math.ceil(sortedComments.length * 0.15);
  
  return sortedComments.slice(0, top15PercentCount);
}

/**
 * Dummy function to translate text using DeepL API
 * This is a placeholder for actual API integration
 */
async function translateWithDeepL(text: string, apiKey: string): Promise<string> {
  console.log('[Placeholder] Translating text with DeepL API');
  console.log('Text:', text);
  console.log('API Key:', apiKey ? '***configured***' : 'not configured');
  
  // TODO: Implement actual DeepL API call
  // Example:
  // const response = await fetch('https://api-free.deepl.com/v2/translate', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `DeepL-Auth-Key ${apiKey}`,
  //     'Content-Type': 'application/x-www-form-urlencoded',
  //   },
  //   body: new URLSearchParams({
  //     text: text,
  //     target_lang: 'JA', // or 'EN' depending on requirements
  //   }),
  // });
  // const data = await response.json();
  // return data.translations[0].text;
  
  return `[Translated] ${text}`;
}

/**
 * Main function to extract and translate Korean comments
 */
async function extractAndTranslateComments(): Promise<void> {
  console.log('Starting comment extraction and translation...');
  
  // Get DeepL API key from storage
  const result = await chrome.storage.local.get(['deeplApiKey']);
  const apiKey = result.deeplApiKey;
  
  if (!apiKey) {
    console.warn('DeepL API key not configured. Please set it in the options page.');
    alert('Please configure your DeepL API key in the extension options.');
    return;
  }
  
  // Step 1: Extract comments from DOM
  const allComments = extractCommentsFromDOM();
  console.log(`Extracted ${allComments.length} total comments`);
  
  // Step 2: Filter Korean comments
  const koreanComments = filterKoreanComments(allComments);
  console.log(`Found ${koreanComments.length} Korean comments`);
  
  // Step 3: Get top 15% by like count
  const topComments = getTop15PercentByLikes(koreanComments);
  console.log(`Selected top ${topComments.length} comments (15% of Korean comments)`);
  
  // Step 4: Translate selected comments
  const translations: Array<{ original: string; translated: string; likes: number }> = [];
  
  for (const comment of topComments) {
    const translated = await translateWithDeepL(comment.text, apiKey);
    translations.push({
      original: comment.text,
      translated: translated,
      likes: comment.likeCount,
    });
  }
  
  // Step 5: Display results
  console.log('Translation results:', translations);
  
  // TODO: Display translations in a nice UI (e.g., modal or sidebar)
  const resultsText = translations
    .map(
      (t, i) =>
        `${i + 1}. [${t.likes} likes]\nOriginal: ${t.original}\nTranslated: ${t.translated}`
    )
    .join('\n\n');
  
  alert(`Translated Top Korean Comments:\n\n${resultsText}`);
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extractAndTranslateComments') {
    console.log('Received message from background script:', message);
    extractAndTranslateComments()
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('Error during extraction/translation:', error);
        sendResponse({ success: false, error: error.message });
      });
    // Return true to indicate we'll send response asynchronously
    return true;
  }
});

console.log('Content script loaded on YouTube page');
