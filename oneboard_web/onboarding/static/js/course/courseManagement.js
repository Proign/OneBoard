// Course management functionality
async function loadCourseData() {
    try {
        const response = await fetch(`/api/courses/${courseId}/`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });
        const course = await response.json();
        console.log('Course data loaded:', course);
        
        document.getElementById('courseName').textContent = course.title;
        
        const elementsResponse = await fetch(`/api/courses/${courseId}/elements/`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });
        const elements = await elementsResponse.json();
        console.log('Course elements loaded:', elements);

        updateCourseSidebar(course, elements);
        showCourseInfo(course);
    } catch (error) {
        console.error('Error loading course:', error);
    }
}

function updateCourseSidebar(course, elements) {
    const courseContent = document.getElementById('courseContent');
    courseContent.innerHTML = '';

    // Add "About Course" section
    const aboutCourseDiv = document.createElement('div');
    aboutCourseDiv.className = 'sidebar-item';
    aboutCourseDiv.dataset.elementId = 'about';
    
    const aboutTitleSpan = document.createElement('span');
    aboutTitleSpan.textContent = 'О курсе';
    aboutCourseDiv.appendChild(aboutTitleSpan);

    if (isAdmin) {
        const actionButtons = document.createElement('div');
        actionButtons.className = 'action-buttons';
        
        const editButton = document.createElement('button');
        editButton.className = 'edit-button';
        editButton.innerHTML = '<img src="/static/images/edit.png" alt="Edit">';
        editButton.onclick = (e) => {
            e.stopPropagation();
            editCourse(courseId);
        };
        
        actionButtons.appendChild(editButton);
        aboutCourseDiv.appendChild(actionButtons);
    }

    aboutCourseDiv.onclick = () => showCourseInfo(course);
    courseContent.appendChild(aboutCourseDiv);

    // Add divider
    const divider = document.createElement('hr');
    divider.style.margin = '15px 0';
    divider.style.border = 'none';
    divider.style.borderTop = '1px solid #eee';
    courseContent.appendChild(divider);

    // Add course elements
    if (elements.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'sidebar-item';
        emptyMessage.textContent = 'Элементы курса отсутствуют';
        courseContent.appendChild(emptyMessage);
    } else {
        elements.forEach(element => {
            const elementDiv = document.createElement('div');
            elementDiv.className = 'sidebar-item';
            elementDiv.dataset.id = element.id;
            elementDiv.dataset.elementId = element.id;
            
            const titleSpan = document.createElement('span');
            titleSpan.textContent = element.title;
            elementDiv.appendChild(titleSpan);
            
            if (isAdmin) {
                const actionButtons = document.createElement('div');
                actionButtons.className = 'action-buttons';
                
                const editButton = document.createElement('button');
                editButton.className = 'edit-button';
                editButton.innerHTML = '<img src="/static/images/edit.png" alt="Edit">';
                editButton.onclick = (e) => {
                    e.stopPropagation();
                    editElement(element.id);
                };
                
                const deleteButton = document.createElement('button');
                deleteButton.className = 'delete-button';
                deleteButton.innerHTML = '<img src="/static/images/remove.png" alt="Delete">';
                deleteButton.onclick = (e) => {
                    e.stopPropagation();
                    deleteElement(element.id);
                };
                
                actionButtons.appendChild(editButton);
                actionButtons.appendChild(deleteButton);
                elementDiv.appendChild(actionButtons);
            }
            
            elementDiv.onclick = () => loadElementContent(element.id);
            courseContent.appendChild(elementDiv);
        });
    }
}

function showCourseInfo(course) {
    const mainContent = document.getElementById('mainContent');
    const formattedDescription = course.description ? course.description.replace(/\n/g, '<br>') : '';
    
    mainContent.innerHTML = `
        <div class="course-image">
            <img src="${course.image || '/static/images/online-learning.png'}" alt="${course.title}">
        </div>
        <h2>${course.title}</h2>
        <div class="course-content-text">
            <p>${formattedDescription}</p>
        </div>
    `;

    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector('[data-element-id="about"]').classList.add('active');
}

async function editCourse(courseId) {
    try {
        console.log('Starting editCourse for courseId:', courseId);
        const response = await fetch(`/api/courses/${courseId}/`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const course = await response.json();
        console.log('Course data loaded for editing:', course);
        
        const form = document.getElementById('editCourseForm');
        const modal = document.getElementById('editCourseModal');
        
        if (!form || !modal) {
            console.error('Edit course form or modal not found');
            return;
        }
        
        // Заполняем форму текущими данными курса
        form.querySelector('[name="title"]').value = course.title;
        form.querySelector('[name="description"]').value = course.description;
        form.querySelector('[name="status"]').value = course.status;
        
        // Обработчик отправки формы
        form.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const imageFile = formData.get('image');
            
            try {
                let response;
                if (imageFile && imageFile.size > 0) {
                    // Если есть новый файл изображения, отправляем FormData
                    response = await fetch(`/api/courses/${courseId}/`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                        },
                        body: formData
                    });
                } else {
                    // Если файл не выбран, отправляем JSON
                    const jsonData = {
                        title: formData.get('title'),
                        description: formData.get('description'),
                        status: formData.get('status')
                    };
                    response = await fetch(`/api/courses/${courseId}/`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(jsonData)
                    });
                }

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const updatedCourse = await response.json();
                console.log('Course updated successfully:', updatedCourse);
                
                closeEditCourseModal();
                await loadCourseData();
                showCourseInfo(updatedCourse);
            } catch (error) {
                console.error('Error updating course:', error);
                alert('Ошибка при обновлении курса');
            }
        };
        
        modal.style.display = 'flex';
        
    } catch (error) {
        console.error('Error loading course for edit:', error);
        alert('Ошибка при загрузке курса для редактирования');
    }
} 