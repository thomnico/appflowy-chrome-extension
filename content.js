// Content script for AppFlowy Web Clipper Prototype
// This script runs on web pages to scrape content and metadata

// Function to extract metadata from the page
function extractMetadata() {
  const metadata = {
    title: document.title || 'Untitled Page',
    url: window.location.href,
    description: '',
    author: '',
    date: ''
  };

  // Extract description from meta tags
  const descriptionMeta = document.querySelector('meta[name="description"]') || 
                         document.querySelector('meta[property="og:description"]');
  if (descriptionMeta) {
    metadata.description = descriptionMeta.getAttribute('content');
  }

  // Extract author from meta tags
  const authorMeta = document.querySelector('meta[name="author"]');
  if (authorMeta) {
    metadata.author = authorMeta.getAttribute('content');
  }

  // Extract publication date from meta tags or other elements
  const dateMeta = document.querySelector('meta[property="article:published_time"]');
  if (dateMeta) {
    metadata.date = dateMeta.getAttribute('content');
  }

  return metadata;
}

// Function to extract full page content or selected content
function extractContent(isSelection = false) {
  let content = '';
  
  if (isSelection && window.getSelection && window.getSelection().toString().trim().length > 0) {
    const selection = window.getSelection();
    if (!selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      // Create a wrapper to preserve structure
      const div = document.createElement('div');
      div.appendChild(range.cloneContents());
      content = div.innerHTML;
    }
  } else {
    // Extract main content (simplified for prototype)
    const body = document.body;
    // Remove scripts and styles to avoid unwanted content
    const clone = body.cloneNode(true);
    const scripts = clone.querySelectorAll('script, style');
    scripts.forEach(script => script.remove());
    content = clone.innerHTML;
  }
  
  return content;
}

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageData') {
    const data = {
      metadata: extractMetadata(),
      content: extractContent(request.isSelection || false)
    };
    sendResponse(data);
  }
});

// Add context menu for quick clipping
const contextMenuId = 'appFlowyClipperContextMenu';
if (!document.getElementById(contextMenuId)) {
  chrome.runtime.sendMessage({ action: 'createContextMenu' });
}
