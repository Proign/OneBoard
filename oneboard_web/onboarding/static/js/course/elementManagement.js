// Element management functionality
async function loadElementContent(elementId) {
    try {
        const response = await fetch(`/api/courses/${courseId}/elements/${elementId}/`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });
        const element = await response.json();
        
        const contentContainer = document.getElementById('mainContent');
        
        let contentHtml = `<h2>${element.title}</h2>`;
        
        switch(element.type) {
            case 'text':
                const textContent = element.content.content;
                contentHtml += `<div class="text-content">${textContent}</div>`;
                break;
            case 'video':
                contentHtml += `<div class="video-content">
                    <video src="${element.content.video_url}" controls></video>
                    <p>${element.content.description}</p>
                </div>`;
                break;
            case 'test':
                contentHtml += `
                    <div class="test-content">
                        <p>${element.content.description}</p>
                        <button class="start-test-btn">Начать тест</button>
                    </div>
                `;
                break;
            case 'task':
                contentHtml += `
                    <div class="task-content">
                        <p>${element.content.description}</p>
                        <p>Срок выполнения: ${element.content.deadline} дней</p>
                    </div>
                `;
                break;
        }
        
        contentContainer.innerHTML = contentHtml;

        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-element-id="${elementId}"]`)?.classList.add('active');

    } catch (error) {
        console.error('Error loading element:', error);
    }
}

async function deleteElement(elementId) {
    if (!confirm('Вы уверены, что хотите удалить этот элемент?')) {
        return;
    }

    try {
        const response = await fetch(`/api/courses/${courseId}/elements/${elementId}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });

        if (response.ok) {
            loadCourseData();
            const mainContent = document.getElementById('mainContent');
            mainContent.innerHTML = `
                <h2>Элемент удален</h2>
                <p>Выберите другой элемент курса из списка слева.</p>
            `;
        } else {
            alert('Ошибка при удалении элемента');
        }
    } catch (error) {
        console.error('Error deleting element:', error);
        alert('Ошибка при удалении элемента');
    }
}

async function editElement(elementId) {
    try {
        const response = await fetch(`/api/courses/${courseId}/elements/${elementId}/`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });
        const element = await response.json();
        
        const form = document.getElementById('editElementForm');
        const contentDiv = document.getElementById('editElementContent');
        const modal = document.getElementById('editElementModal');
        
        if (!form || !contentDiv || !modal) {
            console.error('Edit element form, content div or modal not found');
            return;
        }
        
        form.querySelector('[name="title"]').value = element.title;
        
        switch(element.type) {
            case 'text':
                contentDiv.innerHTML = `
                    <div class="form-group">
                        <label>Текст</label>
                        <textarea name="text" rows="6" required>${element.content.content}</textarea>
                    </div>
                `;
                break;
            case 'video':
                contentDiv.innerHTML = `
                    <div class="form-group">
                        <label>URL видео</label>
                        <input type="url" name="video_url" value="${element.content.video_url}" required>
                    </div>
                    <div class="form-group">
                        <label>Описание</label>
                        <textarea name="description" rows="4">${element.content.description}</textarea>
                    </div>
                `;
                break;
        }
        
        form.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const data = {
                title: formData.get('title'),
                type: element.type,
            };

            switch(element.type) {
                case 'text':
                    data.content = {
                        content: formData.get('text')
                    };
                    break;
                case 'video':
                    data.content = {
                        video_url: formData.get('video_url'),
                        description: formData.get('description')
                    };
                    break;
            }
            
            try {
                const response = await fetch(`/api/courses/${courseId}/elements/${elementId}/`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    const updatedElement = await response.json();
                    closeEditElementModal();
                    await loadCourseData();
                    await loadElementContent(elementId);
                } else {
                    const error = await response.json();
                    alert(error.detail || 'Ошибка при обновлении элемента');
                }
            } catch (error) {
                console.error('Error updating element:', error);
                alert('Ошибка при обновлении элемента');
            }
        };
        
        modal.style.display = 'flex';
        
    } catch (error) {
        console.error('Error loading element for edit:', error);
        alert('Ошибка при загрузке элемента для редактирования');
    }
} 