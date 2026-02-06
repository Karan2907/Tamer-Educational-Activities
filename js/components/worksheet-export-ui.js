/**
 * Worksheet Export UI Component
 * Provides user interface for exporting activities as printable worksheets
 */

class WorksheetExportUI {
    constructor(exportService) {
        this.exportService = exportService;
        this.container = null;
        this.currentActivityData = null;
        this.currentTemplateType = null;
    }

    /**
     * Initialize the worksheet export UI
     */
    initialize(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.warn('Worksheet export container not found');
            return;
        }

        this.renderUI();
        this.bindEvents();
    }

    /**
     * Render the UI elements
     */
    renderUI() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="worksheet-export-panel">
                <div class="panel-header">
                    <h3>Worksheet Export</h3>
                    <p class="subtitle">Generate printable worksheets for offline learning</p>
                </div>
                
                <div class="export-options">
                    <div class="option-group">
                        <label for="worksheet-template">Template Type:</label>
                        <select id="worksheet-template" class="template-select">
                            <option value="">Select a template...</option>
                            <option value="mcq">Multiple Choice Questions</option>
                            <option value="flashcards">Flash Cards</option>
                            <option value="dragdrop">Drag & Drop Matching</option>
                            <option value="crossword">Crossword Puzzle</option>
                            <option value="timeline">Timeline Sequencing</option>
                            <option value="labeldiagram">Label Diagram</option>
                            <option value="contentreveal">Content Reveal</option>
                            <option value="survey">Survey/Questionnaire</option>
                            <option value="pickmany">Pick Many Questions</option>
                            <option value="gamearena">Game Challenges</option>
                        </select>
                    </div>
                    
                    <div class="option-group">
                        <label>
                            <input type="checkbox" id="include-answers" />
                            Include Answers/Key
                        </label>
                    </div>
                    
                    <div class="option-group">
                        <label>
                            <input type="checkbox" id="auto-print" />
                            Auto-print when opened
                        </label>
                    </div>
                    
                    <div class="option-group">
                        <label>
                            <input type="checkbox" id="include-instructions" checked />
                            Include detailed instructions
                        </label>
                    </div>
                </div>
                
                <div class="export-actions">
                    <button id="preview-worksheet" class="btn btn-secondary" disabled>
                        Preview Worksheet
                    </button>
                    <button id="download-worksheet" class="btn btn-primary" disabled>
                        Download Worksheet
                    </button>
                </div>
                
                <div id="worksheet-preview" class="worksheet-preview hidden">
                    <h4>Worksheet Preview</h4>
                    <div class="preview-content">
                        <p>Select a template type to see preview options.</p>
                    </div>
                </div>
                
                <div id="export-status" class="export-status hidden">
                    <div class="status-message"></div>
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                </div>
            </div>
        `;

        // Add required CSS
        this.addStyles();
    }

    /**
     * Add required CSS styles
     */
    addStyles() {
        const styleId = 'worksheet-export-styles';
        if (document.getElementById(styleId)) return;

        const styles = document.createElement('style');
        styles.id = styleId;
        styles.textContent = `
            .worksheet-export-panel {
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                font-family: Arial, sans-serif;
            }
            
            .panel-header h3 {
                margin: 0 0 8px 0;
                color: #2c3e50;
                font-size: 18px;
            }
            
            .subtitle {
                margin: 0 0 20px 0;
                color: #6c757d;
                font-size: 14px;
            }
            
            .option-group {
                margin-bottom: 15px;
            }
            
            .option-group label {
                display: block;
                margin-bottom: 5px;
                font-weight: 500;
                color: #495057;
            }
            
            .template-select {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #ced4da;
                border-radius: 4px;
                background: white;
                font-size: 14px;
            }
            
            .option-group input[type="checkbox"] {
                margin-right: 8px;
            }
            
            .export-actions {
                display: flex;
                gap: 10px;
                margin: 20px 0;
            }
            
            .btn {
                padding: 10px 20px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s ease;
            }
            
            .btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
            
            .btn-primary {
                background: #007bff;
                color: white;
            }
            
            .btn-primary:hover:not(:disabled) {
                background: #0056b3;
            }
            
            .btn-secondary {
                background: #6c757d;
                color: white;
            }
            
            .btn-secondary:hover:not(:disabled) {
                background: #545b62;
            }
            
            .worksheet-preview {
                margin-top: 20px;
                padding: 15px;
                background: white;
                border: 1px solid #dee2e6;
                border-radius: 4px;
            }
            
            .worksheet-preview h4 {
                margin: 0 0 15px 0;
                color: #2c3e50;
            }
            
            .hidden {
                display: none;
            }
            
            .export-status {
                margin-top: 20px;
                padding: 15px;
                background: #e9ecef;
                border-radius: 4px;
            }
            
            .status-message {
                margin-bottom: 10px;
                font-weight: 500;
            }
            
            .progress-bar {
                width: 100%;
                height: 8px;
                background: #dee2e6;
                border-radius: 4px;
                overflow: hidden;
            }
            
            .progress-fill {
                height: 100%;
                background: #28a745;
                width: 0%;
                transition: width 0.3s ease;
            }
            
            @media print {
                .worksheet-export-panel {
                    display: none;
                }
            }
        `;

        document.head.appendChild(styles);
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Template selection change
        const templateSelect = document.getElementById('worksheet-template');
        if (templateSelect) {
            templateSelect.addEventListener('change', (e) => {
                this.currentTemplateType = e.target.value;
                this.updateButtonStates();
                this.showTemplatePreview(e.target.value);
            });
        }

        // Preview button
        const previewBtn = document.getElementById('preview-worksheet');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                this.previewWorksheet();
            });
        }

        // Download button
        const downloadBtn = document.getElementById('download-worksheet');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.downloadWorksheet();
            });
        }
    }

    /**
     * Update button states based on selections
     */
    updateButtonStates() {
        const previewBtn = document.getElementById('preview-worksheet');
        const downloadBtn = document.getElementById('download-worksheet');
        const hasTemplate = !!this.currentTemplateType;
        
        if (previewBtn) previewBtn.disabled = !hasTemplate;
        if (downloadBtn) downloadBtn.disabled = !hasTemplate;
    }

    /**
     * Show template-specific preview information
     */
    showTemplatePreview(templateType) {
        const previewContainer = document.getElementById('worksheet-preview');
        if (!previewContainer || !templateType) return;

        const previewContent = previewContainer.querySelector('.preview-content');
        if (!previewContent) return;

        const templateInfo = this.getTemplateInfo(templateType);
        previewContent.innerHTML = `
            <div class="template-preview-info">
                <h5>${templateInfo.title}</h5>
                <p><strong>Description:</strong> ${templateInfo.description}</p>
                <p><strong>Best for:</strong> ${templateInfo.bestFor}</p>
                <div class="features">
                    <strong>Included Features:</strong>
                    <ul>
                        ${templateInfo.features.map(feature => `<li>${feature}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;

        previewContainer.classList.remove('hidden');
    }

    /**
     * Get template information
     */
    getTemplateInfo(templateType) {
        const templateInfos = {
            mcq: {
                title: 'Multiple Choice Questions Worksheet',
                description: 'Traditional multiple choice format with answer bubbles',
                bestFor: 'Assessment and review activities',
                features: ['Question numbering', 'Answer choice letters', 'Answer checkboxes', 'Optional explanations']
            },
            flashcards: {
                title: 'Flash Cards Study Guide',
                description: 'Two-column format for terms and definitions',
                bestFor: 'Vocabulary building and memorization',
                features: ['Term-definition table', 'Study tips section', 'Self-testing format']
            },
            dragdrop: {
                title: 'Matching Exercise Worksheet',
                description: 'Lines and boxes for matching items to categories',
                bestFor: 'Classification and association exercises',
                features: ['Category listings', 'Matching lines', 'Clear instructions']
            },
            crossword: {
                title: 'Crossword Puzzle Worksheet',
                description: 'Classic crossword format with clues',
                bestFor: 'Word games and vocabulary practice',
                features: ['Grid placeholder', 'Across/Down clues', 'Numbered squares']
            },
            timeline: {
                title: 'Timeline Sequencing Worksheet',
                description: 'Chronological ordering exercise',
                bestFor: 'Historical events and process sequencing',
                features: ['Event listings', 'Numbering spaces', 'Sequential arrangement']
            },
            labeldiagram: {
                title: 'Labeling Exercise Worksheet',
                description: 'Diagram with labeled parts',
                bestFor: 'Scientific and technical concepts',
                features: ['Diagram placeholder', 'Term listings', 'Labeling lines']
            },
            contentreveal: {
                title: 'Content Study Guide',
                description: 'Information panels with review questions',
                bestFor: 'Content review and comprehension',
                features: ['Content sections', 'Review questions', 'Study guidance']
            },
            survey: {
                title: 'Survey Questionnaire Worksheet',
                description: 'Opinion and feedback collection format',
                bestFor: 'Research and feedback gathering',
                features: ['Rating scales', 'Open-ended responses', 'Multiple choice options']
            },
            pickmany: {
                title: 'Multiple Selection Worksheet',
                description: 'Select all correct answers format',
                bestFor: 'Comprehensive knowledge checking',
                features: ['Multiple selection boxes', '"Select all that apply" instructions', 'Checkbox format']
            },
            gamearena: {
                title: 'Game Challenge Worksheet',
                description: 'Problem-solving challenges with work areas',
                bestFor: 'Mathematical and logical reasoning',
                features: ['Challenge sections', 'Work/show work areas', 'Scoring guide', 'Point values']
            }
        };

        return templateInfos[templateType] || templateInfos.mcq;
    }

    /**
     * Set current activity data
     */
    setActivityData(activityData, templateType) {
        this.currentActivityData = activityData;
        this.currentTemplateType = templateType;
        
        // Update template selector
        const templateSelect = document.getElementById('worksheet-template');
        if (templateSelect && templateType) {
            templateSelect.value = templateType;
            this.showTemplatePreview(templateType);
        }
        
        this.updateButtonStates();
    }

    /**
     * Preview the worksheet
     */
    async previewWorksheet() {
        if (!this.currentTemplateType || !this.currentActivityData) {
            this.showStatus('Please select a template type and activity data', 'error');
            return;
        }

        try {
            this.showStatus('Generating preview...', 'info');
            
            const options = this.getExportOptions();
            const worksheetHTML = await this.exportService.worksheetService.generateWorksheet(
                this.currentActivityData,
                this.currentTemplateType,
                { ...options, previewMode: true }
            );

            // Open in new window/tab for preview
            const previewWindow = window.open('', '_blank');
            previewWindow.document.write(worksheetHTML);
            previewWindow.document.close();

            this.showStatus('Preview opened in new window', 'success');
        } catch (error) {
            console.error('Error generating preview:', error);
            this.showStatus(`Error: ${error.message}`, 'error');
        }
    }

    /**
     * Download the worksheet
     */
    async downloadWorksheet() {
        if (!this.currentTemplateType || !this.currentActivityData) {
            this.showStatus('Please select a template type and activity data', 'error');
            return;
        }

        try {
            this.showStatus('Generating worksheet...', 'info');
            this.setProgress(20);

            const options = this.getExportOptions();
            const result = await this.exportService.exportToWorksheet(
                this.currentActivityData,
                this.currentTemplateType,
                options
            );

            this.setProgress(80);
            this.showStatus('Worksheet ready for download', 'success');
            this.setProgress(100);

            // Trigger download
            this.exportService.downloadExport(result, result.filename);

        } catch (error) {
            console.error('Error downloading worksheet:', error);
            this.showStatus(`Error: ${error.message}`, 'error');
            this.setProgress(0);
        }
    }

    /**
     * Get current export options from UI
     */
    getExportOptions() {
        return {
            includeAnswers: document.getElementById('include-answers')?.checked || false,
            autoPrint: document.getElementById('auto-print')?.checked || false,
            includeInstructions: document.getElementById('include-instructions')?.checked || true,
            filename: `worksheet-${this.currentTemplateType}-${Date.now()}.html`
        };
    }

    /**
     * Show status message
     */
    showStatus(message, type = 'info') {
        const statusContainer = document.getElementById('export-status');
        const statusMessage = statusContainer?.querySelector('.status-message');
        
        if (statusContainer && statusMessage) {
            statusMessage.textContent = message;
            statusMessage.className = `status-message ${type}`;
            statusContainer.classList.remove('hidden');
            
            // Auto-hide success messages after 3 seconds
            if (type === 'success') {
                setTimeout(() => {
                    statusContainer.classList.add('hidden');
                }, 3000);
            }
        }
    }

    /**
     * Set progress percentage
     */
    setProgress(percentage) {
        const progressBar = document.querySelector('.progress-fill');
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
    }

    /**
     * Hide status
     */
    hideStatus() {
        const statusContainer = document.getElementById('export-status');
        if (statusContainer) {
            statusContainer.classList.add('hidden');
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WorksheetExportUI;
} else {
    window.WorksheetExportUI = WorksheetExportUI;
}