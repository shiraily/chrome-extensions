// Content script for YouTube comment extraction and translation
// Only runs on YouTube pages (*://*.youtube.com/*)

interface CommentData {
  text: string;
  likeCount: number;
  element: Element;
}

/**
 * YouTubeコメントDOMからテキストとlike数を抽出
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
    let likeCount = 0;
    if (likeElement && likeElement.textContent) {
      let raw = likeElement.textContent.trim().replace(/,/g, '');
      if (/万/.test(raw)) {
        const num = parseFloat(raw.replace('万', ''));
        likeCount = Math.round(num * 10000);
      } else {
        likeCount = parseInt(raw, 10);
        if (isNaN(likeCount)) likeCount = 0;
      }
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
  
  const allComments = extractCommentsFromDOM();
  console.log(`Extracted ${allComments.length} total comments`);
  let koreanComments = filterKoreanComments(allComments);
  koreanComments = koreanComments.filter((comment) => {
    const next = comment.element.nextElementSibling;
    return !(
      next &&
      next.classList && next.classList.contains('kpop-yt-translated')
    );
  });
  console.log(`Found ${koreanComments.length} Korean comments (excluding already translated)`);
  let percent = 20;
  let likeThreshold = 1000;
  try {
    const result = await chrome.storage.local.get(['topPercent', 'likeThreshold']);
    if (result.topPercent !== undefined && !isNaN(result.topPercent)) {
      percent = Number(result.topPercent);
    }
    if (result.likeThreshold !== undefined && !isNaN(result.likeThreshold)) {
      likeThreshold = Number(result.likeThreshold);
    }
  } catch (e) {}
  const topCommentsSet = new Set(
    getTopPercentByLikes(koreanComments, percent).map(c => c.text)
  );
  const thresholdComments = koreanComments.filter(c => c.likeCount >= likeThreshold);
  thresholdComments.forEach(c => topCommentsSet.add(c.text));
  const topComments = koreanComments.filter(c => topCommentsSet.has(c.text));
  console.log(`Selected top ${topComments.length} comments (top ${percent}% or >=${likeThreshold} likes)`);
  const translations: Array<{ original: string; translated: string; likes: number; element: Element }> = [];

  for (const comment of topComments) {
    const translated = await translateWithDeepL(comment.text);
    translations.push({
      original: comment.text,
      translated: translated,
      likes: comment.likeCount,
      element: comment.element,
    });
  }
  console.log('Translation results:', translations);
  translations.forEach((t) => {
    if (t.element) {
      const translationDiv = document.createElement('div');
      translationDiv.textContent = `🇯🇵 ${t.translated}`;
      translationDiv.classList.add('kpop-yt-translated');
      translationDiv.style.background = '#e3e5e8';
      translationDiv.style.margin = '4px 0 8px 0';
      translationDiv.style.padding = '4px 12px';
      translationDiv.style.fontSize = '0.95em';
      translationDiv.style.color = '#222';
      translationDiv.style.borderRadius = '4px';
      translationDiv.style.display = 'block';
      translationDiv.style.maxWidth = '90%';
      translationDiv.style.width = 'fit-content';
      translationDiv.style.margin = '4px 0 8px 0';
      t.element.parentNode?.insertBefore(translationDiv, t.element.nextSibling);
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
