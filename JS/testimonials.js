// Testimonial slider functionality
let slideIndex = 1;
let slideInterval;

// Initialize the slider
document.addEventListener('DOMContentLoaded', function() {
    showSlides(slideIndex);
    // Auto advance slides every 5 seconds
    startSlideInterval();
    
    // Pause auto-rotation when hovering over the slider
    const slider = document.querySelector('.testimonial-slider');
    if (slider) {
        slider.addEventListener('mouseenter', stopSlideInterval);
        slider.addEventListener('mouseleave', startSlideInterval);
    }
});

// Start automatic slide rotation
function startSlideInterval() {
    slideInterval = setInterval(function() {
        showSlides(slideIndex += 1);
    }, 5000); // Change slide every 5 seconds
}

// Stop automatic slide rotation
function stopSlideInterval() {
    clearInterval(slideInterval);
}

// Manual navigation
function currentSlide(n) {
    showSlides(slideIndex = n);
    // Reset the interval when manually changing slides
    stopSlideInterval();
    startSlideInterval();
}

// Show the current slide
function showSlides(n) {
    let i;
    let slides = document.getElementsByClassName("testimonial-slide");
    let dots = document.getElementsByClassName("dot");
    
    // Handle wrapping around at the end
    if (n > slides.length) {slideIndex = 1}
    if (n < 1) {slideIndex = slides.length}
    
    // Hide all slides
    for (i = 0; i < slides.length; i++) {
        slides[i].classList.remove("active");
    }
    
    // Deactivate all dots
    for (i = 0; i < dots.length; i++) {
        dots[i].classList.remove("active");
    }
    
    // Show the current slide and activate the corresponding dot
    slides[slideIndex-1].classList.add("active");
    dots[slideIndex-1].classList.add("active");
}