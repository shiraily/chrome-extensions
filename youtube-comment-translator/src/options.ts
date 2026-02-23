// Options page script for DeepL API key management
// Saves and retrieves API key from chrome.storage.local

const form = document.getElementById('options-form') as HTMLFormElement;
const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
const clearButton = document.getElementById('clear-button') as HTMLButtonElement;
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
async function loadSavedApiKey(): Promise<void> {
  try {
    const result = await chrome.storage.local.get(['deeplApiKey']);
    if (result.deeplApiKey) {
      apiKeyInput.value = result.deeplApiKey;
    }
  } catch (error) {
    console.error('Error loading API key:', error);
  }
}

/**
 * Save API key to storage
 */
async function saveApiKey(apiKey: string): Promise<void> {
  try {
    await chrome.storage.local.set({ deeplApiKey: apiKey });
    showStatus('Settings saved successfully!', true);
  } catch (error) {
    console.error('Error saving API key:', error);
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
  
  if (!apiKey) {
    showStatus('Please enter an API key.', false);
    return;
  }
  
  saveApiKey(apiKey);
});

clearButton.addEventListener('click', () => {
  if (confirm('Are you sure you want to clear the API key?')) {
    clearApiKey();
  }
});

// Load saved API key on page load
loadSavedApiKey();

console.log('Options page loaded');
