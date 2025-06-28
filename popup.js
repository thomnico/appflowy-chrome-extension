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
// DOM elements for notes, tags, and category
  const notesInput = document.getElementById('notes');
  const tagsInput = document.getElementById('tags');
  const cancelBtn = document.getElementById('cancelBtn');
  
  // Add category selection for offline storage
  const categoryContainer = document.createElement('div');
  categoryContainer.id = 'categoryContainer';
  categoryContainer.style.marginTop = '10px';
  
  const categoryLabel = document.createElement('label');
  categoryLabel.textContent = 'Category:';
  categoryLabel.style.display = 'block';
  categoryLabel.style.marginBottom = '5px';
  
  const categorySelect = document.createElement('select');
  categorySelect.id = 'category';
  
  // Predefined categories for offline storage (could be user-configurable in a real app)
  const categories = [
    { id: 'research', name: 'Research' },
    { id: 'personal', name: 'Personal' },
    { id: 'work', name: 'Work' },
    { id: 'other', name: 'Other' }
  ];
  
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.id;
    option.textContent = cat.name;
    categorySelect.appendChild(option);
  });
  
  categoryContainer.appendChild(categoryLabel);
  categoryContainer.appendChild(categorySelect);
  
  // Add category container after tags input
  tagsInput.parentNode.insertBefore(categoryContainer, tagsInput.nextSibling);
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

// Add button for visual selection mode
  const visualSelectionBtn = document.createElement('button');
  visualSelectionBtn.id = 'visualSelectionBtn';
  visualSelectionBtn.textContent = 'Select Element Visually';
  visualSelectionBtn.style.margin = '10px 0';
  visualSelectionBtn.style.padding = '8px 12px';
  visualSelectionBtn.style.backgroundColor = '#4CAF50';
  visualSelectionBtn.style.color = 'white';
  visualSelectionBtn.style.border = 'none';
  visualSelectionBtn.style.borderRadius = '4px';
  visualSelectionBtn.style.cursor = 'pointer';
  
  visualSelectionBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'startVisualSelection' }, (response) => {
          showNotification('Visual selection mode started. Click an element on the page to select it.', 'info');
          window.close(); // Close popup to allow selection
        });
      }
    });
  });
  
  // Add the button to the popup UI (after the checkbox for selection)
  clipSelectionCheckbox.parentNode.insertBefore(visualSelectionBtn, clipSelectionCheckbox.nextSibling);

// Add container for displaying selections
  const selectionsContainer = document.createElement('div');
  selectionsContainer.id = 'selectionsContainer';
  selectionsContainer.style.marginTop = '10px';
  selectionsContainer.style.border = '1px solid #ddd';
  selectionsContainer.style.padding = '10px';
  selectionsContainer.style.borderRadius = '4px';
  selectionsContainer.style.maxHeight = '150px';
  selectionsContainer.style.overflowY = 'auto';
  selectionsContainer.innerHTML = '<h3>Selected Elements</h3><p>No elements selected yet.</p>';
  
// Add container after content preview
  contentPreview.parentNode.insertBefore(selectionsContainer, contentPreview.nextSibling);

  // Add container for viewing stored clips
  const storedClipsContainer = document.createElement('div');
  storedClipsContainer.id = 'storedClipsContainer';
  storedClipsContainer.style.marginTop = '10px';
  storedClipsContainer.style.border = '1px solid #ddd';
  storedClipsContainer.style.padding = '10px';
  storedClipsContainer.style.borderRadius = '4px';
  storedClipsContainer.style.maxHeight = '150px';
  storedClipsContainer.style.overflowY = 'auto';
  storedClipsContainer.innerHTML = '<h3>Saved Clips</h3><p>No saved clips yet.</p>';
  
  // Add container after selections container
  selectionsContainer.parentNode.insertBefore(storedClipsContainer, selectionsContainer.nextSibling);

  // Function to update stored clips display
  function updateStoredClipsDisplay(clips, filterCategory = 'all') {
    storedClipsContainer.innerHTML = '<h3>Saved Clips</h3>';
    
    // Add filter by category
    const filterContainer = document.createElement('div');
    filterContainer.style.marginBottom = '10px';
    
    const filterLabel = document.createElement('label');
    filterLabel.textContent = 'Filter by Category: ';
    filterLabel.style.marginRight = '5px';
    
    const filterSelect = document.createElement('select');
    filterSelect.id = 'categoryFilter';
    const filterOptions = [
      { id: 'all', name: 'All Categories' },
      ...categories
    ];
    filterOptions.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.id;
      option.textContent = opt.name;
      if (opt.id === filterCategory) option.selected = true;
      filterSelect.appendChild(option);
    });
    
    filterSelect.addEventListener('change', () => {
      chrome.storage.local.get({ clips: [] }, (result) => {
        updateStoredClipsDisplay(result.clips, filterSelect.value);
      });
    });
    
    filterContainer.appendChild(filterLabel);
    filterContainer.appendChild(filterSelect);
    storedClipsContainer.appendChild(filterContainer);
    
    // Filter clips based on selected category
    const filteredClips = filterCategory === 'all' ? clips : clips.filter(clip => clip.category === filterCategory);
    
    if (filteredClips && filteredClips.length > 0) {
      const list = document.createElement('ul');
      list.style.paddingLeft = '20px';
      filteredClips.forEach((clip, index) => {
        const listItem = document.createElement('li');
        listItem.style.marginBottom = '5px';
        listItem.innerHTML = `${clip.metadata.title || 'Untitled Clip'} (${clip.category || 'Uncategorized'}) - ${new Date(clip.timestamp).toLocaleString()}`;
        
        // Add view button
        const viewBtn = document.createElement('button');
        viewBtn.textContent = 'View';
        viewBtn.style.marginLeft = '10px';
        viewBtn.style.border = 'none';
        viewBtn.style.background = 'none';
        viewBtn.style.cursor = 'pointer';
        viewBtn.addEventListener('click', () => {
          contentPreview.innerHTML = clip.content.length > 500 ? clip.content.substring(0, 500) + '...' : clip.content;
          showNotification('Clip content loaded in preview pane.', 'info');
        });
        
        // Add delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.style.marginLeft = '5px';
        deleteBtn.style.color = 'red';
        deleteBtn.style.border = 'none';
        deleteBtn.style.background = 'none';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.addEventListener('click', () => {
          chrome.storage.local.get({ clips: [] }, (result) => {
            let updatedClips = result.clips;
            // Adjust index based on original clips array
            const actualIndex = clips.indexOf(clip);
            updatedClips.splice(actualIndex, 1);
            chrome.storage.local.set({ clips: updatedClips }, () => {
              updateStoredClipsDisplay(updatedClips, filterCategory);
              showNotification('Clip deleted.', 'success');
            });
          });
        });
        
        listItem.appendChild(viewBtn);
        listItem.appendChild(deleteBtn);
        list.appendChild(listItem);
      });
      storedClipsContainer.appendChild(list);
      
      // Add clear all clips button
      const clearAllBtn = document.createElement('button');
      clearAllBtn.textContent = 'Clear All Clips';
      clearAllBtn.style.marginTop = '10px';
      clearAllBtn.style.color = 'red';
      clearAllBtn.style.border = 'none';
      clearAllBtn.style.background = 'none';
      clearAllBtn.style.cursor = 'pointer';
      clearAllBtn.addEventListener('click', () => {
        chrome.storage.local.set({ clips: [] }, () => {
          updateStoredClipsDisplay([]);
          showNotification('All clips cleared.', 'success');
        });
      });
      storedClipsContainer.appendChild(clearAllBtn);
    } else {
      storedClipsContainer.innerHTML += '<p>No saved clips yet' + (filterCategory === 'all' ? '.' : ` in category "${filterCategory}".`) + '</p>';
    }
  }

  // Fetch stored clips when popup opens
  chrome.storage.local.get({ clips: [] }, (result) => {
    updateStoredClipsDisplay(result.clips, 'all');
  });

// Add advanced destination control
  const destinationContainer = document.createElement('div');
  destinationContainer.id = 'destinationContainer';
  destinationContainer.style.marginTop = '10px';
  destinationContainer.style.border = '1px solid #ddd';
  destinationContainer.style.padding = '10px';
  destinationContainer.style.borderRadius = '4px';
  
  const destinationLabel = document.createElement('label');
  destinationLabel.textContent = 'Destination in AppFlowy:';
  destinationLabel.style.display = 'block';
  destinationLabel.style.marginBottom = '5px';
  
  const destinationSelect = document.createElement('select');
  destinationSelect.id = 'destination';
  destinationSelect.innerHTML = ''; // Clear existing options
  
  // Mock AppFlowy destinations (in a real implementation, this would fetch from AppFlowy API)
  const destinations = [
    { id: 'default', name: 'Default Notebook' },
    { id: 'project-db', name: 'Project Database' },
    { id: 'research-page', name: 'Research Page' }
  ];
  
  destinations.forEach(dest => {
    const option = document.createElement('option');
    option.value = dest.id;
    option.textContent = dest.name;
    destinationSelect.appendChild(option);
  });
  
  destinationContainer.appendChild(destinationLabel);
  destinationContainer.appendChild(destinationSelect);
  
  // Add destination container before save/cancel buttons
  const saveBtn = document.getElementById('saveBtn');
  saveBtn.parentNode.insertBefore(destinationContainer, saveBtn);

// Function to update selections display
  function updateSelectionsDisplay(selections) {
    selectionsContainer.innerHTML = '<h3>Selected Elements</h3>';
    if (selections && selections.length > 0) {
      const list = document.createElement('ul');
      list.style.paddingLeft = '20px';
      selections.forEach(sel => {
        const listItem = document.createElement('li');
        listItem.style.marginBottom = '5px';
        listItem.innerHTML = `${sel.tagName}${sel.className ? '.' + sel.className : ''}${sel.elementId ? '#' + sel.elementId : ''}`;
        
        // Add preview snippet if content is available
        if (sel.content) {
          const previewDiv = document.createElement('div');
          previewDiv.style.fontSize = '12px';
          previewDiv.style.color = '#666';
          previewDiv.style.marginTop = '2px';
          previewDiv.style.maxHeight = '50px';
          previewDiv.style.overflow = 'hidden';
          previewDiv.innerHTML = sel.content.length > 200 ? sel.content.substring(0, 200) + '...' : sel.content;
          listItem.appendChild(previewDiv);
        }
        
        // Add remove button
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.style.marginLeft = '10px';
        removeBtn.style.color = 'red';
        removeBtn.style.border = 'none';
        removeBtn.style.background = 'none';
        removeBtn.style.cursor = 'pointer';
        removeBtn.addEventListener('click', () => {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'removeSelection', selectionId: sel.id });
          });
        });
        
        // Add expand options
        const expandParentBtn = document.createElement('button');
        expandParentBtn.textContent = 'Expand to Parent';
        expandParentBtn.style.marginLeft = '5px';
        expandParentBtn.style.border = 'none';
        expandParentBtn.style.background = 'none';
        expandParentBtn.style.cursor = 'pointer';
        expandParentBtn.addEventListener('click', () => {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'expandSelection', selectionId: sel.id, direction: 'parent' });
          });
        });
        
        // Add view full content button
        const viewFullBtn = document.createElement('button');
        viewFullBtn.textContent = 'View Full';
        viewFullBtn.style.marginLeft = '5px';
        viewFullBtn.style.border = 'none';
        viewFullBtn.style.background = 'none';
        viewFullBtn.style.cursor = 'pointer';
        viewFullBtn.addEventListener('click', () => {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'getSelectionContent', selectionId: sel.id }, (response) => {
              if (response && response.content) {
                contentPreview.innerHTML = response.content;
                showNotification('Full content loaded in preview pane.', 'info');
              } else {
                showNotification('Could not load content.', 'error');
              }
            });
          });
        });
        
        listItem.appendChild(removeBtn);
        listItem.appendChild(expandParentBtn);
        listItem.appendChild(viewFullBtn);
        list.appendChild(listItem);
      });
      selectionsContainer.appendChild(list);
      
      // Add clear all button
      const clearBtn = document.createElement('button');
      clearBtn.textContent = 'Clear All Selections';
      clearBtn.style.marginTop = '10px';
      clearBtn.style.color = 'red';
      clearBtn.style.border = 'none';
      clearBtn.style.background = 'none';
      clearBtn.style.cursor = 'pointer';
      clearBtn.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'clearSelections' });
        });
      });
      selectionsContainer.appendChild(clearBtn);
    } else {
      selectionsContainer.innerHTML += '<p>No elements selected yet.</p>';
    }
  }

  // Fetch selections when popup opens and update on focus
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'getSelections' }, (response) => {
        if (response) {
          updateSelectionsDisplay(response);
        }
      });
    }
  });

  // Listen for messages from content script about selection updates
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'elementSelected' || request.action === 'selectionRemoved' || request.action === 'selectionsCleared') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'getSelections' }, (response) => {
            if (response) {
              updateSelectionsDisplay(response);
            }
          });
        }
      });
    }
  });

// Save button click handler
  saveBtn.addEventListener('click', () => {
    if (!currentPageData) {
      showNotification('Error: No page data to save.', 'error');
      return;
    }

// Prepare clip data with category for offline storage
    const clipData = {
      metadata: currentPageData.metadata,
      content: currentPageData.content,
      destination: destinationSelect.value,
      notes: notesInput.value,
      tags: tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag),
      category: categorySelect.value,
      timestamp: new Date().toISOString()
    };

    // Simulate saving to AppFlowy with destination-specific logic
    chrome.storage.local.get({ clips: [] }, (result) => {
      const clips = result.clips;
      clips.push(clipData);
      chrome.storage.local.set({ clips: clips }, () => {
        let destinationName = 'Unknown Destination';
        const selectedOption = destinationSelect.options[destinationSelect.selectedIndex];
        if (selectedOption) {
          destinationName = selectedOption.textContent;
        }
        showNotification(`Content saved to AppFlowy: ${destinationName} (mock).`, 'success');
        setTimeout(() => {
          window.close(); // Close popup
        }, 1500);
      });
    });

    // In a real implementation, this would send data to AppFlowy's API with the selected destination
    // For now, it's a mock save operation with destination feedback
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
