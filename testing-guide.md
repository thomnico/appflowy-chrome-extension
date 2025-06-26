# Testing Guide for AppFlowy Chrome Extension Prototype

## Introduction
This guide provides step-by-step instructions for testing the AppFlowy Chrome Extension prototype developed during Phase 2, "Prototype Development." The prototype includes basic web scraping functionality, a minimal popup UI for user interaction, and a mock integration with AppFlowy (using local storage). The purpose of this testing is to verify that the extension can capture web content and metadata, display it in the popup interface, allow annotations, and simulate saving to AppFlowy.

## Prerequisites
Before testing the extension, ensure you have the following:
- **Google Chrome Browser**: Version 88 or later (Manifest V3 compatible).
- **Extension Files**: All files created for the prototype, including:
  - `manifest.json`
  - `content.js`
  - `content.css`
  - `popup.html`
  - `popup.css`
  - `popup.js`
  - `background.js`
- **Development Environment**: A local directory containing the above files, accessible on your computer.

## Step 1: Loading the Extension into Chrome
Since this is a prototype and not yet published to the Chrome Web Store, you will load it as an unpacked extension in developer mode. Follow these steps:

1. **Open Chrome and Enable Developer Mode**:
   - Launch Google Chrome.
   - Navigate to `chrome://extensions/` in the address bar.
   - In the top-right corner, toggle the "Developer mode" switch to ON. This will reveal additional options like "Load unpacked."

2. **Load the Unpacked Extension**:
   - Click the "Load unpacked" button.
   - Browse to the directory containing your extension files (e.g., the folder with `manifest.json`).
   - Select the folder and click "Select Folder" (or "Open" on some systems).
   - Chrome will load the extension, and you should see "AppFlowy Web Clipper (Prototype)" appear in the extensions list with a version number of "0.1."

3. **Verify Installation**:
   - Check that the extension icon appears in the Chrome toolbar (it may be under the puzzle piece icon if you have many extensions).
   - Ensure there are no error messages in the extensions page for this extension. If errors appear (e.g., manifest issues), review the console for details by clicking "background page" under the extension's details.

## Step 2: Testing Basic Functionality
Now that the extension is loaded, test its core features: capturing web content, displaying metadata and previews, and simulating a save operation.

### 2.1 Testing Web Content Capture
1. **Navigate to a Test Website**:
   - Open a new tab and visit a simple website, such as a news article, blog post, or Wikipedia page (e.g., `https://en.wikipedia.org/wiki/Main_Page`).

2. **Open the Extension Popup**:
   - Click the extension icon in the Chrome toolbar (or under the puzzle piece icon).
   - The popup should open, displaying "AppFlowy Web Clipper (Prototype)" at the top.

3. **Verify Metadata Extraction**:
   - Check the "Page Metadata" section in the popup. It should display:
     - **Title**: The title of the current web page.
     - **URL**: The full URL of the page.
     - **Description**: Any description extracted from meta tags (if available, otherwise "No description available").
     - **Author**: Author information if available in meta tags (otherwise "Unknown").
     - **Date**: Publication date if available in meta tags (otherwise "Not available").
   - **Expected Result**: Metadata should match the page's content or show appropriate fallback text if data is missing.

4. **Verify Content Preview**:
   - Look at the "Content Preview" section. It should display a snippet of the page's HTML content (limited to 500 characters for brevity in this prototype).
   - If no content is captured, it should show "No content captured."
   - **Expected Result**: The preview should reflect the page's main content, excluding scripts and styles.

### 2.2 Testing Selection Clipping
1. **Select Text on the Page**:
   - Highlight a paragraph or a few sentences on the web page using your mouse.

2. **Check Selection Option in Popup**:
   - Reopen the popup if it's closed.
   - Check the box labeled "Clip only selected content" under the Content Preview section.
   - **Expected Result**: The Content Preview should update to show only the HTML content of your selection. If no selection is made, it falls back to the full page content.

### 2.3 Testing Context Menu
1. **Access Context Menu**:
   - Right-click anywhere on the web page (or on selected text).
   - Look for options labeled "Clip to AppFlowy" (available on all contexts) and "Clip Selection to AppFlowy" (available only when text is selected).
   - **Expected Result**: The context menu items should appear as described.

2. **Trigger Clipping via Context Menu**:
   - Select "Clip to AppFlowy" or "Clip Selection to AppFlowy" from the context menu.
   - **Note**: Due to Chrome's security model, context menu clicks may not directly open the popup in this prototype. This functionality is partially implemented in `background.js` and may require further refinement. For now, use the toolbar icon to open the popup.

### 2.4 Testing Annotations and Destination Selection
1. **Select Destination**:
   - In the "Destination in AppFlowy" section of the popup, choose a destination from the dropdown (e.g., "Default Workspace", "Workspace 1 (Mock)", or "Workspace 2 (Mock)").
   - **Expected Result**: The selection should be retained in the dropdown.

2. **Add Annotations**:
   - In the "Annotations" section, enter text in the "Notes" textarea (e.g., "This is a test clip").
   - Enter tags in the "Tags" input field, separated by commas (e.g., "test, webclip").
   - **Expected Result**: The inputs should accept text without issues.

### 2.5 Testing Save Functionality
1. **Save the Clip**:
   - Click the "Save to AppFlowy" button at the bottom-right of the popup.
   - **Expected Result**: A green notification should appear saying "Content saved to AppFlowy (mock)." After 1.5 seconds, the popup should close automatically.

2. **Verify Saved Data (Mock Integration)**:
   - Since this is a prototype without real AppFlowy integration, data is saved to Chrome's local storage.
   - To verify, reopen the popup or use Chrome's Developer Tools:
     - Press F12 or right-click and select "Inspect" on the popup (you may need to right-click the extension icon and inspect from there).
     - Go to the "Application" tab, expand "Local Storage" on the left, and select `chrome-extension://<your-extension-id>`.
     - Look for a key named `clips`. It should contain an array of saved clip objects with metadata, content, destination, notes, tags, and timestamp.
   - **Expected Result**: The saved clip should match the data you captured, including annotations and destination.

3. **Test Cancel Option**:
   - Reopen the popup, make some changes (e.g., add notes), then click "Cancel."
   - **Expected Result**: The popup should close without saving anything.

## Step 3: Testing Across Different Websites
To ensure the extension handles various web structures, test it on different types of websites:
- **Static Content**: A simple blog or news site (e.g., `https://www.bbc.com/news`).
- **Dynamic Content**: A JavaScript-heavy site like a social media platform (e.g., `https://twitter.com`).
- **Media-Rich Content**: A site with images and videos (e.g., `https://www.youtube.com`).
- **Expected Result**: The extension should capture metadata and content from all sites, though formatting and completeness may vary due to dynamic content limitations in this prototype. Note any failures or inconsistencies for future improvement.

## Step 4: Troubleshooting Common Issues
If you encounter issues during testing, consider the following:
- **Popup Doesn't Open**: Ensure the extension is loaded correctly in `chrome://extensions/`. Check for errors in the background page console (click "background page" under the extension's details).
- **Metadata or Content Missing**: Some websites may not have standard meta tags or may block content access due to security policies. This is expected in a prototype and will be addressed in later phases with more robust scraping logic.
- **Save Operation Fails**: Verify that Chrome's local storage is accessible (not blocked by browser settings). Use Developer Tools to check for errors in the console when saving.
- **Context Menu Not Working**: Due to Chrome's limitations, context menu actions may not directly trigger the popup. Use the toolbar icon as the primary access method for now.

## Step 5: Providing Feedback
As this is a prototype, your feedback is crucial for refining the extension. Note the following during testing:
- Usability of the popup interface (e.g., is it intuitive to select destinations or add notes?).
- Accuracy of metadata and content capture across different websites.
- Any errors or unexpected behaviors.
- Suggestions for additional features or improvements.

You can document feedback manually or share console logs/screenshots from Developer Tools if errors occur. This will inform the next steps in Phase 2, such as enhancing scraping capabilities or integrating with AppFlowy's actual data model.

## Conclusion
This testing guide covers the installation, usage, and verification of the AppFlowy Chrome Extension prototype. By following these steps, you can assess the basic functionality of web clipping, metadata extraction, user annotations, and mock saving to AppFlowy. The prototype serves as a foundation for further development, focusing on real integration with AppFlowy (via WebAssembly or API) and improved content handling in subsequent iterations of Phase 2.
