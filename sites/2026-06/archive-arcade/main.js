import './style.css';

document.addEventListener('DOMContentLoaded', () => {
    // FAQ Accordion Interactivity
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const isExpanded = question.getAttribute('aria-expanded') === 'true';
            
            // Close all others
            faqQuestions.forEach(q => q.setAttribute('aria-expanded', 'false'));
            
            // Toggle current
            if (!isExpanded) {
                question.setAttribute('aria-expanded', 'true');
            }
        });
    });
});
