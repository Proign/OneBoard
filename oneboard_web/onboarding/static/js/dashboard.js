let isAdmin = false;

async function checkUserRole() {
    try {
        const response = await fetch('/api/users/me/', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });
        const userData = await response.json();
        isAdmin = userData.role === 'admin';
    } catch (error) {
        console.error('Error checking user role:', error);
    }
}

function openCreateCourseModal() {
    document.getElementById('createCourseModal').style.display = 'flex';
}

function closeCreateCourseModal() {
    document.getElementById('createCourseModal').style.display = 'none';
}

// Функция для загрузки курсов
async function loadCourses() {
    try {
        const response = await fetch('/api/courses/', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });
        const courses = await response.json();
        
        const coursesContainer = document.querySelector('.courses-section');
        const coursesHeader = coursesContainer.querySelector('.courses-header');
        
        // Очищаем предыдущие карточки курсов
        const oldCards = coursesContainer.querySelectorAll('.course-card');
        oldCards.forEach(card => card.remove());
        
        // Добавляем новые карточки
        courses.forEach(course => {
            const courseCard = createCourseCard(course);
            coursesContainer.appendChild(courseCard);
        });
    } catch (error) {
        console.error('Error loading courses:', error);
    }
}

// Функция для создания карточки курса
function createCourseCard(course) {
    const card = document.createElement('div');
    card.className = 'course-card';
    
    const imageUrl = course.image || '/static/images/online-learning.png';
    
    // Форматируем описание с учетом переносов строк и ограничиваем длину
    const formattedDescription = formatDescription(course.description);
    
    card.innerHTML = `
        ${isAdmin ? `
            <button class="delete-course-button" onclick="deleteCourse(${course.id}, event)">×</button>
        ` : ''}
        <div class="course-image">
            <img src="${imageUrl}" alt="${course.title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" onerror="this.src='/static/images/online-learning.png'">
        </div>
        <div class="course-content">
            <div class="course-title">${course.title}</div>
            <div class="course-description">${formattedDescription}</div>
            <div class="progress-container">
                <div class="progress-bar" style="width: ${course.progress}%"></div>
            </div>
            <div class="progress-text">${course.progress}% выполнено</div>
            <div class="course-actions">
                <button class="course-button" onclick="openCourse(${course.id})">Перейти</button>
            </div>
        </div>
    `;
    
    return card;
}

// Функция для форматирования описания
function formatDescription(text) {
    if (!text) return '';
    
    // Заменяем переносы строк на <br>
    let formatted = text.replace(/\n/g, '<br>');
    
    // Ограничиваем длину описания
    const maxLength = 150;
    if (formatted.length > maxLength) {
        formatted = formatted.substring(0, maxLength) + '...';
    }
    
    return formatted;
}

// Обновляем обработчик отправки формы создания курса
document.getElementById('createCourseForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch('/api/courses/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: formData
        });

        if (response.ok) {
            closeCreateCourseModal();
            // Очищаем форму
            e.target.reset();
            // Перезагружаем список курсов
            await loadCourses();
        } else {
            const error = await response.json();
            alert(error.message || 'Ошибка при создании курса');
        }
    } catch (error) {
        alert('Ошибка при создании курса');
    }
});

function openCourse(courseId) {
    window.location.href = `/onboarding/course/?id=${courseId}`;
}

// Закрытие модального окна при клике вне его
window.onclick = function(event) {
    if (event.target == document.getElementById('createCourseModal')) {
        closeCreateCourseModal();
    }
}

async function deleteCourse(courseId, event) {
    event.stopPropagation();

    if (!confirm('Вы уверены, что хотите удалить этот курс? Все связанные файлы и материалы будут удалены безвозвратно.')) {
        return;
    }

    try {
        const response = await fetch(`/api/courses/${courseId}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });

        if (response.ok) {
            await loadCourses();
        } else {
            const error = await response.json();
            alert(error.message || 'Ошибка при удалении курса и связанных файлов');
        }
    } catch (error) {
        console.error('Error deleting course:', error);
        alert('Ошибка при удалении курса и связанных файлов');
    }
}

// Обновим обработчик загрузки страницы
document.addEventListener('DOMContentLoaded', async () => {
    await checkUserRole();
    await loadCourses();
}); 