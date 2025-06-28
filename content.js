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

// Visual Selection Tool for Phase 3
// Initialize overlay for visual selection
function initializeSelectionOverlay() {
  // Create overlay div
  const overlay = document.createElement('div');
  overlay.id = 'appFlowySelectionOverlay';
  overlay.style.position = 'absolute';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 255, 0.1)';
  overlay.style.zIndex = '9999';
  overlay.style.cursor = 'crosshair';
  overlay.style.display = 'none'; // Hidden by default
  
  // Add overlay to body
  document.body.appendChild(overlay);
  
  // Initialize highlight box
  const highlightBox = document.createElement('div');
  highlightBox.id = 'appFlowyHighlightBox';
  highlightBox.style.position = 'absolute';
  highlightBox.style.border = '2px dashed #00ff00';
  highlightBox.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
  highlightBox.style.zIndex = '10000';
  highlightBox.style.display = 'none'; // Hidden by default
  document.body.appendChild(highlightBox);
  
  // Add event listeners for selection
  overlay.addEventListener('click', handleOverlayClick);
  document.addEventListener('mousemove', handleMouseMove);
}

// Handle overlay click for selection
function handleOverlayClick(event) {
  event.preventDefault();
  event.stopPropagation();
  
  const targetElement = document.elementFromPoint(event.clientX, event.clientY);
  if (targetElement && targetElement !== document.body && targetElement !== document.documentElement) {
    // Check if there's a text selection
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
      selectTextRange(selection);
    } else {
      selectElement(targetElement);
    }
  }
  
  // Hide overlay after selection
  document.getElementById('appFlowySelectionOverlay').style.display = 'none';
}

// Select text range and wrap it for identification
function selectTextRange(selection) {
  if (selection.isCollapsed) return;
  
  const range = selection.getRangeAt(0);
  if (range.collapsed || range.startContainer === range.endContainer) return;
  
  // Create a unique identifier for the text selection
  const selectionId = `appFlowy-text-selected-${Date.now()}`;
  
  // Wrap the selection in a span to mark it
  const span = document.createElement('span');
  span.id = selectionId;
  span.style.backgroundColor = 'rgba(0, 255, 0, 0.3)';
  span.style.userSelect = 'none';
  
  // Preserve the selection content
  const div = document.createElement('div');
  div.appendChild(range.cloneContents());
  const content = div.innerHTML;
  
  // Store selection in state
  const selectionInfo = {
    id: selectionId,
    type: 'text',
    xpath: getXPath(range.commonAncestorContainer),
    startOffset: range.startOffset,
    endOffset: range.endOffset,
    timestamp: Date.now(),
    content: content
  };
  
  selectedElements.push(selectionInfo);
  
  // Send selection data to popup or background
  chrome.runtime.sendMessage({
    action: 'elementSelected',
    selectionId: selectionId,
    elementInfo: selectionInfo
  });
  
  // Clear the selection to prevent interference with further selections
  selection.removeAllRanges();
}

// Handle mouse move for highlighting
function handleMouseMove(event) {
  const overlay = document.getElementById('appFlowySelectionOverlay');
  if (overlay && overlay.style.display !== 'none') {
    const targetElement = document.elementFromPoint(event.clientX, event.clientY);
    if (targetElement && targetElement !== document.body && targetElement !== document.documentElement) {
      highlightElement(targetElement);
    }
  }
}

// Highlight element under cursor
function highlightElement(element) {
  const highlightBox = document.getElementById('appFlowyHighlightBox');
  if (highlightBox) {
    const rect = element.getBoundingClientRect();
    highlightBox.style.top = `${rect.top + window.scrollY}px`;
    highlightBox.style.left = `${rect.left + window.scrollX}px`;
    highlightBox.style.width = `${rect.width}px`;
    highlightBox.style.height = `${rect.height}px`;
    highlightBox.style.display = 'block';
  }
}

// Selection state management
let selectedElements = [];

// Select element and store for clipping
function selectElement(element) {
  // Add a unique identifier to the selected element for later retrieval
  const selectionId = `appFlowy-selected-${Date.now()}`;
  element.setAttribute('data-appflowy-selection', selectionId);
  
  // Store selection in state
  const selectionInfo = {
    id: selectionId,
    type: 'element',
    tagName: element.tagName,
    className: element.className,
    elementId: element.id,
    xpath: getXPath(element),
    timestamp: Date.now(),
    content: element.outerHTML
  };
  
  selectedElements.push(selectionInfo);
  
  // Send selection data to popup or background
  chrome.runtime.sendMessage({
    action: 'elementSelected',
    selectionId: selectionId,
    elementInfo: selectionInfo
  });
}

// Remove a selection from state
function removeSelection(selectionId) {
  const index = selectedElements.findIndex(sel => sel.id === selectionId);
  if (index !== -1) {
    const element = document.querySelector(`[data-appflowy-selection="${selectionId}"]`);
    if (element) {
      element.removeAttribute('data-appflowy-selection');
    }
    selectedElements.splice(index, 1);
    chrome.runtime.sendMessage({
      action: 'selectionRemoved',
      selectionId: selectionId
    });
  }
}

// Clear all selections
function clearSelections() {
  selectedElements.forEach(sel => {
    const element = document.querySelector(`[data-appflowy-selection="${sel.id}"]`);
    if (element) {
      element.removeAttribute('data-appflowy-selection');
    }
  });
  selectedElements = [];
  chrome.runtime.sendMessage({
    action: 'selectionsCleared'
  });
}

// Get current selections
function getSelections() {
  return selectedElements;
}

// Expand selection to include parent or sibling elements (basic implementation)
function expandSelection(selectionId, direction = 'parent') {
  const selection = selectedElements.find(sel => sel.id === selectionId);
  if (!selection) return;
  
  const element = document.querySelector(`[data-appflowy-selection="${selectionId}"]`);
  if (!element) return;
  
  let expandedElement = element;
  if (direction === 'parent' && element.parentElement) {
    expandedElement = element.parentElement;
  } else if (direction === 'next' && element.nextElementSibling) {
    expandedElement = element.nextElementSibling;
  } else if (direction === 'prev' && element.previousElementSibling) {
    expandedElement = element.previousElementSibling;
  }
  
  if (expandedElement !== element) {
    // Update selection state
    removeSelection(selectionId);
    selectElement(expandedElement);
  }
}

// Get XPath for an element (for robust selection recovery)
function getXPath(element) {
  if (!element) return '';
  
  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }
  
  if (element === document.body) {
    return '/html/body';
  }
  
  let ix = 0;
  const siblings = element.parentNode.childNodes;
  
  for (let i = 0; i < siblings.length; i++) {
    const sibling = siblings[i];
    if (sibling === element) {
      return `${getXPath(element.parentNode)}/${element.tagName.toLowerCase()}[${ix + 1}]`;
    }
    
    if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
      ix++;
    }
  }
  
  return '';
}

// Function to start visual selection mode
function startVisualSelection(mode = 'element') {
  const overlay = document.getElementById('appFlowySelectionOverlay');
  if (overlay) {
    overlay.style.display = 'block';
    overlay.setAttribute('data-selection-mode', mode);
  }
}

// Initialize the selection overlay when the content script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSelectionOverlay);
} else {
  initializeSelectionOverlay();
}

// Listen for messages to start visual selection and manage selections
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageData') {
    const data = {
      metadata: extractMetadata(),
      content: extractContent(request.isSelection || false)
    };
    sendResponse(data);
  } else if (request.action === 'startVisualSelection') {
    startVisualSelection(request.mode || 'element');
  } else if (request.action === 'getSelections') {
    sendResponse(getSelections());
  } else if (request.action === 'removeSelection') {
    removeSelection(request.selectionId);
  } else if (request.action === 'clearSelections') {
    clearSelections();
  } else if (request.action === 'expandSelection') {
    expandSelection(request.selectionId, request.direction);
  } else if (request.action === 'getSelectionContent') {
    const selection = selectedElements.find(sel => sel.id === request.selectionId);
    if (selection) {
      sendResponse({ content: selection.content });
    } else {
      sendResponse({ content: null });
    }
  }
});
