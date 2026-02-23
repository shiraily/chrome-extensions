// Background script for Chrome Extension (Manifest V3)
// Handles extension icon clicks and sends messages to content script

chrome.action.onClicked.addListener((tab) => {
  // Check if the tab has a valid ID and is a YouTube page
  if (tab.id && tab.url?.includes('youtube.com')) {
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
});

console.log('Background script loaded');
