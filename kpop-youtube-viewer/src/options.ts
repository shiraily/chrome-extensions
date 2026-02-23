// Options page script for DeepL API key management
// Saves and retrieves API key from chrome.storage.local

const form = document.getElementById('options-form') as HTMLFormElement;
const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
const clearButton = document.getElementById('clear-button') as HTMLButtonElement;
const topPercentInput = document.getElementById('top-percent') as HTMLInputElement;
const statusDiv = document.getElementById('status') as HTMLDivElement;

/**
 * Display status message
 */
function showStatus(message: string, isSuccess: boolean): void {
  statusDiv.textContent = message;
  statusDiv.className = `status ${isSuccess ? 'success' : 'error'}`;
  statusDiv.style.display = 'block';
  
  // Hide status after 3 seconds
  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 3000);
}

/**
 * Load saved API key from storage
 */
async function loadSavedOptions(): Promise<void> {
  try {
    const result = await chrome.storage.local.get(['deeplApiKey', 'topPercent']);
    if (result.deeplApiKey) {
      apiKeyInput.value = result.deeplApiKey;
    }
    if (result.topPercent !== undefined) {
      topPercentInput.value = String(result.topPercent);
    } else {
      topPercentInput.value = '20';
    }
  } catch (error) {
    console.error('Error loading options:', error);
  }
}

/**
 * Save API key to storage
 */
async function saveOptions(apiKey: string, topPercent: number): Promise<void> {
  try {
    await chrome.storage.local.set({ deeplApiKey: apiKey, topPercent });
    showStatus('Settings saved successfully!', true);
  } catch (error) {
    console.error('Error saving options:', error);
    showStatus('Failed to save settings. Please try again.', false);
  }
}

/**
 * Clear API key from storage
 */
async function clearApiKey(): Promise<void> {
  try {
    await chrome.storage.local.remove(['deeplApiKey']);
    apiKeyInput.value = '';
    showStatus('API key cleared successfully!', true);
  } catch (error) {
    console.error('Error clearing API key:', error);
    showStatus('Failed to clear API key. Please try again.', false);
  }
}

// Event Listeners

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const apiKey = apiKeyInput.value.trim();
  const topPercent = parseInt(topPercentInput.value, 10);
  if (!apiKey) {
    showStatus('Please enter an API key.', false);
    return;
  }
  if (isNaN(topPercent) || topPercent < 1 || topPercent > 100) {
    showStatus('Please enter a valid percentage (1-100).', false);
    return;
  }
  saveOptions(apiKey, topPercent);
});


clearButton.addEventListener('click', () => {
  if (confirm('Are you sure you want to clear the API key and percentage?')) {
    clearApiKey();
    topPercentInput.value = '20';
    chrome.storage.local.remove(['topPercent']);
  }
});

// Load saved options on page load
loadSavedOptions();

console.log('Options page loaded');
