// User role checking functionality
const courseId = new URLSearchParams(window.location.search).get('id');
let isAdmin = false;

async function checkUserRole() {
    try {
        const response = await fetch('/api/users/me/', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const userData = await response.json();
        isAdmin = userData.role === 'admin';
        console.log('User role check:', { isAdmin, userData });
        
        const addElementButton = document.getElementById('addElementButton');
        if (addElementButton) {
            addElementButton.style.display = isAdmin ? 'flex' : 'none';
        }

        await loadCourseData();
    } catch (error) {
        console.error('Error checking user role:', error);
        isAdmin = false;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkUserRole();
}); 