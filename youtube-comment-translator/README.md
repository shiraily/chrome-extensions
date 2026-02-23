# K-pop Viewer

Chrome extension to view and translate K-pop related Korean comments from YouTube using DeepL API.

## Features

- Extracts comments from YouTube videos
- Filters comments containing Korean text
- Selects top 15% of Korean comments by like count
- Translates selected comments using DeepL API
- Configurable API key through options page

## Development

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Setup

1. Install dependencies:
```bash
npm install
```

2. Build the extension:
```bash
npm run build
```

3. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` directory

### Development Mode

To watch for changes during development:
```bash
npm run dev
```

## Configuration

1. Click the extension icon in Chrome toolbar
2. Select "Options" or right-click and choose "Options"
3. Enter your DeepL API key
4. Click "Save Settings"

Get your DeepL API key from: https://www.deepl.com/pro-api

## Usage

1. Navigate to any YouTube video page
2. Click the extension icon in the Chrome toolbar
3. The extension will:
   - Extract all comments from the page
   - Filter comments containing Korean text
   - Select the top 15% by like count
   - Translate them using your configured DeepL API key
   - Display the results

## Project Structure

```
youtube-comment-translator/
├── src/
│   ├── background.ts    # Background service worker
│   ├── content.ts       # Content script for YouTube pages
│   └── options.ts       # Options page script
├── public/
│   ├── manifest.json    # Extension manifest
│   ├── options.html     # Options page UI
│   └── icons/           # Extension icons (to be added)
├── dist/                # Built extension (generated)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .gitignore
```

## TODO

- [ ] Implement actual YouTube DOM parsing logic
- [ ] Implement real DeepL API integration
- [ ] Add extension icons
- [ ] Create better UI for displaying translations
- [ ] Add error handling and retry logic
- [ ] Add unit tests

## License

MIT License - See LICENSE file for details
