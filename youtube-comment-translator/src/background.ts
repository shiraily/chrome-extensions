// Listen for translation requests from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'deeplTranslate' && message.text) {
    chrome.storage.local.get(['deeplApiKey'], (result) => {
      const apiKey = result.deeplApiKey;
      if (!apiKey) {
        sendResponse({ success: false, error: 'DeepL API key not configured' });
        return;
      }
      fetch('https://api-free.deepl.com/v2/translate', {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          text: message.text,
          target_lang: 'JA',
        }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.translations && data.translations[0] && data.translations[0].text) {
            sendResponse({ success: true, translated: data.translations[0].text });
          } else {
            sendResponse({ success: false, error: 'DeepL translation failed' });
          }
        })
        .catch(err => {
          sendResponse({ success: false, error: err.message });
        });
    });
    return true; // async response
  }
});
// Background script for Chrome Extension (Manifest V3)
// Handles extension icon clicks and sends messages to content script

chrome.action.onClicked.addListener((tab) => {
  // Check if the tab has a valid ID and is a YouTube page
  if (tab.id && tab.url) {
    try {
      const url = new URL(tab.url);
      // Validate that the hostname is exactly youtube.com or a subdomain
      const isYouTube = url.hostname === 'youtube.com' || url.hostname.endsWith('.youtube.com');
      
      if (isYouTube) {
        // Send message to content script to trigger comment extraction
        chrome.tabs.sendMessage(
          tab.id,
          { action: 'extractAndTranslateComments' },
          (response) => {
            if (chrome.runtime.lastError) {
              const err = chrome.runtime.lastError;
              console.error('Error sending message:', err.message || JSON.stringify(err));
              return;
            }
            console.log('Message sent to content script:', response);
          }
        );
      } else {
        console.log('Extension only works on YouTube pages');
      }
    } catch (error) {
      console.error('Invalid URL:', error);
    }
  } else {
    console.log('Extension only works on YouTube pages');
  }
});

console.log('Background script loaded');
