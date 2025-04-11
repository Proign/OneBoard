// Test-related functionality
class TestManager {
    constructor(courseId) {
        this.courseId = courseId;
    }

    // Function to generate question fields
    generateQuestionFields(count) {
        const questionsContainer = document.getElementById('questionsContainer');
        const existingQuestions = this.collectQuestions();
        
        // Clear only if we're reducing the number of questions
        if (count < existingQuestions.length) {
            questionsContainer.innerHTML = '';
        }

        // Add new questions or update existing ones
        for (let i = 0; i < count; i++) {
            if (i < existingQuestions.length) {
                // Update existing question
                const existingQuestion = existingQuestions[i];
                const questionDiv = document.querySelector(`.question-container:nth-child(${i + 1})`);
                if (questionDiv) {
                    const questionInput = questionDiv.querySelector(`input[name="question_${i}"]`);
                    if (questionInput) {
                        questionInput.value = existingQuestion.question;
                    }
                    
                    // Update answers
                    const answersContainer = questionDiv.querySelector('.answersContainer');
                    answersContainer.innerHTML = '';
                    existingQuestion.answers.forEach((answer, answerIndex) => {
                        this.addAnswer(questionDiv.querySelector('.add-answer-button'));
                        const answerDiv = answersContainer.querySelector(`.answer-container:nth-child(${answerIndex + 1})`);
                        if (answerDiv) {
                            const answerInput = answerDiv.querySelector('input[name="answer"]');
                            const isCorrectInput = answerDiv.querySelector('input[name="is_correct"]');
                            if (answerInput && isCorrectInput) {
                                answerInput.value = answer.text;
                                isCorrectInput.checked = answer.is_correct;
                            }
                        }
                    });
                }
            } else {
                // Add new question
                this.addQuestion(i);
            }
        }

        this.updateQuestionNumbers();
        this.updateQuestionCount();
    }

    // Function to add a question
    addQuestion(index) {
        const questionsContainer = document.getElementById('questionsContainer');
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-container';
        questionDiv.innerHTML = `
            <div class="form-group">
                <div class="question-header">
                    <span class="question-number">Вопрос ${index + 1}</span>
                    <button type="button" class="delete-question-button" onclick="testManager.deleteQuestion(this)">✕</button>
                </div>
                <input type="text" name="question_${index}" required>
                <div class="answersContainer"></div>
                <button type="button" class="add-answer-button" onclick="testManager.addAnswer(this)">Добавить ответ</button>
            </div>
        `;
        questionsContainer.appendChild(questionDiv);
    }

    // Function to delete a question
    deleteQuestion(button) {
        const questionDiv = button.closest('.question-container');
        questionDiv.remove();
        this.updateQuestionNumbers();
        this.updateQuestionCount();
    }

    // Function to update question numbers
    updateQuestionNumbers() {
        const questionsContainer = document.getElementById('questionsContainer');
        const questionDivs = questionsContainer.querySelectorAll('.question-container');
        questionDivs.forEach((questionDiv, index) => {
            const numberSpan = questionDiv.querySelector('.question-number');
            numberSpan.textContent = `Вопрос ${index + 1}`;
            const input = questionDiv.querySelector('input[type="text"]');
            input.name = `question_${index}`;
        });
    }

    // Function to update question count
    updateQuestionCount() {
        const questionCountInput = document.querySelector('input[name="question_count"]');
        const currentCount = document.querySelectorAll('.question-container').length;
        questionCountInput.value = currentCount;
    }

    // Function to add an answer
    addAnswer(button) {
        const answersContainer = button.previousElementSibling;
        const answerCount = answersContainer.children.length + 1;
        const answerDiv = document.createElement('div');
        answerDiv.className = 'answer-container';
        answerDiv.innerHTML = `
            <div class="form-group">
                <div class="answer-header">
                    <span class="answer-number">Ответ ${answerCount}</span>
                    <div class="answer-controls">
                        <div class="correct-answer">
                            <input type="checkbox" name="is_correct">
                            <label>Правильный</label>
                        </div>
                        <button type="button" class="delete-answer-button" onclick="testManager.deleteAnswer(this)">✕</button>
                    </div>
                </div>
                <input type="text" name="answer" required>
            </div>
        `;
        answersContainer.appendChild(answerDiv);
    }

    // Function to delete an answer
    deleteAnswer(button) {
        const answerDiv = button.closest('.answer-container');
        const answersContainer = button.closest('.answersContainer');
        answerDiv.remove();
        this.updateAnswerNumbers(answersContainer);
    }

    // Function to update answer numbers
    updateAnswerNumbers(answersContainer) {
        const answerDivs = answersContainer.querySelectorAll('.answer-container');
        answerDivs.forEach((answerDiv, index) => {
            const numberSpan = answerDiv.querySelector('.answer-number');
            numberSpan.textContent = `Ответ ${index + 1}`;
        });
    }

    // Function to collect questions and answers
    collectQuestions() {
        const questions = [];
        document.querySelectorAll('#questionsContainer .question-container').forEach((questionDiv, index) => {
            const questionInput = questionDiv.querySelector(`input[name="question_${index}"]`);
            if (questionInput) {
                const questionText = questionInput.value;
                const answers = [];
                questionDiv.querySelectorAll('.answersContainer .answer-container').forEach(answerDiv => {
                    const answerInput = answerDiv.querySelector('input[name="answer"]');
                    const isCorrectInput = answerDiv.querySelector('input[name="is_correct"]');
                    if (answerInput && isCorrectInput) {
                        const answerText = answerInput.value;
                        const isCorrect = isCorrectInput.checked;
                        answers.push({ text: answerText, is_correct: isCorrect });
                    }
                });
                questions.push({ question: questionText, answers: answers });
            }
        });
        return questions;
    }

    // Function to get passing percentage
    getPassingPercentage() {
        const passingPercentageInput = document.querySelector('input[name="passing_percentage"]');
        return passingPercentageInput ? parseInt(passingPercentageInput.value) : 70; // Default to 70% if not specified
    }

    // Function to submit test results
    async submitTestResult(employeeId, materialId, progress) {
        try {
            const response = await fetch('/api/save_test_result/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ employee_id: employeeId, material_id: materialId, progress: progress })
            });

            if (response.ok) {
                alert('Test result saved successfully!');
            } else {
                alert('Error saving test result');
            }
        } catch (error) {
            console.error('Error submitting test result:', error);
        }
    }
}

// Create a global instance of TestManager
let testManager;

// Initialize test manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const courseId = new URLSearchParams(window.location.search).get('id');
    testManager = new TestManager(courseId);
}); 