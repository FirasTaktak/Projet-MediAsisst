// This script adds a dark mode toggle to pages that don't have one
document.addEventListener('DOMContentLoaded', function() {
    // Check if dark mode toggle already exists
    if (!document.getElementById('dark-mode-toggle')) {
        // Find the navigation element
        const nav = document.querySelector('nav');
        
        if (nav) {
            // Create the dark mode toggle button
            const darkModeToggle = document.createElement('button');
            darkModeToggle.id = 'dark-mode-toggle';
            darkModeToggle.setAttribute('aria-label', 'Toggle dark mode');
            
            // Set initial icon based on current mode
            const isDarkMode = localStorage.getItem('darkMode') === 'enabled';
            darkModeToggle.innerHTML = isDarkMode ? 
                '<i class="fas fa-moon"></i>' : 
                '<i class="fas fa-sun"></i>';
            
            // Append to navigation
            nav.appendChild(darkModeToggle);
            
            // Load the dark mode script if it's not already loaded
            if (!window.darkModeLoaded) {
                const script = document.createElement('script');
                script.src = '../JS/dark-mode.js';
                document.head.appendChild(script);
            }
        }
    }
});