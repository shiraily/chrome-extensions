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
              console.error('Error sending message:', chrome.runtime.lastError);
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
