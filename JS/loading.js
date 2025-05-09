// Enhanced loading screen functionality
document.addEventListener('DOMContentLoaded', function() {
    const loadingScreen = document.getElementById('loadingScreen');
    const progressBar = document.getElementById('progressBar');
    const loadingPercentage = document.getElementById('loadingPercentage');
    
    // Get all resources that need to be loaded
    const images = Array.from(document.images);
    const totalResources = images.length;
    let loadedResources = 0;
    
    // If there are no images or very few, simulate loading
    if (totalResources < 5) {
        simulateLoading();
    } else {
        // Track actual resource loading
        images.forEach(img => {
            // Image already loaded
            if (img.complete) {
                resourceLoaded();
            } else {
                // Image loading
                img.addEventListener('load', resourceLoaded);
                img.addEventListener('error', resourceLoaded); // Count errors as "loaded" to avoid hanging
            }
        });
        
        // Fallback in case some resources never load
        setTimeout(completeLoading, 8000);
    }
    
    // Function to update progress when a resource is loaded
    function resourceLoaded() {
        loadedResources++;
        const percentComplete = Math.min(Math.round((loadedResources / totalResources) * 100), 100);
        updateLoadingProgress(percentComplete);
        
        if (loadedResources >= totalResources) {
            completeLoading();
        }
    }
    
    // Function to simulate loading for sites with few resources
    function simulateLoading() {
        let progress = 0;
        const increment = [5, 7, 10, 12, 15];
        const interval = setInterval(function() {
            // Get random increment from the array
            const randomIncrement = increment[Math.floor(Math.random() * increment.length)];
            progress += randomIncrement;
            
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                updateLoadingProgress(progress);
                
                // Complete loading after a short delay
                setTimeout(completeLoading, 500);
            } else {
                updateLoadingProgress(progress);
            }
        }, 400);
    }
    
    // Update the loading UI
    function updateLoadingProgress(percentage) {
        progressBar.style.width = percentage + '%';
        loadingPercentage.textContent = percentage + '%';
        
        // Add special effects at certain thresholds
        if (percentage > 80) {
            loadingPercentage.style.color = '#0066cc';
        }
    }
    
    // Complete the loading process
    function completeLoading() {
        // Ensure the progress bar reaches 100%
        progressBar.style.width = '100%';
        loadingPercentage.textContent = '100%';
        loadingPercentage.style.color = '#0066cc';
        
        // Hide loading screen with a nice transition
        setTimeout(function() {
            loadingScreen.classList.add('hidden');
            
            // Remove from DOM after transition completes
            setTimeout(function() {
                loadingScreen.style.display = 'none';
                // Trigger any post-loading animations or functions here
                animatePageEntrance();
            }, 500);
        }, 600);
    }
    
    // Optional: Add entrance animations for page elements
    function animatePageEntrance() {
        // You can add code here to animate elements as they appear
        // For example, fade in the main content sections one by one
        const mainSections = document.querySelectorAll('main section');
        mainSections.forEach((section, index) => {
            setTimeout(() => {
                section.style.opacity = '1';
            }, index * 100);
        });
    }
});

// Function to show loading screen between page navigations
function showLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    const progressBar = document.getElementById('progressBar');
    const loadingPercentage = document.getElementById('loadingPercentage');
    
    // Reset progress bar and percentage
    progressBar.style.width = '0%';
    loadingPercentage.textContent = '0%';
    loadingPercentage.style.color = '#555';
    
    // Show loading screen
    loadingScreen.style.display = 'flex';
    loadingScreen.classList.remove('hidden');
    
    // Start simulated loading for page transitions
    simulateLoading();
}