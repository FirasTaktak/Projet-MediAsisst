// Dark Mode Implementation
document.addEventListener('DOMContentLoaded', function () {
    console.log("Dark mode script loaded");
    const body = document.body;
    
    // Check if user previously enabled dark mode and apply it immediately
    const darkMode = localStorage.getItem('darkMode');
    console.log("Stored dark mode preference:", darkMode);
    
    if (darkMode === 'enabled') {
        body.classList.add('dark-mode');
    }
    
    // The rest of the toggle functionality can wait for the button
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    
    if (!darkModeToggle) {
        console.error("Dark mode toggle button not found!");
        return;
    }
    
    // Function to enable dark mode
    function enableDarkMode() {
        console.log("Enabling dark mode");
        body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'enabled');
        // Change icon to moon when in dark mode
        if (darkModeToggle.querySelector('i')) {
            darkModeToggle.querySelector('i').className = 'fas fa-moon';
        } else {
            darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }

    // Function to disable dark mode
    function disableDarkMode() {
        console.log("Disabling dark mode");
        body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'disabled');
        // Change icon to sun when in light mode
        if (darkModeToggle.querySelector('i')) {
            darkModeToggle.querySelector('i').className = 'fas fa-sun';
        } else {
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    }

    // Update button state based on current mode
    if (darkMode === 'enabled') {
        enableDarkMode();
    } else {
        disableDarkMode();
    }

    // Toggle dark mode when the button is clicked
    darkModeToggle.addEventListener('click', () => {
        console.log("Dark mode toggle clicked");
        if (body.classList.contains('dark-mode')) {
            disableDarkMode();
        } else {
            enableDarkMode();
        }
    });
});
