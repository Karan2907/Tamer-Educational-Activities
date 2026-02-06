/**
 * Multiple Choice Question Template
 * 
 * This template implements multiple choice questions with single correct answers.
 * It extends the BaseTemplate class and provides MCQ-specific functionality.
 */

import { BaseTemplate } from '../core/base-template.js';
import { validateActivityData } from '../core/schema.js';

export class MCQTemplate extends BaseTemplate {
    constructor(templateId, containerId) {
        super(templateId, containerId);
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.startTime = null;
    }
    
    /**
     * Get template HTML
     */
    async getTemplateHTML() {
        if (this.mode === 'play') {
            return this.getPlayModeHTML();
        } else {
            return this.getEditModeHTML();
        }
    }
    
    /**
     * Get play mode HTML
     */
    getPlayModeHTML() {
        const questions = this.activityData?.questions || [];
        const hasQuestions = questions.length > 0;
        
        return `
            <div class="mcq-play-mode">
                <div class="activity-header mb-6">
                    <h2 class="text-2xl font-bold mb-2">${this.activityData?.metadata?.title || 'Multiple Choice Quiz'}</h2>
                    <p class="text-muted">${this.activityData?.metadata?.description || 'Answer all questions to complete the quiz.'}</p>
                </div>
                
                ${hasQuestions ? `
                    <div class="question-container">
                        <div class="question-progress mb-4">
                            <div class="progress-bar bg-gray-200 rounded-full h-2">
                                <div class="progress-fill bg-blue-500 h-2 rounded-full" style="width: 0%"></div>
                            </div>
                            <div class="progress-text text-sm text-muted mt-1">
                                Question <span class="current-question">1</span> of <span class="total-questions">${questions.length}</span>
                            </div>
                        </div>
                        
                        <div class="question-card card p-6 mb-6">
                            <div class="question-text text-lg font-medium mb-4" id="question-text"></div>
                            <div class="options-container space-y-3" id="options-container"></div>
                        </div>
                        
                        <div class="feedback-container hidden mb-6" id="feedback-container">
                            <div class="feedback-card card p-4" id="feedback-card"></div>
                        </div>
                        
                        <div class="navigation-buttons flex justify-between">
                            <button class="btn btn-secondary" id="prev-question" disabled>
                                <i class="fas fa-arrow-left mr-2"></i>Previous
                            </button>
                            <button class="btn btn-primary" id="next-question">
                                Next<i class="fas fa-arrow-right ml-2"></i>
                            </button>
                            <button class="btn btn-success hidden" id="finish-quiz">
                                <i class="fas fa-check mr-2"></i>Finish Quiz
                            </button>
                        </div>
                    </div>
                ` : `
                    <div class="no-questions card p-8 text-center">
                        <i class="fas fa-question-circle text-4xl text-muted mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">No Questions Available</h3>
                        <p class="text-muted">This quiz doesn't have any questions yet.</p>
                    </div>
                `}
                
                <div class="results-container hidden card p-6 mt-6" id="results-container">
                    <h3 class="text-xl font-bold mb-4">Quiz Results</h3>
                    <div class="results-summary mb-4">
                        <div class="score text-3xl font-bold text-center mb-2" id="final-score"></div>
                        <div class="percentage text-lg text-center" id="score-percentage"></div>
                    </div>
                    <div class="results-details" id="results-details"></div>
                    <div class="action-buttons flex justify-center gap-4 mt-6">
                        <button class="btn btn-primary" id="retake-quiz">
                            <i class="fas fa-redo mr-2"></i>Retake Quiz
                        </button>
                        <button class="btn btn-secondary" id="review-answers">
                            <i class="fas fa-book-open mr-2"></i>Review Answers
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Get edit mode HTML
     */
    getEditModeHTML() {
        return `
            <div class="mcq-edit-mode">
                <div class="activity-header mb-6">
                    <h2 class="text-2xl font-bold mb-2">Edit Multiple Choice Quiz</h2>
                    <p class="text-muted">Create and manage your multiple choice questions.</p>
                </div>
                
                <div class="configuration-card card p-6 mb-6">
                    <h3 class="text-lg font-bold mb-4">Quiz Configuration</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">Time Limit (seconds, 0 = no limit)</label>
                            <input type="number" id="time-limit" min="0" value="${this.activityData?.config?.timeLimit || 0}" 
                                   class="w-full px-3 py-2 border rounded-lg">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2">Allow Retakes</label>
                            <select id="allow-retakes" class="w-full px-3 py-2 border rounded-lg">
                                <option value="true" ${this.activityData?.config?.allowRetakes !== false ? 'selected' : ''}>Yes</option>
                                <option value="false" ${this.activityData?.config?.allowRetakes === false ? 'selected' : ''}>No</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div class="questions-section card p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-bold">Questions</h3>
                        <button class="btn btn-primary" id="add-question">
                            <i class="fas fa-plus mr-2"></i>Add Question
                        </button>
                    </div>
                    
                    <div class="questions-list" id="questions-list">
                        ${this.renderQuestionsList()}
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render questions list for edit mode
     */
    renderQuestionsList() {
        const questions = this.activityData?.questions || [];
        if (questions.length === 0) {
            return `
                <div class="no-questions text-center py-8 text-muted">
                    <i class="fas fa-question-circle text-2xl mb-2"></i>
                    <p>No questions added yet. Click "Add Question" to get started.</p>
                </div>
            `;
        }
        
        return questions.map((question, index) => `
            <div class="question-item card p-4 mb-4" data-question-index="${index}">
                <div class="flex justify-between items-start mb-3">
                    <h4 class="font-bold">Question ${index + 1}</h4>
                    <div class="flex gap-2">
                        <button class="btn btn-sm btn-secondary edit-question" data-index="${index}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-error delete-question" data-index="${index}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="question-text mb-2">${question.question}</div>
                <div class="options text-sm text-muted">
                    ${question.options.map((option, optIndex) => 
                        `<div class="${optIndex === question.correctIndex ? 'text-success font-medium' : ''}">
                            ${String.fromCharCode(65 + optIndex)}. ${option}
                        </div>`
                    ).join('')}
                </div>
            </div>
        `).join('');
    }
    
    /**
     * Called after render completes
     */
    async afterRender() {
        if (this.mode === 'play') {
            await this.initializePlayMode();
        } else {
            this.initializeEditMode();
        }
    }
    
    /**
     * Initialize play mode
     */
    async initializePlayMode() {
        const questions = this.activityData?.questions || [];
        if (questions.length === 0) return;
        
        this.currentQuestionIndex = 0;
        this.userAnswers = new Array(questions.length).fill(null);
        this.startTime = new Date();
        
        this.updateProgress();
        this.showQuestion(this.currentQuestionIndex);
        this.initializePlayEventListeners();
    }
    
    /**
     * Initialize edit mode
     */
    initializeEditMode() {
        this.initializeEditEventListeners();
    }
    
    /**
     * Initialize play mode event listeners
     */
    initializePlayEventListeners() {
        // Previous question button
        const prevBtn = this.getElement('#prev-question');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousQuestion());
        }
        
        // Next question button
        const nextBtn = this.getElement('#next-question');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextQuestion());
        }
        
        // Finish quiz button
        const finishBtn = this.getElement('#finish-quiz');
        if (finishBtn) {
            finishBtn.addEventListener('click', () => this.finishQuiz());
        }
        
        // Retake quiz button
        const retakeBtn = this.getElement('#retake-quiz');
        if (retakeBtn) {
            retakeBtn.addEventListener('click', () => this.resetQuiz());
        }
        
        // Review answers button
        const reviewBtn = this.getElement('#review-answers');
        if (reviewBtn) {
            reviewBtn.addEventListener('click', () => this.reviewAnswers());
        }
    }
    
    /**
     * Initialize edit mode event listeners
     */
    initializeEditEventListeners() {
        // Add question button
        const addBtn = this.getElement('#add-question');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addQuestion());
        }
        
        // Edit question buttons
        const editBtns = this.getElements('.edit-question');
        editBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('button').dataset.index);
                this.editQuestion(index);
            });
        });
        
        // Delete question buttons
        const deleteBtns = this.getElements('.delete-question');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('button').dataset.index);
                this.deleteQuestion(index);
            });
        });
        
        // Configuration changes
        const timeLimitInput = this.getElement('#time-limit');
        if (timeLimitInput) {
            timeLimitInput.addEventListener('change', (e) => {
                this.updateConfig('timeLimit', parseInt(e.target.value) || 0);
            });
        }
        
        const allowRetakesSelect = this.getElement('#allow-retakes');
        if (allowRetakesSelect) {
            allowRetakesSelect.addEventListener('change', (e) => {
                this.updateConfig('allowRetakes', e.target.value === 'true');
            });
        }
    }
    
    /**
     * Show current question
     */
    showQuestion(index) {
        const questions = this.activityData?.questions || [];
        if (index < 0 || index >= questions.length) return;
        
        const question = questions[index];
        const questionText = this.getElement('#question-text');
        const optionsContainer = this.getElement('#options-container');
        
        if (questionText) {
            questionText.textContent = question.question;
        }
        
        if (optionsContainer) {
            optionsContainer.innerHTML = question.options.map((option, optIndex) => `
                <button class="option-btn w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors ${this.userAnswers[index] === optIndex ? 'bg-blue-50 border-blue-500' : ''}"
                        data-option-index="${optIndex}">
                    ${String.fromCharCode(65 + optIndex)}. ${option}
                </button>
            `).join('');
            
            // Add event listeners to options
            optionsContainer.querySelectorAll('.option-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const optionIndex = parseInt(e.target.dataset.optionIndex);
                    this.selectAnswer(index, optionIndex);
                });
            });
        }
        
        this.updateNavigationButtons();
        this.updateProgress();
    }
    
    /**
     * Select answer for current question
     */
    selectAnswer(questionIndex, optionIndex) {
        this.userAnswers[questionIndex] = optionIndex;
        
        // Update UI to show selected answer
        const optionButtons = this.getElements('.option-btn');
        optionButtons.forEach((btn, index) => {
            if (index === optionIndex) {
                btn.classList.add('bg-blue-50', 'border-blue-500');
            } else {
                btn.classList.remove('bg-blue-50', 'border-blue-500');
            }
        });
        
        // Show immediate feedback if enabled
        if (this.activityData?.config?.showFeedback !== false) {
            this.showFeedback(questionIndex, optionIndex);
        }
        
        this.updateNavigationButtons();
    }
    
    /**
     * Show feedback for answer
     */
    showFeedback(questionIndex, selectedOption) {
        const questions = this.activityData?.questions || [];
        const question = questions[questionIndex];
        const isCorrect = selectedOption === question.correctIndex;
        
        const feedbackContainer = this.getElement('#feedback-container');
        const feedbackCard = this.getElement('#feedback-card');
        
        if (feedbackContainer && feedbackCard) {
            feedbackCard.innerHTML = `
                <div class="flex items-center ${isCorrect ? 'text-success' : 'text-error'}">
                    <i class="fas ${isCorrect ? 'fa-check-circle' : 'fa-times-circle'} mr-2"></i>
                    <span class="font-medium">${isCorrect ? 'Correct!' : 'Incorrect'}</span>
                </div>
                ${question.explanation ? `<div class="mt-2 text-muted">${question.explanation}</div>` : ''}
            `;
            feedbackContainer.classList.remove('hidden');
        }
        
        // Hide feedback after delay
        setTimeout(() => {
            if (feedbackContainer) {
                feedbackContainer.classList.add('hidden');
            }
        }, 3000);
    }
    
    /**
     * Navigate to previous question
     */
    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.showQuestion(this.currentQuestionIndex);
        }
    }
    
    /**
     * Navigate to next question
     */
    nextQuestion() {
        const questions = this.activityData?.questions || [];
        if (this.currentQuestionIndex < questions.length - 1) {
            this.currentQuestionIndex++;
            this.showQuestion(this.currentQuestionIndex);
        } else {
            this.finishQuiz();
        }
    }
    
    /**
     * Finish quiz and show results
     */
    finishQuiz() {
        const questions = this.activityData?.questions || [];
        const correctAnswers = this.userAnswers.filter((answer, index) => 
            answer === questions[index]?.correctIndex
        ).length;
        
        const score = correctAnswers;
        const percentage = Math.round((correctAnswers / questions.length) * 100);
        
        // Update progress data
        if (this.activityData) {
            this.activityData.progress = {
                ...this.activityData.progress,
                userScore: score,
                maxScore: questions.length,
                completed: true,
                timeSpent: Math.floor((new Date() - this.startTime) / 1000)
            };
        }
        
        // Show results
        const resultsContainer = this.getElement('#results-container');
        const finalScore = this.getElement('#final-score');
        const scorePercentage = this.getElement('#score-percentage');
        const resultsDetails = this.getElement('#results-details');
        
        if (finalScore) finalScore.textContent = `${score}/${questions.length}`;
        if (scorePercentage) scorePercentage.textContent = `${percentage}%`;
        
        if (resultsDetails) {
            resultsDetails.innerHTML = `
                <div class="grid grid-cols-3 gap-4 text-center">
                    <div class="card p-3">
                        <div class="text-2xl font-bold">${score}</div>
                        <div class="text-sm text-muted">Correct</div>
                    </div>
                    <div class="card p-3">
                        <div class="text-2xl font-bold">${questions.length - score}</div>
                        <div class="text-sm text-muted">Incorrect</div>
                    </div>
                    <div class="card p-3">
                        <div class="text-2xl font-bold">${percentage}%</div>
                        <div class="text-sm text-muted">Score</div>
                    </div>
                </div>
            `;
        }
        
        if (resultsContainer) {
            resultsContainer.classList.remove('hidden');
        }
        
        // Hide question container
        const questionContainer = this.getElement('.question-container');
        if (questionContainer) {
            questionContainer.classList.add('hidden');
        }
    }
    
    /**
     * Reset quiz
     */
    resetQuiz() {
        this.currentQuestionIndex = 0;
        this.userAnswers = new Array(this.activityData?.questions?.length || 0).fill(null);
        this.startTime = new Date();
        
        // Hide results
        const resultsContainer = this.getElement('#results-container');
        if (resultsContainer) {
            resultsContainer.classList.add('hidden');
        }
        
        // Show question container
        const questionContainer = this.getElement('.question-container');
        if (questionContainer) {
            questionContainer.classList.remove('hidden');
        }
        
        this.showQuestion(0);
    }
    
    /**
     * Update progress display
     */
    updateProgress() {
        const questions = this.activityData?.questions || [];
        const progressFill = this.getElement('.progress-fill');
        const currentQuestion = this.getElement('.current-question');
        const totalQuestions = this.getElement('.total-questions');
        
        const progress = questions.length > 0 ? 
            ((this.currentQuestionIndex + 1) / questions.length) * 100 : 0;
        
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
        
        if (currentQuestion) {
            currentQuestion.textContent = this.currentQuestionIndex + 1;
        }
        
        if (totalQuestions) {
            totalQuestions.textContent = questions.length;
        }
    }
    
    /**
     * Update navigation buttons
     */
    updateNavigationButtons() {
        const questions = this.activityData?.questions || [];
        const prevBtn = this.getElement('#prev-question');
        const nextBtn = this.getElement('#next-question');
        const finishBtn = this.getElement('#finish-quiz');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentQuestionIndex === 0;
        }
        
        if (nextBtn && finishBtn) {
            if (this.currentQuestionIndex === questions.length - 1) {
                nextBtn.classList.add('hidden');
                finishBtn.classList.remove('hidden');
            } else {
                nextBtn.classList.remove('hidden');
                finishBtn.classList.add('hidden');
            }
        }
    }
    
    /**
     * Template-specific validation
     */
    validateTemplateData() {
        const errors = [];
        const questions = this.activityData?.questions || [];
        
        if (questions.length === 0) {
            errors.push('At least one question is required');
        }
        
        questions.forEach((question, index) => {
            if (!question.question || question.question.trim() === '') {
                errors.push(`Question ${index + 1}: Question text is required`);
            }
            
            if (!question.options || question.options.length < 2) {
                errors.push(`Question ${index + 1}: At least 2 options are required`);
            }
            
            if (question.correctIndex === undefined || question.correctIndex < 0 || question.correctIndex >= question.options.length) {
                errors.push(`Question ${index + 1}: Invalid correct answer index`);
            }
        });
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
    
    /**
     * Add new question
     */
    addQuestion() {
        if (!this.activityData) {
            this.activityData = {
                metadata: {
                    id: Date.now().toString(),
                    title: 'New MCQ Activity',
                    template: 'mcq',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                config: {
                    timeLimit: 0,
                    allowRetakes: true,
                    showFeedback: true
                },
                questions: []
            };
        }
        
        if (!this.activityData.questions) {
            this.activityData.questions = [];
        }
        
        const newQuestion = {
            id: Date.now().toString(),
            question: 'New Question',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctIndex: 0,
            explanation: ''
        };
        
        this.activityData.questions.push(newQuestion);
        this.renderQuestionsList();
        this.initializeEditEventListeners();
    }
    
    /**
     * Edit question
     */
    editQuestion(index) {
        // Implementation for editing question
        // This would typically open a modal or inline editor
        console.log(`Edit question ${index}`);
    }
    
    /**
     * Delete question
     */
    deleteQuestion(index) {
        if (this.activityData?.questions && confirm('Are you sure you want to delete this question?')) {
            this.activityData.questions.splice(index, 1);
            this.renderQuestionsList();
            this.initializeEditEventListeners();
        }
    }
    
    /**
     * Update configuration
     */
    updateConfig(key, value) {
        if (!this.activityData) {
            this.activityData = {
                metadata: {
                    id: Date.now().toString(),
                    title: 'New MCQ Activity',
                    template: 'mcq',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                config: {}
            };
        }
        
        if (!this.activityData.config) {
            this.activityData.config = {};
        }
        
        this.activityData.config[key] = value;
        this.activityData.metadata.updatedAt = new Date();
    }
}

// Export the template
export default MCQTemplate;