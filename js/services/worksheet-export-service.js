/**
 * Worksheet Export Service
 * Generates printable worksheets for all template types
 * Complements the existing export system with educational worksheet formats
 */

class WorksheetExportService {
    constructor() {
        this.worksheetTemplates = new Map();
        this.initializeWorksheetTemplates();
    }

    /**
     * Initialize worksheet templates for each activity type
     */
    initializeWorksheetTemplates() {
        // MCQ Worksheet Template
        this.worksheetTemplates.set('mcq', {
            title: 'Multiple Choice Questions Worksheet',
            generate: (data) => this.generateMCQWorksheet(data)
        });

        // Flash Cards Worksheet Template
        this.worksheetTemplates.set('flashcards', {
            title: 'Flash Cards Study Guide',
            generate: (data) => this.generateFlashCardsWorksheet(data)
        });

        // Drag Drop Worksheet Template
        this.worksheetTemplates.set('dragdrop', {
            title: 'Matching Exercise Worksheet',
            generate: (data) => this.generateDragDropWorksheet(data)
        });

        // Crossword Worksheet Template
        this.worksheetTemplates.set('crossword', {
            title: 'Crossword Puzzle Worksheet',
            generate: (data) => this.generateCrosswordWorksheet(data)
        });

        // Timeline Worksheet Template
        this.worksheetTemplates.set('timeline', {
            title: 'Timeline Sequencing Worksheet',
            generate: (data) => this.generateTimelineWorksheet(data)
        });

        // Label Diagram Worksheet Template
        this.worksheetTemplates.set('labeldiagram', {
            title: 'Labeling Exercise Worksheet',
            generate: (data) => this.generateLabelDiagramWorksheet(data)
        });

        // Content Reveal Worksheet Template
        this.worksheetTemplates.set('contentreveal', {
            title: 'Content Reveal Study Guide',
            generate: (data) => this.generateContentRevealWorksheet(data)
        });

        // Survey Worksheet Template
        this.worksheetTemplates.set('survey', {
            title: 'Survey/Questionnaire Worksheet',
            generate: (data) => this.generateSurveyWorksheet(data)
        });

        // Pick Many Worksheet Template
        this.worksheetTemplates.set('pickmany', {
            title: 'Multiple Selection Worksheet',
            generate: (data) => this.generatePickManyWorksheet(data)
        });

        // Game Arena Worksheet Template
        this.worksheetTemplates.set('gamearena', {
            title: 'Game Challenge Worksheet',
            generate: (data) => this.generateGameArenaWorksheet(data)
        });
    }

    /**
     * Generate printable worksheet for any template type
     * @param {Object} activityData - Activity data to convert to worksheet
     * @param {string} templateType - Template type identifier
     * @param {Object} options - Export options
     * @returns {Promise<string>} HTML content for printable worksheet
     */
    async generateWorksheet(activityData, templateType, options = {}) {
        try {
            const template = this.worksheetTemplates.get(templateType);
            if (!template) {
                throw new Error(`No worksheet template found for ${templateType}`);
            }

            const worksheetHTML = template.generate(activityData, options);
            return this.wrapInPrintContainer(worksheetHTML, template.title, options);
        } catch (error) {
            console.error('Error generating worksheet:', error);
            throw error;
        }
    }

    /**
     * Generate MCQ worksheet
     */
    generateMCQWorksheet(data) {
        const questions = data.questions || [];
        
        let html = `
            <div class="worksheet-header">
                <h2>Multiple Choice Questions</h2>
                <div class="instructions">
                    <p><strong>Instructions:</strong> Read each question carefully and circle the correct answer.</p>
                </div>
            </div>
            
            <div class="questions-container">
        `;

        questions.forEach((question, index) => {
            html += `
                <div class="question-item" data-question-id="${question.id}">
                    <div class="question-number">${index + 1}.</div>
                    <div class="question-text">${this.escapeHtml(question.question)}</div>
                    
                    <div class="options-container">
                        ${question.options.map((option, optIndex) => `
                            <div class="option-item">
                                <span class="option-letter">${String.fromCharCode(65 + optIndex)}.</span>
                                <span class="option-text">${this.escapeHtml(option.text)}</span>
                                <span class="answer-checkbox">□</span>
                            </div>
                        `).join('')}
                    </div>
                    
                    ${question.explanation ? `
                        <div class="explanation-section hidden">
                            <strong>Explanation:</strong> ${this.escapeHtml(question.explanation)}
                        </div>
                    ` : ''}
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    /**
     * Generate Flash Cards worksheet
     */
    generateFlashCardsWorksheet(data) {
        const cards = data.cards || [];
        
        let html = `
            <div class="worksheet-header">
                <h2>Flash Cards Study Guide</h2>
                <div class="instructions">
                    <p><strong>Instructions:</strong> Study the terms and definitions. Cover one column and test yourself.</p>
                </div>
            </div>
            
            <div class="flashcards-container">
                <table class="flashcards-table">
                    <thead>
                        <tr>
                            <th>Term</th>
                            <th>Definition</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        cards.forEach((card, index) => {
            html += `
                <tr class="flashcard-row">
                    <td class="term-cell">${this.escapeHtml(card.front)}</td>
                    <td class="definition-cell">${this.escapeHtml(card.back)}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
                
                <div class="study-tips">
                    <h3>Study Tips:</h3>
                    <ul>
                        <li>Cover the definition column and try to recall each term</li>
                        <li>Create your own examples for difficult concepts</li>
                        <li>Review regularly for better retention</li>
                    </ul>
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Generate Drag Drop worksheet
     */
    generateDragDropWorksheet(data) {
        const items = data.items || [];
        const categories = data.categories || [];
        
        let html = `
            <div class="worksheet-header">
                <h2>Matching Exercise</h2>
                <div class="instructions">
                    <p><strong>Instructions:</strong> Draw lines to match each item with its correct category.</p>
                </div>
            </div>
            
            <div class="matching-container">
        `;

        // Categories section
        if (categories.length > 0) {
            html += '<div class="categories-section"><h3>Categories:</h3><ul>';
            categories.forEach(category => {
                html += `<li><strong>${this.escapeHtml(category.name)}</strong>: ${this.escapeHtml(category.description || '')}</li>`;
            });
            html += '</ul></div>';
        }

        // Matching pairs
        html += '<div class="matching-pairs">';
        items.forEach((item, index) => {
            html += `
                <div class="matching-row">
                    <div class="item-column">${index + 1}. ${this.escapeHtml(item.text)}</div>
                    <div class="line-space">__________________________</div>
                    <div class="category-column"></div>
                </div>
            `;
        });
        html += '</div>';

        html += '</div>';
        return html;
    }

    /**
     * Generate Crossword worksheet
     */
    generateCrosswordWorksheet(data) {
        const gridSize = data.gridSize || 15;
        const clues = data.clues || [];
        
        let html = `
            <div class="worksheet-header">
                <h2>Crossword Puzzle</h2>
                <div class="instructions">
                    <p><strong>Instructions:</strong> Fill in the crossword puzzle using the clues below.</p>
                </div>
            </div>
            
            <div class="crossword-container">
                <!-- Crossword grid would be rendered here -->
                <div class="crossword-placeholder">
                    <p>Crossword grid visualization would appear here</p>
                    <div class="grid-placeholder" style="width: 400px; height: 400px; border: 2px solid #ccc; display: flex; align-items: center; justify-content: center;">
                        Crossword Grid (${gridSize}×${gridSize})
                    </div>
                </div>
                
                <div class="clues-section">
                    <div class="across-clues">
                        <h3>Across:</h3>
                        <ol>
                            ${clues.filter(c => c.direction === 'across')
                              .sort((a, b) => a.number - b.number)
                              .map(clue => `<li>${clue.number}. ${this.escapeHtml(clue.clue)}</li>`)
                              .join('')}
                        </ol>
                    </div>
                    
                    <div class="down-clues">
                        <h3>Down:</h3>
                        <ol>
                            ${clues.filter(c => c.direction === 'down')
                              .sort((a, b) => a.number - b.number)
                              .map(clue => `<li>${clue.number}. ${this.escapeHtml(clue.clue)}</li>`)
                              .join('')}
                        </ol>
                    </div>
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Generate Timeline worksheet
     */
    generateTimelineWorksheet(data) {
        const events = data.events || [];
        
        let html = `
            <div class="worksheet-header">
                <h2>Timeline Sequencing</h2>
                <div class="instructions">
                    <p><strong>Instructions:</strong> Arrange the following events in chronological order by numbering them 1-${events.length}.</p>
                </div>
            </div>
            
            <div class="timeline-container">
                <div class="events-list">
                    ${events.map((event, index) => `
                        <div class="event-item">
                            <span class="number-box">___</span>
                            <span class="event-text">${this.escapeHtml(event.title)}</span>
                            <span class="date-info">(${this.escapeHtml(event.date)})</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="sequencing-area">
                    <h3>Correct Order:</h3>
                    <div class="sequence-slots">
                        ${events.map((_, index) => `
                            <div class="sequence-slot">
                                <span class="slot-number">${index + 1}.</span>
                                <span class="slot-line">______________________________</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Generate Label Diagram worksheet
     */
    generateLabelDiagramWorksheet(data) {
        const items = data.items || [];
        
        let html = `
            <div class="worksheet-header">
                <h2>Labeling Exercise</h2>
                <div class="instructions">
                    <p><strong>Instructions:</strong> Label the diagram parts using the terms provided below.</p>
                </div>
            </div>
            
            <div class="labeling-container">
                <div class="diagram-placeholder">
                    <div class="diagram-area" style="width: 100%; height: 300px; border: 2px dashed #999; display: flex; align-items: center; justify-content: center; background: #f5f5f5;">
                        <p>Diagram would appear here<br><small>(Students label the parts)</small></p>
                    </div>
                </div>
                
                <div class="labels-section">
                    <h3>Terms to Label:</h3>
                    <div class="labels-grid">
                        ${items.map((item, index) => `
                            <div class="label-item">
                                <span class="label-number">${index + 1}.</span>
                                <span class="label-text">${this.escapeHtml(item.label)}</span>
                                <span class="answer-line">______________________</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Generate Content Reveal worksheet
     */
    generateContentRevealWorksheet(data) {
        const panels = data.panels || [];
        
        let html = `
            <div class="worksheet-header">
                <h2>Content Study Guide</h2>
                <div class="instructions">
                    <p><strong>Instructions:</strong> Review the content and answer the questions that follow.</p>
                </div>
            </div>
            
            <div class="content-container">
        `;

        panels.forEach((panel, index) => {
            html += `
                <div class="panel-section">
                    <h3 class="panel-title">${this.escapeHtml(panel.title)}</h3>
                    <div class="panel-content">
                        ${this.escapeHtml(panel.content)}
                    </div>
                    
                    ${panel.questions && panel.questions.length > 0 ? `
                        <div class="panel-questions">
                            <h4>Review Questions:</h4>
                            ${panel.questions.map((question, qIndex) => `
                                <div class="review-question">
                                    <p><strong>${qIndex + 1}.</strong> ${this.escapeHtml(question)}</p>
                                    <div class="answer-space">Answer: ________________________________________________________</div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    /**
     * Generate Survey worksheet
     */
    generateSurveyWorksheet(data) {
        const questions = data.questions || [];
        
        let html = `
            <div class="worksheet-header">
                <h2>Survey Questionnaire</h2>
                <div class="instructions">
                    <p><strong>Instructions:</strong> Please answer the following questions honestly.</p>
                </div>
            </div>
            
            <div class="survey-container">
        `;

        questions.forEach((question, index) => {
            html += `
                <div class="survey-question">
                    <div class="question-header">
                        <span class="question-number">${index + 1}.</span>
                        <span class="question-text">${this.escapeHtml(question.question)}</span>
                    </div>
            `;

            if (question.type === 'rating') {
                html += `
                    <div class="rating-scale">
                        <span>1 ★</span>
                        <span>2 ★★</span>
                        <span>3 ★★★</span>
                        <span>4 ★★★★</span>
                        <span>5 ★★★★★</span>
                    </div>
                    <div class="rating-response">
                        My rating: _______
                    </div>
                `;
            } else if (question.type === 'multiple_choice') {
                html += `
                    <div class="multiple-choice-options">
                        ${question.options.map((option, optIndex) => `
                            <div class="option-row">
                                <span class="option-letter">${String.fromCharCode(65 + optIndex)}.</span>
                                <span class="option-text">${this.escapeHtml(option)}</span>
                                <span class="selection-box">□</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else {
                html += `
                    <div class="open-response">
                        <textarea rows="3" placeholder="Your response..." style="width: 100%; border: 1px solid #ccc; padding: 8px;"></textarea>
                    </div>
                `;
            }

            html += '</div>';
        });

        html += '</div>';
        return html;
    }

    /**
     * Generate Pick Many worksheet
     */
    generatePickManyWorksheet(data) {
        const questions = data.questions || [];
        
        let html = `
            <div class="worksheet-header">
                <h2>Multiple Selection Exercise</h2>
                <div class="instructions">
                    <p><strong>Instructions:</strong> Select all correct answers for each question. More than one answer may be correct.</p>
                </div>
            </div>
            
            <div class="pickmany-container">
        `;

        questions.forEach((question, index) => {
            html += `
                <div class="question-item">
                    <div class="question-header">
                        <span class="question-number">${index + 1}.</span>
                        <span class="question-text">${this.escapeHtml(question.question)}</span>
                    </div>
                    
                    <div class="options-container">
                        ${question.options.map((option, optIndex) => `
                            <div class="option-item">
                                <span class="option-letter">${String.fromCharCode(65 + optIndex)}.</span>
                                <span class="option-text">${this.escapeHtml(option.text)}</span>
                                <span class="selection-box">□</span>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="hint-section">
                        <em>Hint: Select all that apply</em>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    /**
     * Generate Game Arena worksheet
     */
    generateGameArenaWorksheet(data) {
        const challenges = data.challenges || [];
        
        let html = `
            <div class="worksheet-header">
                <h2>Game Challenge Worksheet</h2>
                <div class="instructions">
                    <p><strong>Instructions:</strong> Complete each challenge and show your work.</p>
                </div>
            </div>
            
            <div class="game-container">
                <div class="challenges-section">
                    ${challenges.map((challenge, index) => `
                        <div class="challenge-item">
                            <div class="challenge-header">
                                <span class="challenge-number">Challenge ${index + 1}:</span>
                                <span class="challenge-title">${this.escapeHtml(challenge.title)}</span>
                                <span class="points">(Points: ${challenge.points || 10})</span>
                            </div>
                            
                            <div class="challenge-description">
                                ${this.escapeHtml(challenge.description)}
                            </div>
                            
                            <div class="work-area">
                                <h4>Show Your Work:</h4>
                                <textarea rows="4" placeholder="Show your calculations or reasoning here..." style="width: 100%; border: 1px solid #ccc; padding: 8px;"></textarea>
                            </div>
                            
                            <div class="answer-section">
                                <h4>Answer:</h4>
                                <input type="text" placeholder="Your final answer" style="width: 100%; padding: 8px; border: 1px solid #ccc;">
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="scoring-section">
                    <h3>Scoring Guide:</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <th>Challenge</th>
                            <th>Points Possible</th>
                            <th>Points Earned</th>
                        </tr>
                        ${challenges.map((challenge, index) => `
                            <tr>
                                <td>Challenge ${index + 1}</td>
                                <td>${challenge.points || 10}</td>
                                <td>____</td>
                            </tr>
                        `).join('')}
                        <tr style="font-weight: bold; border-top: 2px solid #000;">
                            <td>Total</td>
                            <td>${challenges.reduce((sum, ch) => sum + (ch.points || 10), 0)}</td>
                            <td>____</td>
                        </tr>
                    </table>
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Wrap worksheet content in print-friendly container
     */
    wrapInPrintContainer(content, title, options = {}) {
        const timestamp = new Date().toLocaleDateString();
        const className = options.className || 'educational-worksheet';

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Printable Worksheet</title>
    <style>
        ${this.getWorksheetStyles()}
    </style>
</head>
<body class="${className}">
    <div class="worksheet-wrapper">
        <header class="worksheet-header-print">
            <h1>${title}</h1>
            <div class="worksheet-meta">
                <span class="date">Date: ${timestamp}</span>
                <span class="name-line">Name: _______________________</span>
                <span class="class-line">Class: _______________________</span>
            </div>
        </header>
        
        <main class="worksheet-content">
            ${content}
        </main>
        
        <footer class="worksheet-footer">
            <div class="teacher-notes">
                <h3>Teacher Notes:</h3>
                <textarea rows="3" placeholder="Additional instructions or notes..." style="width: 100%;"></textarea>
            </div>
            
            <div class="grading-section">
                <div class="score-box">
                    <span>Score: ______ / ______</span>
                    <span>Date Graded: __________</span>
                    <span>Teacher Signature: __________</span>
                </div>
            </div>
        </footer>
    </div>
    
    <script>
        // Auto-print functionality
        window.onload = function() {
            ${options.autoPrint ? 'window.print();' : ''}
        };
    </script>
</body>
</html>
        `;
    }

    /**
     * Get CSS styles for printable worksheets
     */
    getWorksheetStyles() {
        return `
            /* Base styles for printable worksheets */
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #000;
                margin: 0;
                padding: 20px;
                background: #fff;
            }
            
            .worksheet-wrapper {
                max-width: 800px;
                margin: 0 auto;
                background: #fff;
                padding: 20px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            
            .worksheet-header-print {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #333;
                padding-bottom: 15px;
            }
            
            .worksheet-header-print h1 {
                margin: 0 0 15px 0;
                color: #2c3e50;
                font-size: 24px;
            }
            
            .worksheet-meta {
                display: flex;
                justify-content: space-between;
                font-size: 14px;
            }
            
            .worksheet-content {
                margin: 20px 0;
            }
            
            .instructions {
                background: #f8f9fa;
                padding: 15px;
                border-left: 4px solid #3498db;
                margin-bottom: 20px;
            }
            
            .question-item {
                margin-bottom: 25px;
                padding: 15px;
                border: 1px solid #ddd;
                border-radius: 5px;
            }
            
            .question-number {
                font-weight: bold;
                margin-right: 10px;
                color: #2c3e50;
            }
            
            .question-text {
                font-weight: bold;
                margin-bottom: 10px;
                display: block;
            }
            
            .options-container {
                margin-top: 10px;
            }
            
            .option-item {
                display: flex;
                align-items: center;
                margin-bottom: 8px;
            }
            
            .option-letter {
                font-weight: bold;
                margin-right: 10px;
                width: 20px;
            }
            
            .answer-checkbox {
                margin-left: auto;
                font-size: 18px;
                border: 1px solid #000;
                padding: 2px 6px;
            }
            
            .explanation-section {
                margin-top: 15px;
                padding: 10px;
                background: #e8f4f8;
                border-left: 3px solid #3498db;
                font-size: 14px;
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 15px 0;
            }
            
            th, td {
                border: 1px solid #333;
                padding: 10px;
                text-align: left;
            }
            
            th {
                background: #f8f9fa;
                font-weight: bold;
            }
            
            .events-list .event-item {
                display: flex;
                align-items: center;
                margin-bottom: 10px;
                padding: 8px;
                background: #f8f9fa;
            }
            
            .number-box {
                display: inline-block;
                width: 30px;
                height: 30px;
                border: 2px solid #000;
                text-align: center;
                line-height: 30px;
                margin-right: 10px;
                font-weight: bold;
            }
            
            .sequence-slot {
                display: flex;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .slot-number {
                font-weight: bold;
                margin-right: 10px;
                width: 25px;
            }
            
            .survey-question {
                margin-bottom: 25px;
                padding: 15px;
                border: 1px solid #eee;
                border-radius: 5px;
            }
            
            .rating-scale {
                display: flex;
                gap: 15px;
                margin: 10px 0;
                font-size: 14px;
            }
            
            .challenge-item {
                margin-bottom: 30px;
                padding: 20px;
                border: 2px solid #3498db;
                border-radius: 8px;
                background: #f8f9fa;
            }
            
            .challenge-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid #ddd;
            }
            
            .worksheet-footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 2px solid #333;
            }
            
            .teacher-notes textarea {
                min-height: 80px;
                resize: vertical;
            }
            
            .score-box {
                display: flex;
                justify-content: space-around;
                margin-top: 20px;
                padding: 15px;
                background: #f8f9fa;
                border: 1px solid #ddd;
                border-radius: 5px;
            }
            
            /* Print-specific styles */
            @media print {
                body {
                    padding: 0;
                    margin: 0;
                }
                
                .worksheet-wrapper {
                    box-shadow: none;
                    padding: 10px;
                }
                
                textarea, input {
                    border: 1px solid #999 !important;
                    background: #fff !important;
                }
                
                .answer-checkbox, .selection-box, .number-box {
                    border: 1px solid #000 !important;
                }
            }
            
            /* Responsive adjustments */
            @media (max-width: 768px) {
                .worksheet-wrapper {
                    padding: 10px;
                }
                
                .worksheet-meta {
                    flex-direction: column;
                    gap: 5px;
                }
                
                .rating-scale {
                    flex-wrap: wrap;
                }
            }
        `;
    }

    /**
     * Utility function to escape HTML
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Export worksheet as HTML file
     */
    async exportAsHTML(activityData, templateType, filename = null) {
        try {
            const htmlContent = await this.generateWorksheet(activityData, templateType);
            const blob = new Blob([htmlContent], { type: 'text/html' });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || `${templateType}-worksheet-${Date.now()}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('Error exporting worksheet as HTML:', error);
            throw error;
        }
    }

    /**
     * Get available worksheet templates
     */
    getAvailableTemplates() {
        return Array.from(this.worksheetTemplates.keys());
    }

    /**
     * Check if template supports worksheet export
     */
    supportsWorksheetExport(templateType) {
        return this.worksheetTemplates.has(templateType);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WorksheetExportService;
} else {
    window.WorksheetExportService = WorksheetExportService;
}