// Popup script for AppFlowy Web Clipper Prototype
document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const pageTitle = document.getElementById('pageTitle');
  const pageUrl = document.getElementById('pageUrl');
  const pageDescription = document.getElementById('pageDescription');
  const pageAuthor = document.getElementById('pageAuthor');
  const pageDate = document.getElementById('pageDate');
  const contentPreview = document.getElementById('contentPreview');
  const clipSelectionCheckbox = document.getElementById('clipSelection');
  const destinationSelect = document.getElementById('destination');
  const notesInput = document.getElementById('notes');
  const tagsInput = document.getElementById('tags');
  const saveBtn = document.getElementById('saveBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const notification = document.getElementById('notification');
  
  let currentPageData = null;

  // Load page data when popup opens
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'getPageData', isSelection: clipSelectionCheckbox.checked }, (response) => {
        if (response) {
          currentPageData = response;
          updatePopupUI(response);
        } else {
          showNotification('Error: Could not retrieve page data.', 'error');
        }
      });
    }
  });

  // Update UI with page data
  function updatePopupUI(data) {
    pageTitle.textContent = data.metadata.title || 'Untitled';
    pageUrl.textContent = data.metadata.url || 'No URL';
    pageDescription.textContent = data.metadata.description || 'No description available';
    pageAuthor.textContent = data.metadata.author || 'Unknown';
    pageDate.textContent = data.metadata.date || 'Not available';
    
    // Show a snippet of the content for preview (limit to a reasonable length)
    if (data.content.length > 500) {
      contentPreview.innerHTML = data.content.substring(0, 500) + '...';
    } else {
      contentPreview.innerHTML = data.content || '<p>No content captured.</p>';
    }
  }

  // Listen for selection checkbox change
  clipSelectionCheckbox.addEventListener('change', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getPageData', isSelection: clipSelectionCheckbox.checked }, (response) => {
          if (response) {
            currentPageData = response;
            updatePopupUI(response);
          }
        });
      }
    });
  });

  // Save button click handler
  saveBtn.addEventListener('click', () => {
    if (!currentPageData) {
      showNotification('Error: No page data to save.', 'error');
      return;
    }

    const clipData = {
      metadata: currentPageData.metadata,
      content: currentPageData.content,
      destination: destinationSelect.value,
      notes: notesInput.value,
      tags: tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag),
      timestamp: new Date().toISOString()
    };

    // For prototype, simulate saving to AppFlowy by storing locally
    chrome.storage.local.get({ clips: [] }, (result) => {
      const clips = result.clips;
      clips.push(clipData);
      chrome.storage.local.set({ clips: clips }, () => {
        showNotification('Content saved to AppFlowy (mock).', 'success');
        setTimeout(() => {
          window.close(); // Close popup
        }, 1500);
      });
    });

    // In a real implementation, this would interact with AppFlowy's API or WASM module
    // For now, it's a mock save operation
  });

  // Cancel button click handler
  cancelBtn.addEventListener('click', () => {
    window.close(); // Close popup
  });

  // Show notification
  function showNotification(message, type) {
    notification.textContent = message;
    notification.className = `notification ${type}`;
    setTimeout(() => {
      notification.className += ' hidden';
    }, 3000);
  }
});
