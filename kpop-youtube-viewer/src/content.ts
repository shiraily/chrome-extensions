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
  // 実際のYouTubeコメントDOMから取得
  const threads = document.querySelectorAll('ytd-comment-thread-renderer');
  const comments: CommentData[] = [];
  threads.forEach(thread => {
    const textElement = thread.querySelector('#content-text .yt-core-attributed-string');
    const text = textElement && textElement.textContent 
      ? textElement.textContent.trim() 
      : '';

    const likeElement = thread.querySelector('#vote-count-middle');
    // カンマ区切りや空白を除去し数値化
    let likeCount = 0;
    if (likeElement && likeElement.textContent) {
      const raw = likeElement.textContent.trim().replace(/,/g, '');
      likeCount = parseInt(raw, 10);
      if (isNaN(likeCount)) likeCount = 0;
    }

    if (text) {
      comments.push({
        text,
        likeCount,
        element: textElement as Element
      });
    }
  });
  return comments;
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
/**
 * Calculates the top X% of comments by like count
 * @param comments Array of comments with like counts
 * @param percent Percentage (1-100)
 * @returns Top X% of comments sorted by like count (descending)
 */
function getTopPercentByLikes(comments: CommentData[], percent: number): CommentData[] {
  if (comments.length === 0) {
    return [];
  }
  const sortedComments = [...comments].sort((a, b) => b.likeCount - a.likeCount);
  const topCount = Math.ceil(sortedComments.length * (percent / 100));
  return sortedComments.slice(0, topCount);
}

/**
 * Dummy function to translate text using DeepL API
 * This is a placeholder for actual API integration
 */
async function translateWithDeepL(text: string): Promise<string> {
  // background経由でDeepL翻訳（APIキーはbackgroundで取得）
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        action: 'deeplTranslate',
        text
      },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response && response.success) {
          resolve(response.translated);
        } else {
          reject(new Error(response && response.error ? response.error : 'Unknown error'));
        }
      }
    );
  });
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
  
  // Step 3: Get top % by like count (from storage, default 20)
  let percent = 20;
  try {
    const result = await chrome.storage.local.get(['topPercent']);
    if (result.topPercent !== undefined && !isNaN(result.topPercent)) {
      percent = Number(result.topPercent);
    }
  } catch (e) {}
  const topComments = getTopPercentByLikes(koreanComments, percent);
  console.log(`Selected top ${topComments.length} comments (${percent}% of Korean comments)`);
  
  // Step 4: Translate selected comments
  const translations: Array<{ original: string; translated: string; likes: number }> = [];
  
  for (const comment of topComments) {
    const translated = await translateWithDeepL(comment.text);
    translations.push({
      original: comment.text,
      translated: translated,
      likes: comment.likeCount,
    });
  }
  
  // Step 5: Display results
  console.log('Translation results:', translations);
  
  // Display translations near original comments in the DOM
  translations.forEach((t) => {
    // Find the comment element by matching text
    const comment = koreanComments.find((c) => c.text === t.original);
    if (comment && comment.element) {
      // Create a translation display element
      const translationDiv = document.createElement('div');
      translationDiv.textContent = `🇯🇵 ${t.translated}`;
      translationDiv.style.background = '#f6f8fa';
      translationDiv.style.borderLeft = '3px solid #0078d7';
      translationDiv.style.margin = '4px 0 8px 0';
      translationDiv.style.padding = '4px 8px';
      translationDiv.style.fontSize = '0.95em';
      translationDiv.style.color = '#222';
      translationDiv.style.borderRadius = '4px';
      // Insert after the comment element
      comment.element.parentNode?.insertBefore(translationDiv, comment.element.nextSibling);
    }
  });
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
