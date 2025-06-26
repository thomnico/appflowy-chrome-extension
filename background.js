// Background service worker for AppFlowy Web Clipper Prototype
// Handles context menu creation and background tasks

// Create context menu for quick access to clipping
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'createContextMenu') {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'appFlowyClipperMenu',
        title: 'Clip to AppFlowy',
        contexts: ['all']
      });
      chrome.contextMenus.create({
        id: 'appFlowyClipperSelection',
        title: 'Clip Selection to AppFlowy',
        contexts: ['selection']
      });
    });
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'appFlowyClipperMenu') {
    // Note: Chrome extensions cannot programmatically open popups from context menus
    // Users need to click the extension icon to open the popup
    console.log('Context menu clicked - please click the extension icon to open the clipper');
  } else if (info.menuItemId === 'appFlowyClipperSelection') {
    console.log('Selection context menu clicked - please click the extension icon to clip selection');
  }
});

// Listen for extension installation or update
chrome.runtime.onInstalled.addListener(() => {
  console.log('AppFlowy Web Clipper Prototype installed or updated.');
  // Initialize context menu on install
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'appFlowyClipperMenu',
      title: 'Clip to AppFlowy',
      contexts: ['all']
    });
    chrome.contextMenus.create({
      id: 'appFlowyClipperSelection',
      title: 'Clip Selection to AppFlowy',
      contexts: ['selection']
    });
  });
});
