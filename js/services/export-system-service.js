/**
 * Export System Service
 * 
 * This service handles the generation of PDF, PPT, and SCORM exports
 * for educational content in the platform.
 */

class ExportSystemService {
    constructor() {
        this.exportFormats = ['pdf', 'ppt', 'scorm', 'worksheet'];
        this.exportQueue = [];
        this.isProcessing = false;
        this.progressCallbacks = new Map();
        this.exportWorkers = [];
        this.worksheetService = null;
    }
    
    /**
     * Initialize the export system
     */
    initialize() {
        console.log('Export system initialized');
        // Set up export workers
        this.setupExportWorkers();
        // Initialize worksheet service
        this.initializeWorksheetService();
    }
    
    /**
     * Set up export workers
     */
    setupExportWorkers() {
        // In a real implementation, this would set up web workers or service workers
        // for handling export tasks in the background
        console.log('Export workers set up');
    }
    
    /**
     * Initialize worksheet export service
     */
    async initializeWorksheetService() {
        try {
            // Dynamically load worksheet export service if not already available
            if (typeof window.WorksheetExportService === 'undefined') {
                await this.loadScript('./js/services/worksheet-export-service.js');
            }
            
            this.worksheetService = new WorksheetExportService();
            console.log('Worksheet export service initialized');
        } catch (error) {
            console.error('Failed to initialize worksheet service:', error);
        }
    }
    
    /**
     * Load script dynamically
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    /**
     * Export content to PDF format
     */
    async exportToPDF(contentData, options = {}) {
        try {
            const {
                filename = 'export.pdf',
                orientation = 'portrait',
                format = 'a4',
                margins = { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
                includeAnswers = false,
                includeMetadata = true
            } = options;
            
            // Validate content data
            if (!contentData) {
                throw new Error('Content data is required for PDF export');
            }
            
            // Create PDF using jsPDF or similar library
            // For this implementation, we'll simulate the process
            
            console.log(`Starting PDF export for ${filename}`);
            
            // Simulate export process
            const progressCallback = this.progressCallbacks.get('pdf-export');
            if (progressCallback) {
                progressCallback({ stage: 'preparing', progress: 10 });
            }
            
            // Convert content to PDF format
            const pdfData = await this.convertToPDF(contentData, {
                orientation,
                format,
                margins,
                includeAnswers,
                includeMetadata
            });
            
            if (progressCallback) {
                progressCallback({ stage: 'processing', progress: 60 });
            }
            
            // Finalize PDF
            const finalPdf = await this.finalizePDF(pdfData);
            
            if (progressCallback) {
                progressCallback({ stage: 'completed', progress: 100 });
            }
            
            console.log(`PDF export completed: ${filename}`);
            
            return {
                success: true,
                data: finalPdf,
                filename: filename,
                size: finalPdf.byteLength || finalPdf.length,
                mimeType: 'application/pdf'
            };
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            throw error;
        }
    }
    
    /**
     * Convert content to PDF format
     */
    async convertToPDF(contentData, options) {
        // This would use a library like jsPDF or Puppeteer in a real implementation
        // For now, we'll simulate the conversion
        
        // Create a simple representation of what the PDF might contain
        const pdfStructure = {
            title: contentData.title || 'Exported Content',
            content: contentData.content || contentData.questions || contentData.cards || [],
            metadata: options.includeMetadata ? contentData.metadata : null,
            answers: options.includeAnswers ? contentData.answers || contentData.correctAnswers : null,
            createdAt: new Date().toISOString(),
            exportedBy: contentData.author || 'System'
        };
        
        // Simulate processing time
        await this.delay(500);
        
        return JSON.stringify(pdfStructure);
    }
    
    /**
     * Finalize PDF creation
     */
    async finalizePDF(pdfData) {
        // In a real implementation, this would create the actual PDF file
        // For simulation, we'll return the stringified data
        return new TextEncoder().encode(pdfData);
    }
    
    /**
     * Export content to PowerPoint format
     */
    async exportToPPT(contentData, options = {}) {
        try {
            const {
                filename = 'export.pptx',
                includeAnimations = false,
                includeTransitions = false,
                slideLayout = 'default',
                includeAnswers = false
            } = options;
            
            // Validate content data
            if (!contentData) {
                throw new Error('Content data is required for PPT export');
            }
            
            console.log(`Starting PPT export for ${filename}`);
            
            const progressCallback = this.progressCallbacks.get('ppt-export');
            if (progressCallback) {
                progressCallback({ stage: 'preparing', progress: 10 });
            }
            
            // Convert content to PPT format
            const pptData = await this.convertToPPT(contentData, {
                includeAnimations,
                includeTransitions,
                slideLayout,
                includeAnswers
            });
            
            if (progressCallback) {
                progressCallback({ stage: 'processing', progress: 60 });
            }
            
            // Finalize PPT
            const finalPpt = await this.finalizePPT(pptData);
            
            if (progressCallback) {
                progressCallback({ stage: 'completed', progress: 100 });
            }
            
            console.log(`PPT export completed: ${filename}`);
            
            return {
                success: true,
                data: finalPpt,
                filename: filename,
                size: finalPpt.byteLength || finalPpt.length,
                mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            };
        } catch (error) {
            console.error('Error exporting to PPT:', error);
            throw error;
        }
    }
    
    /**
     * Convert content to PPT format
     */
    async convertToPPT(contentData, options) {
        // Create PPT structure based on content type
        let slides = [];
        
        if (contentData.questions) {
            // MCQ or similar format
            slides = contentData.questions.map((question, index) => ({
                slideNumber: index + 1,
                type: 'question',
                title: `Question ${index + 1}`,
                content: question.question,
                options: question.options || question.choices,
                correctAnswer: options.includeAnswers ? question.correctAnswer : null
            }));
        } else if (contentData.cards) {
            // Flashcards format
            slides = contentData.cards.map((card, index) => ({
                slideNumber: index + 1,
                type: 'flashcard',
                front: card.front || card.term,
                back: card.back || card.definition
            }));
        } else if (contentData.items) {
            // Generic items format
            slides = contentData.items.map((item, index) => ({
                slideNumber: index + 1,
                type: 'item',
                title: item.title || `Item ${index + 1}`,
                content: item.content || item.text || item.description
            }));
        } else {
            // Fallback: treat as single slide
            slides = [{
                slideNumber: 1,
                type: 'content',
                title: contentData.title || 'Content Slide',
                content: contentData.content || JSON.stringify(contentData)
            }];
        }
        
        const pptStructure = {
            title: contentData.title || 'Exported Presentation',
            author: contentData.author || 'System',
            slides: slides,
            settings: {
                animations: options.includeAnimations,
                transitions: options.includeTransitions,
                layout: options.slideLayout
            },
            createdAt: new Date().toISOString()
        };
        
        // Simulate processing time
        await this.delay(800);
        
        return JSON.stringify(pptStructure);
    }
    
    /**
     * Finalize PPT creation
     */
    async finalizePPT(pptData) {
        // In a real implementation, this would create the actual PPTX file
        // For simulation, we'll return the stringified data
        return new TextEncoder().encode(pptData);
    }
    
    /**
     * Export content to Worksheet format
     */
    async exportToWorksheet(contentData, templateType, options = {}) {
        try {
            // Validate content data
            if (!contentData) {
                throw new Error('Content data is required for worksheet export');
            }
            
            // Ensure worksheet service is available
            if (!this.worksheetService) {
                await this.initializeWorksheetService();
                if (!this.worksheetService) {
                    throw new Error('Worksheet service not available');
                }
            }
            
            console.log(`Starting worksheet export for ${templateType}`);
            
            const progressCallback = this.progressCallbacks.get('worksheet-export');
            if (progressCallback) {
                progressCallback({ stage: 'preparing', progress: 10 });
            }
            
            // Generate worksheet HTML
            const worksheetHTML = await this.worksheetService.generateWorksheet(
                contentData, 
                templateType, 
                options
            );
            
            if (progressCallback) {
                progressCallback({ stage: 'processing', progress: 60 });
            }
            
            // Create downloadable file
            const filename = options.filename || `${templateType}-worksheet-${Date.now()}.html`;
            const blob = new Blob([worksheetHTML], { type: 'text/html' });
            
            if (progressCallback) {
                progressCallback({ stage: 'completed', progress: 100 });
            }
            
            console.log(`Worksheet export completed: ${filename}`);
            
            return {
                success: true,
                data: worksheetHTML,
                filename: filename,
                size: blob.size,
                mimeType: 'text/html',
                templateType: templateType
            };
        } catch (error) {
            console.error('Error exporting to worksheet:', error);
            throw error;
        }
    }
    
    /**
     * Export content to SCORM format
     */
    async exportToSCORM(contentData, options = {}) {
        try {
            const {
                filename = 'scorm_package.zip',
                scormVersion = '1.2', // or '2004'
                title = 'SCORM Package',
                description = 'Exported from educational platform',
                masteryScore = 70,
                maxTimeAllowed = null,
                timeLimitAction = 'exit,message'
            } = options;
            
            // Validate content data
            if (!contentData) {
                throw new Error('Content data is required for SCORM export');
            }
            
            console.log(`Starting SCORM export for ${filename}`);
            
            const progressCallback = this.progressCallbacks.get('scorm-export');
            if (progressCallback) {
                progressCallback({ stage: 'preparing', progress: 10 });
            }
            
            // Create SCORM package structure
            const scormPackage = await this.createSCORMPackage(contentData, {
                scormVersion,
                title,
                description,
                masteryScore,
                maxTimeAllowed,
                timeLimitAction
            });
            
            if (progressCallback) {
                progressCallback({ stage: 'packaging', progress: 50 });
            }
            
            // Create manifest (imsmanifest.xml)
            const manifest = await this.createSCORMManifest(scormPackage);
            
            if (progressCallback) {
                progressCallback({ stage: 'finalizing', progress: 80 });
            }
            
            // Package everything into a ZIP file
            const finalScorm = await this.packageSCORM(scormPackage, manifest);
            
            if (progressCallback) {
                progressCallback({ stage: 'completed', progress: 100 });
            }
            
            console.log(`SCORM export completed: ${filename}`);
            
            return {
                success: true,
                data: finalScorm,
                filename: filename,
                size: finalScorm.byteLength || finalScorm.length,
                mimeType: 'application/zip',
                scormVersion: scormVersion
            };
        } catch (error) {
            console.error('Error exporting to SCORM:', error);
            throw error;
        }
    }
    
    /**
     * Create SCORM package structure
     */
    async createSCORMPackage(contentData, options) {
        // Create the structure for the SCORM package
        const organizationTitle = options.title || contentData.title || 'SCORM Content';
        
        // Determine the appropriate structure based on content type
        let scoStructure = [];
        
        if (contentData.questions) {
            // MCQ format
            scoStructure = contentData.questions.map((question, index) => ({
                id: `question_${index + 1}`,
                title: `Question ${index + 1}`,
                type: 'question',
                question: question.question,
                options: question.options || question.choices,
                correctAnswer: question.correctAnswer,
                objectiveId: `obj_question_${index + 1}`
            }));
        } else if (contentData.cards) {
            // Flashcards format
            scoStructure = contentData.cards.map((card, index) => ({
                id: `card_${index + 1}`,
                title: `Card ${index + 1}`,
                type: 'flashcard',
                front: card.front || card.term,
                back: card.back || card.definition
            }));
        } else {
            // Generic content
            scoStructure = [{
                id: 'main_content',
                title: 'Main Content',
                type: 'content',
                content: contentData.content || JSON.stringify(contentData)
            }];
        }
        
        const scormPackage = {
            metadata: {
                schemaversion: options.scormVersion,
                title: options.title,
                description: options.description,
                creator: contentData.author || 'System',
                copyright: contentData.copyright || '© Educational Platform',
                version: '1.0'
            },
            organizations: [{
                identifier: 'default_org',
                title: organizationTitle,
                items: scoStructure.map((item, index) => ({
                    identifier: item.id,
                    title: item.title,
                    type: 'sco',
                    href: `content/${item.id}.html`,
                    parameters: '',
                    isvisible: true,
                    prerequisites: '',
                    sequencing: null,
                    deliverycontrols: {
                        tracked: true,
                        completion_setbycontent: true,
                        objective_setbycontent: true
                    }
                }))
            }],
            resources: scoStructure.map(item => ({
                identifier: `res_${item.id}`,
                type: 'webcontent',
                href: `content/${item.id}.html`,
                parameters: '',
                base: '',
                dependencies: [],
                metadata: null
            })),
            content: scoStructure,
            settings: {
                masteryScore: options.masteryScore,
                maxTimeAllowed: options.maxTimeAllowed,
                timeLimitAction: options.timeLimitAction
            }
        };
        
        // Simulate processing time
        await this.delay(1000);
        
        return scormPackage;
    }
    
    /**
     * Create SCORM manifest (imsmanifest.xml)
     */
    async createSCORMManifest(scormPackage) {
        // Create the IMS Manifest XML structure
        const manifestXml = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="manifest_${Date.now()}" version="1.0" xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2" 
          xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2" 
          xmlns:imsss="http://www.imsglobal.org/xsd/imsss_rootv1p0" 
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
          xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd 
                              http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd 
                              http://www.imsglobal.org/xsd/imsss_rootv1p0 imsss_rootv1p0.xsd">
  
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>${scormPackage.metadata.schemaversion}</schemaversion>
  </metadata>
  
  <organizations default="default_org">
    ${scormPackage.organizations.map(org => `
    <organization identifier="${org.identifier}">
      <title>${this.escapeXml(org.title)}</title>
      ${org.items.map(item => `
      <item identifier="${item.identifier}" identifierref="${item.id}" isvisible="${item.isvisible}">
        <title>${this.escapeXml(item.title)}</title>
        ${item.parameters ? `<parameters>${this.escapeXml(item.parameters)}</parameters>` : ''}
        ${item.prerequisites ? `<prerequisites>${this.escapeXml(item.prerequisites)}</prerequisites>` : ''}
      </item>`).join('\n      ')}
    </organization>`).join('\n    ')}
  </organizations>
  
  <resources>
    ${scormPackage.resources.map(res => `
    <resource identifier="${res.identifier}" type="${res.type}" href="${res.href}">
      ${res.parameters ? `<parameters>${this.escapeXml(res.parameters)}</parameters>` : ''}
      ${res.base ? `<file href="${res.base}"/>` : ''}
    </resource>`).join('\n    ')}
  </resources>
  
</manifest>`;
        
        return manifestXml;
    }
    
    /**
     * Package SCORM content into ZIP
     */
    async packageSCORM(scormPackage, manifest) {
        // In a real implementation, this would create an actual ZIP file
        // For simulation, we'll create a structured representation
        
        const packageStructure = {
            'imsmanifest.xml': manifest,
            'content/': {},
            'index.html': this.generateSCORMIndexPage(scormPackage),
            'api.js': this.generateSCORMAPI(),
            'content.js': this.generateSCORMContentJS(scormPackage)
        };
        
        // Add individual content files
        scormPackage.content.forEach(item => {
            packageStructure[`content/${item.id}.html`] = this.generateSCORMContentPage(item, scormPackage.settings);
        });
        
        // Simulate packaging process
        await this.delay(500);
        
        // Return as encoded data
        return new TextEncoder().encode(JSON.stringify(packageStructure));
    }
    
    /**
     * Generate SCORM index page
     */
    generateSCORMIndexPage(scormPackage) {
        return `<!DOCTYPE html>
<html>
<head>
    <title>${this.escapeXml(scormPackage.metadata.title || 'SCORM Content')}</title>
    <script src="api.js"></script>
    <script src="content.js"></script>
</head>
<body>
    <h1>${this.escapeXml(scormPackage.metadata.title || 'SCORM Content')}</h1>
    <div id="content-area">
        <!-- Content will be loaded dynamically -->
    </div>
    <script>
        // Initialize SCORM
        var scorm = new ScormAPI();
        scorm.initialize();
        
        // Load content
        loadContent();
        
        // Set completion status when done
        function setCompleted() {
            scorm.setValue('cmi.core.lesson_status', 'completed');
            scorm.commit();
        }
    </script>
</body>
</html>`;
    }
    
    /**
     * Generate SCORM API implementation
     */
    generateSCORMAPI() {
        return `// Simplified SCORM 1.2 API Implementation
var ScormAPI = function() {
    var initialized = false;
    var dataBucket = {};
    var errorCode = 0;

    this.LMSInitialize = function(param) {
        if (initialized) {
            errorCode = 101; // Already initialized
            return 'false';
        }
        
        initialized = true;
        errorCode = 0;
        
        // Set default values
        dataBucket['cmi.core.lesson_status'] = 'incomplete';
        dataBucket['cmi.core.exit'] = '';
        dataBucket['cmi.core.session_time'] = '00:00:00';
        
        return 'true';
    };

    this.LMSFinish = function(param) {
        if (!initialized) {
            errorCode = 301; // Not initialized
            return 'false';
        }
        
        initialized = false;
        errorCode = 0;
        
        // Here you would save data to server
        console.log('SCORM session finished', dataBucket);
        
        return 'true';
    };

    this.LMSGetValue = function(element) {
        if (!initialized) {
            errorCode = 301; // Not initialized
            return '';
        }

        errorCode = 0;
        
        if (dataBucket.hasOwnProperty(element)) {
            return dataBucket[element];
        } else {
            errorCode = 401; // Element not found
            return '';
        }
    };

    this.LMSSetValue = function(element, value) {
        if (!initialized) {
            errorCode = 301; // Not initialized
            return 'false';
        }

        if (element.startsWith('cmi.') || element.startsWith('adl.')) {
            dataBucket[element] = value;
            errorCode = 0;
            return 'true';
        } else {
            errorCode = 401; // Element not found
            return 'false';
        }
    };

    this.LMSCommit = function(param) {
        if (!initialized) {
            errorCode = 301; // Not initialized
            return 'false';
        }

        errorCode = 0;
        
        // Here you would send data to server
        console.log('SCORM data committed', dataBucket);
        
        return 'true';
    };

    this.LMSGetLastError = function() {
        return errorCode.toString();
    };

    this.LMSGetErrorString = function(errorCode) {
        var errorStrings = {
            0: 'No error',
            101: 'General exception',
            201: 'Invalid argument error',
            202: 'Element cannot have children',
            203: 'Element not an array - cannot have count',
            301: 'Not initialized',
            401: 'General Get Failure',
            402: 'General Set Failure',
            403: 'Not implemented error'
        };
        
        return errorStrings[errorCode] || 'Unknown error';
    };

    this.LMSGetDiagnostic = function(errorCode) {
        return 'Diagnostic information for error code: ' + errorCode;
    };
};

// Global API instance for SCORM
var API = new ScormAPI();

// Aliases for SCORM 2004 (if needed)
var API_1484_11 = API;`;
    }
    
    /**
     * Generate SCORM content JavaScript
     */
    generateSCORMContentJS(scormPackage) {
        return `// Content-specific SCORM functionality
function loadContent() {
    // Load content based on SCORM package structure
    const contentArea = document.getElementById('content-area');
    
    // Example: load first piece of content
    if (window.scorm && scorm.LMSInitialize('')) {
        console.log('SCORM initialized successfully');
        
        // Set initial values
        scorm.LMSSetValue('cmi.core.lesson_location', '1');
        scorm.LMSSetValue('cmi.core.student_name', 'Learner');
        
        // Render content
        renderContent(contentArea, ${JSON.stringify(scormPackage.content[0] || {}), 2});
    }
}

function renderContent(container, content) {
    // Render content based on type
    switch(content.type) {
        case 'question':
            renderQuestion(container, content);
            break;
        case 'flashcard':
            renderFlashcard(container, content);
            break;
        default:
            renderGenericContent(container, content);
    }
}

function renderQuestion(container, question) {
    const html = \`
        <div class="scorm-question">
            <h3>\${question.title}</h3>
            <p>\${question.question}</p>
            <ul>
                \${(question.options || []).map(opt => \`<li>\${opt}</li>\`).join('')}
            </ul>
        </div>
    \`;
    container.innerHTML = html;
}

function renderFlashcard(container, card) {
    const html = \`
        <div class="scorm-flashcard">
            <div class="front">\${card.front}</div>
            <div class="back">\${card.back}</div>
        </div>
    \`;
    container.innerHTML = html;
}

function renderGenericContent(container, content) {
    const html = \`
        <div class="scorm-content">
            <h3>\${content.title}</h3>
            <div>\${content.content || content.description || JSON.stringify(content)}</div>
        </div>
    \`;
    container.innerHTML = html;
}`;
    }
    
    /**
     * Generate SCORM content page
     */
    generateSCORMContentPage(item, settings) {
        return `<!DOCTYPE html>
<html>
<head>
    <title>${this.escapeXml(item.title)}</title>
    <script src="../api.js"></script>
</head>
<body>
    <div class="scorm-item">
        <h1>${this.escapeXml(item.title)}</h1>
        ${this.renderContentBasedOnType(item)}
    </div>
    
    <script>
        var scorm = new ScormAPI();
        
        function initializeScorm() {
            if (scorm.LMSInitialize("")) {
                console.log("SCORM initialized for ${this.escapeXml(item.title)}");
                
                // Set location
                scorm.LMSSetValue("cmi.core.lesson_location", "${item.id}");
                
                // Interact with content...
            }
        }
        
        // Initialize when page loads
        window.onload = initializeScorm;
    </script>
</body>
</html>`;
    }
    
    /**
     * Render content based on type
     */
    renderContentBasedOnType(item) {
        switch (item.type) {
            case 'question':
                return `<div class="question">${this.escapeXml(item.question || '')}
                    <ul>
                        ${(item.options || []).map(opt => `<li>${this.escapeXml(opt)}</li>`).join('')}
                    </ul>
                    ${item.correctAnswer ? `<p>Correct Answer: ${this.escapeXml(item.correctAnswer)}</p>` : ''}
                </div>`;
                
            case 'flashcard':
                return `<div class="flashcard">
                    <div class="front"><strong>Term:</strong> ${this.escapeXml(item.front || item.term || '')}</div>
                    <div class="back"><strong>Definition:</strong> ${this.escapeXml(item.back || item.definition || '')}</div>
                </div>`;
                
            default:
                return `<div class="content">${this.escapeXml(item.content || JSON.stringify(item))}</div>`;
        }
    }
    
    /**
     * Escape XML special characters
     */
    escapeXml(unsafe) {
        if (typeof unsafe !== 'string') {
            return String(unsafe);
        }
        return unsafe.replace(/[<>&'"]/g, function (c) {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
                default: return c;
            }
        });
    }
    
    /**
     * Set progress callback for an export operation
     */
    setProgressCallback(operation, callback) {
        this.progressCallbacks.set(operation, callback);
    }
    
    /**
     * Remove progress callback
     */
    removeProgressCallback(operation) {
        this.progressCallbacks.delete(operation);
    }
    
    /**
     * Export content to multiple formats simultaneously
     */
    async exportMultiple(contentData, formats, options = {}) {
        try {
            const results = {};
            const errors = {};
            
            for (const format of formats) {
                try {
                    switch (format.toLowerCase()) {
                        case 'pdf':
                            results.pdf = await this.exportToPDF(contentData, options.pdf || {});
                            break;
                        case 'ppt':
                        case 'pptx':
                            results.ppt = await this.exportToPPT(contentData, options.ppt || {});
                            break;
                        case 'scorm':
                            results.scorm = await this.exportToSCORM(contentData, options.scorm || {});
                            break;
                        case 'worksheet':
                            if (!options.templateType) {
                                throw new Error('Template type required for worksheet export');
                            }
                            results.worksheet = await this.exportToWorksheet(
                                contentData, 
                                options.templateType, 
                                options.worksheet || {}
                            );
                            break;
                        default:
                            throw new Error(`Unsupported export format: ${format}`);
                    }
                } catch (error) {
                    errors[format] = error.message;
                    console.error(`Error exporting to ${format}:`, error);
                }
            }
            
            return {
                success: Object.keys(results).length > 0,
                results,
                errors,
                completedFormats: Object.keys(results),
                failedFormats: Object.keys(errors)
            };
        } catch (error) {
            console.error('Error in multiple export:', error);
            throw error;
        }
    }
    
    /**
     * Get supported export formats
     */
    getSupportedFormats() {
        return [...this.exportFormats];
    }
    
    /**
     * Validate export options
     */
    validateOptions(format, options) {
        const formatValidators = {
            pdf: (opts) => {
                if (opts.orientation && !['portrait', 'landscape'].includes(opts.orientation)) {
                    throw new Error('Invalid PDF orientation. Use "portrait" or "landscape"');
                }
                return true;
            },
            ppt: (opts) => {
                return true;
            },
            scorm: (opts) => {
                if (opts.scormVersion && !['1.2', '2004'].includes(opts.scormVersion)) {
                    throw new Error('Invalid SCORM version. Use "1.2" or "2004"');
                }
                return true;
            }
        };
        
        const validator = formatValidators[format.toLowerCase()];
        if (validator) {
            return validator(options);
        }
        
        return true;
    }
    
    /**
     * Download export data as file
     */
    downloadExport(exportResult, filename) {
        if (!exportResult || !exportResult.data) {
            throw new Error('Invalid export result for download');
        }
        
        // Create blob from data
        const blob = new Blob([exportResult.data], { type: exportResult.mimeType });
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || exportResult.filename || 'export.bin';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(url);
        
        console.log(`Download initiated for: ${filename || exportResult.filename}`);
    }
    
    /**
     * Get export template for a specific content type
     */
    getExportTemplate(contentType) {
        const templates = {
            mcq: {
                pdf: {
                    includeAnswers: true,
                    format: 'a4',
                    orientation: 'portrait'
                },
                ppt: {
                    slideLayout: 'question-answer',
                    includeAnswers: false
                },
                scorm: {
                    scormVersion: '1.2',
                    masteryScore: 70
                },
                worksheet: {
                    includeAnswers: false,
                    autoPrint: false
                }
            },
            flashcards: {
                pdf: {
                    format: 'a5',
                    orientation: 'landscape'
                },
                ppt: {
                    slideLayout: 'flashcard',
                    includeAnimations: true
                },
                scorm: {
                    scormVersion: '1.2'
                },
                worksheet: {
                    includeStudyTips: true
                }
            },
            dragdrop: {
                pdf: {
                    format: 'a4',
                    orientation: 'portrait'
                },
                ppt: {
                    slideLayout: 'matching'
                },
                scorm: {
                    scormVersion: '1.2'
                },
                worksheet: {
                    includeCategories: true
                }
            },
            crossword: {
                pdf: {
                    format: 'a4',
                    orientation: 'portrait'
                },
                ppt: {
                    slideLayout: 'puzzle'
                },
                scorm: {
                    scormVersion: '1.2'
                },
                worksheet: {
                    includeGridPlaceholder: true
                }
            },
            timeline: {
                pdf: {
                    format: 'a4',
                    orientation: 'landscape'
                },
                ppt: {
                    slideLayout: 'timeline'
                },
                scorm: {
                    scormVersion: '1.2'
                },
                worksheet: {
                    chronologicalOrdering: true
                }
            },
            labeldiagram: {
                pdf: {
                    format: 'a4',
                    orientation: 'portrait'
                },
                ppt: {
                    slideLayout: 'labeling'
                },
                scorm: {
                    scormVersion: '1.2'
                },
                worksheet: {
                    includeDiagramPlaceholder: true
                }
            },
            contentreveal: {
                pdf: {
                    format: 'a4',
                    includeContent: true
                },
                ppt: {
                    slideLayout: 'content-slide'
                },
                scorm: {
                    scormVersion: '1.2'
                },
                worksheet: {
                    includeReviewQuestions: true
                }
            },
            survey: {
                pdf: {
                    format: 'a4',
                    orientation: 'portrait'
                },
                ppt: {
                    slideLayout: 'survey'
                },
                scorm: {
                    scormVersion: '1.2'
                },
                worksheet: {
                    includeRatingScales: true
                }
            },
            pickmany: {
                pdf: {
                    format: 'a4',
                    orientation: 'portrait'
                },
                ppt: {
                    slideLayout: 'multiple-choice'
                },
                scorm: {
                    scormVersion: '1.2'
                },
                worksheet: {
                    multipleSelection: true
                }
            },
            gamearena: {
                pdf: {
                    format: 'a4',
                    orientation: 'portrait'
                },
                ppt: {
                    slideLayout: 'game-challenge'
                },
                scorm: {
                    scormVersion: '1.2'
                },
                worksheet: {
                    includeScoringGuide: true
                }
            }
        };
        
        return templates[contentType] || templates.mcq; // Default to MCQ template
    }
    
    /**
     * Estimate export size
     */
    estimateExportSize(contentData, format) {
        // Rough estimation based on content size
        const baseSize = 1024; // Base file overhead
        const contentSize = JSON.stringify(contentData).length;
        
        let multiplier;
        switch (format.toLowerCase()) {
            case 'pdf':
                multiplier = 3; // PDFs tend to be larger
                break;
            case 'ppt':
                multiplier = 5; // PPTX with formatting
                break;
            case 'scorm':
                multiplier = 8; // SCORM packages with multiple files
                break;
            default:
                multiplier = 2;
        }
        
        return baseSize + (contentSize * multiplier);
    }
    
    /**
     * Add export job to queue
     */
    addToQueue(job) {
        this.exportQueue.push({
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            ...job,
            queuedAt: new Date(),
            status: 'queued'
        });
        
        // Process queue if not already processing
        if (!this.isProcessing) {
            this.processQueue();
        }
    }
    
    /**
     * Process export queue
     */
    async processQueue() {
        if (this.exportQueue.length === 0 || this.isProcessing) {
            return;
        }
        
        this.isProcessing = true;
        
        while (this.exportQueue.length > 0) {
            const job = this.exportQueue.shift();
            
            try {
                job.status = 'processing';
                
                let result;
                switch (job.format.toLowerCase()) {
                    case 'pdf':
                        result = await this.exportToPDF(job.contentData, job.options);
                        break;
                    case 'ppt':
                        result = await this.exportToPPT(job.contentData, job.options);
                        break;
                    case 'scorm':
                        result = await this.exportToSCORM(job.contentData, job.options);
                        break;
                    case 'worksheet':
                        if (!job.templateType) {
                            throw new Error('Template type required for worksheet export');
                        }
                        result = await this.exportToWorksheet(job.contentData, job.templateType, job.options);
                        break;
                    default:
                        throw new Error(`Unsupported format: ${job.format}`);
                }
                
                job.status = 'completed';
                job.result = result;
                
                // Call completion callback if provided
                if (job.onComplete) {
                    job.onComplete(result);
                }
            } catch (error) {
                job.status = 'failed';
                job.error = error.message;
                
                // Call error callback if provided
                if (job.onError) {
                    job.onError(error);
                }
            }
        }
        
        this.isProcessing = false;
    }
    
    /**
     * Get queue status
     */
    getQueueStatus() {
        return {
            pendingJobs: this.exportQueue.length,
            isProcessing: this.isProcessing,
            jobs: [...this.exportQueue]
        };
    }
    
    /**
     * Cancel a queued job
     */
    cancelJob(jobId) {
        const index = this.exportQueue.findIndex(job => job.id === jobId);
        if (index !== -1) {
            const job = this.exportQueue[index];
            job.status = 'cancelled';
            this.exportQueue.splice(index, 1);
            return true;
        }
        return false;
    }
    
    /**
     * Delay helper function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Cleanup the export system
     */
    cleanup() {
        // Clear queues
        this.exportQueue = [];
        this.isProcessing = false;
        
        // Clear callbacks
        this.progressCallbacks.clear();
        
        // Terminate workers if any
        this.exportWorkers.forEach(worker => {
            worker.terminate();
        });
        this.exportWorkers = [];
    }
}

// Export the service
export default ExportSystemService;