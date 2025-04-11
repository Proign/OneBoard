// Modal handling functionality
function openAddElementModal() {
    document.getElementById('addElementModal').style.display = 'flex';
}

function closeAddElementModal() {
    document.getElementById('addElementModal').style.display = 'none';
    document.getElementById('elementForm').style.display = 'none';
    document.querySelectorAll('.element-type-item').forEach(item => {
        item.classList.remove('selected');
    });
}

function closeEditElementModal() {
    const modal = document.getElementById('editElementModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function closeEditCourseModal() {
    document.getElementById('editCourseModal').style.display = 'none';
}

function showElementForm(type) {
    const form = document.getElementById('elementForm');
    form.innerHTML = '';

    form.innerHTML = `
        <div class="form-group">
            <label>Название</label>
            <input type="text" name="title" required>
        </div>
    `;

    switch(type) {
        case 'text':
            form.innerHTML += `
                <div class="form-group">
                    <label>Текст</label>
                    <textarea name="text" rows="6" required></textarea>
                </div>
            `;
            break;
        case 'video':
            form.innerHTML += `
                <div class="form-group">
                    <label>URL видео</label>
                    <input type="url" name="video_url" required>
                </div>
                <div class="form-group">
                    <label>Описание</label>
                    <textarea name="description" rows="4"></textarea>
                </div>
            `;
            break;
        case 'test':
            form.innerHTML += `
                <div class="form-group">
                    <label>Описание теста</label>
                    <textarea name="description" rows="4" required></textarea>
                </div>
                <div class="form-group">
                    <label>Минимальный процент правильных ответов</label>
                    <input type="number" name="passing_percentage" min="1" max="100" value="50" required>
                </div>
                <div class="form-group">
                    <label>Количество вопросов</label>
                    <input type="number" name="question_count" min="1" max="100" required>
                </div>
                <div id="questionsContainer"></div>
            `;
            break;
        case 'task':
            form.innerHTML += `
                <div class="form-group">
                    <label>Описание задания</label>
                    <textarea name="description" rows="4" required></textarea>
                </div>
                <div class="form-group">
                    <label>Срок выполнения (дни)</label>
                    <input type="number" name="deadline" min="1" required>
                </div>
            `;
            break;
    }

    form.innerHTML += `
        <div class="modal-buttons">
            <button type="button" class="modal-button cancel" onclick="closeAddElementModal()">Отмена</button>
            <button type="submit" class="modal-button save">Создать</button>
        </div>
    `;

    form.style.display = 'block';

    if (type === 'test') {
        const questionCountInput = form.querySelector('input[name="question_count"]');
        questionCountInput.addEventListener('input', function() {
            let value = parseInt(this.value);
            if (value > 100) {
                this.value = 100;
                alert('Максимальное количество вопросов - 100');
                value = 100; // Устанавливаем значение в 100, чтобы предотвратить добавление вопросов
            }

            // Получаем текущее количество вопросов
            const currentQuestionCount = document.querySelectorAll('.question-container').length;

            // Если новое значение меньше текущего, удаляем лишние вопросы
            if (value < currentQuestionCount) {
                const questionsToRemove = currentQuestionCount - value;
                const questionContainers = document.querySelectorAll('.question-container');
                for (let i = 0; i < questionsToRemove; i++) {
                    questionContainers[questionContainers.length - 1 - i].remove(); // Удаляем последний вопрос
                }
            } else if (value > currentQuestionCount) {
                // Генерируем новые поля вопросов, если количество увеличилось
                testManager.generateQuestionFields(value);
            }
        });
    }

    form.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const data = {
            title: formData.get('title'),
            type: type,
        };

        switch(type) {
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
            case 'test':
                const questionCount = parseInt(formData.get('question_count'));
                if (questionCount > 100) {
                    alert('Максимальное количество вопросов - 100');
                    return;
                }
                data.content = {
                    description: formData.get('description'),
                    question_count: questionCount,
                    passing_percentage: testManager.getPassingPercentage(),
                    questions: testManager.collectQuestions()
                };
                data.is_required = true;
                data.is_active = true;
                data.passing_grade = testManager.getPassingPercentage();
                break;
            case 'task':
                data.content = {
                    description: formData.get('description'),
                    deadline: parseInt(formData.get('deadline'))
                };
                break;
        }
        
        try {
            const response = await fetch(`/api/courses/${courseId}/elements/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                closeAddElementModal();
                loadCourseData();
            } else {
                const error = await response.json();
                alert(error.detail || 'Ошибка при создании элемента');
            }
        } catch (error) {
            console.error('Error creating element:', error);
            alert('Ошибка при создании элемента');
        }
    };
}

// Initialize element type selection
document.querySelectorAll('.element-type-item').forEach(item => {
    item.addEventListener('click', function() {
        const type = this.dataset.type;
        document.querySelectorAll('.element-type-item').forEach(i => i.classList.remove('selected'));
        this.classList.add('selected');
        showElementForm(type);
    });
}); 