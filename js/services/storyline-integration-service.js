/**
 * Storyline Integration Service
 * 
 * This service handles the complete workflow of importing, parsing, and converting
 * Storyline files to native templates, then registering them appropriately.
 */

import StorylineParser from './storyline-parser.js';

class StorylineIntegrationService {
    constructor(templateRegistry, firebaseService) {
        this.parser = new StorylineParser();
        this.templateRegistry = templateRegistry;
        this.firebaseService = firebaseService;
        this.processedFiles = new Map();
        this.conversionHistory = [];
    }
    
    /**
     * Process a Storyline file completely
     */
    async processStorylineFile(file) {
        try {
            // Validate file
            if (!this.parser.isStorylineFile(file)) {
                throw new Error('Invalid Storyline file format');
            }
            
            // Parse the file
            const parseResult = await this.parser.parseStorylineFile(file);
            
            // Convert to appropriate template
            const convertedData = parseResult.data;
            
            // Store processing result
            const fileId = this.generateId();
            const processedFile = {
                id: fileId,
                originalFileName: file.name,
                originalFileSize: file.size,
                templateType: parseResult.templateType,
                convertedData: convertedData,
                parseResult: parseResult,
                processedAt: new Date(),
                status: 'converted'
            };
            
            this.processedFiles.set(fileId, processedFile);
            this.conversionHistory.push(processedFile);
            
            // Register with template registry if not already registered
            if (!this.templateRegistry.isRegistered(parseResult.templateType)) {
                this.registerTemplateForType(parseResult.templateType);
            }
            
            return processedFile;
        } catch (error) {
            console.error('Error processing Storyline file:', error);
            throw error;
        }
    }
    
    /**
     * Register a template class for a specific type
     */
    registerTemplateForType(templateType) {
        // Import and register the appropriate template class
        // This is a simplified version - in a real implementation, you'd have specific template classes
        
        switch (templateType) {
            case 'mcq':
                // Assuming MCQTemplate is already imported
                if (typeof MCQTemplate !== 'undefined') {
                    this.templateRegistry.register('mcq', MCQTemplate, {
                        autoInitialize: false,
                        lazyLoad: true
                    });
                }
                break;
            case 'truefalse':
                // Register True/False template
                break;
            case 'flipcards':
                // Register Flip Cards template
                break;
            case 'dragdrop':
                // Register Drag & Drop template
                break;
            case 'labeldiagram':
                // Register Label Diagram template
                break;
            case 'timeline':
                // Register Timeline template
                break;
            case 'contentreveal':
                // Register Content Reveal template
                break;
            case 'survey':
                // Register Survey template
                break;
            case 'pickmany':
                // Register Pick Many template
                break;
            case 'gamearena':
                // Register Game Arena template
                break;
            case 'scormviewer':
                // Register SCORM Viewer template
                break;
            default:
                // Register generic template
                break;
        }
    }
    
    /**
     * Create a template instance from converted data
     */
    async createTemplateInstance(templateType, containerId, convertedData) {
        try {
            // Create template instance
            const instance = this.templateRegistry.createInstance(templateType, containerId, convertedData);
            
            // Initialize with the converted data
            await instance.initialize(convertedData);
            
            return instance;
        } catch (error) {
            console.error('Error creating template instance:', error);
            throw error;
        }
    }
    
    /**
     * Auto-detect and process Storyline files from a directory
     */
    async processStorylineFilesFromDirectory(directoryPath = 'Scrom/Storyline/') {
        try {
            // This would normally involve server-side code to scan actual filesystem
            // Since we're in a browser environment, we'll simulate the process
            
            // For demonstration purposes, we'll create some example Storyline files
            // In a real implementation, this would scan the actual directory
            const exampleFiles = [
                { name: 'Quiz.story', size: 1024000 },
                { name: 'Flash Cards.story', size: 1536000 },
                { name: 'Drag and Drop.story', size: 2048000 },
                { name: 'Survey.story', size: 768000 }
            ];
            
            const results = [];
            
            for (const fileInfo of exampleFiles) {
                // Create a mock file object
                const mockFile = new File([], fileInfo.name, { type: 'application/zip', size: fileInfo.size });
                
                try {
                    const result = await this.processStorylineFile(mockFile);
                    results.push(result);
                } catch (error) {
                    console.error(`Failed to process ${fileInfo.name}:`, error);
                    // Continue with other files
                }
            }
            
            return results;
        } catch (error) {
            console.error('Error processing directory:', error);
            throw error;
        }
    }
    
    /**
     * Integrate converted data into the appropriate template
     */
    async integrateConvertedData(processedFile) {
        try {
            const { templateType, convertedData } = processedFile;
            
            // Determine the container ID based on the current UI context
            // This would depend on the specific implementation
            const containerId = `template-container-${templateType}`;
            
            // Create or get the template instance
            const instance = await this.createTemplateInstance(templateType, containerId, convertedData);
            
            // If user is authenticated, save to Firebase
            if (this.firebaseService && this.firebaseService.isAuthenticated()) {
                try {
                    await this.firebaseService.saveActivity(convertedData);
                } catch (saveError) {
                    console.error('Failed to save to Firebase:', saveError);
                    // Continue anyway, as this is not critical for the conversion
                }
            }
            
            return {
                success: true,
                templateInstance: instance,
                integratedData: convertedData,
                message: `Successfully integrated ${processedFile.originalFileName} as ${templateType} template`
            };
        } catch (error) {
            console.error('Error integrating converted data:', error);
            throw error;
        }
    }
    
    /**
     * Batch process multiple Storyline files
     */
    async batchProcessFiles(files) {
        const results = {
            successful: [],
            failed: [],
            total: files.length
        };
        
        for (const file of files) {
            try {
                const result = await this.processStorylineFile(file);
                results.successful.push(result);
                
                // Optionally integrate immediately
                try {
                    await this.integrateConvertedData(result);
                } catch (integrationError) {
                    console.error('Failed to integrate converted data:', integrationError);
                }
            } catch (error) {
                results.failed.push({
                    fileName: file.name,
                    error: error.message
                });
            }
        }
        
        return results;
    }
    
    /**
     * Get processed file by ID
     */
    getProcessedFile(fileId) {
        return this.processedFiles.get(fileId);
    }
    
    /**
     * Get all processed files
     */
    getAllProcessedFiles() {
        return Array.from(this.processedFiles.values());
    }
    
    /**
     * Get conversion history
     */
    getConversionHistory(limit = 50) {
        return this.conversionHistory.slice(-limit);
    }
    
    /**
     * Clear processed files cache
     */
    clearCache() {
        this.processedFiles.clear();
        this.conversionHistory = [];
    }
    
    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    /**
     * Validate converted data against template schema
     */
    validateConvertedData(convertedData, templateType) {
        // This would validate the converted data against the expected schema
        // for the specific template type
        try {
            // In a real implementation, you would have schema validation
            // for each template type
            const requiredFields = {
                mcq: ['questions'],
                truefalse: ['items'],
                flipcards: ['cards'],
                dragdrop: ['pairs'],
                labeldiagram: ['imageUrl', 'labels'],
                timeline: ['events'],
                contentreveal: ['panels'],
                survey: ['questions'],
                pickmany: ['question', 'items'],
                gamearena: ['packagePath'],
                scormviewer: ['scormUrl']
            };
            
            const required = requiredFields[templateType] || [];
            const missing = [];
            
            for (const field of required) {
                if (!convertedData[field]) {
                    missing.push(field);
                }
            }
            
            if (missing.length > 0) {
                return {
                    valid: false,
                    errors: [`Missing required fields: ${missing.join(', ')}`]
                };
            }
            
            return { valid: true, errors: [] };
        } catch (error) {
            return {
                valid: false,
                errors: [error.message]
            };
        }
    }
    
    /**
     * Optimize converted data for the specific template
     */
    optimizeConvertedData(convertedData, templateType) {
        // Perform template-specific optimizations
        // This might include cleaning up data, ensuring proper formatting, etc.
        const optimized = { ...convertedData };
        
        switch (templateType) {
            case 'mcq':
                if (optimized.questions) {
                    optimized.questions = optimized.questions.map(q => ({
                        ...q,
                        options: q.options || [],
                        correctIndex: q.correctIndex !== undefined ? q.correctIndex : 0
                    }));
                }
                break;
                
            case 'truefalse':
                if (optimized.items) {
                    optimized.items = optimized.items.map(item => ({
                        ...item,
                        isTrue: Boolean(item.isTrue)
                    }));
                }
                break;
                
            case 'flipcards':
                if (optimized.cards) {
                    optimized.cards = optimized.cards.map(card => ({
                        ...card,
                        front: card.front || 'Front',
                        back: card.back || 'Back'
                    }));
                }
                break;
                
            case 'dragdrop':
                if (optimized.pairs) {
                    optimized.pairs = optimized.pairs.map(pair => ({
                        ...pair,
                        left: pair.left || 'Item',
                        right: pair.right || 'Match'
                    }));
                }
                break;
                
            default:
                // No specific optimization needed
                break;
        }
        
        return optimized;
    }
    
    /**
     * Export processed file as a different format
     */
    exportProcessedFile(fileId, format = 'json') {
        const processedFile = this.getProcessedFile(fileId);
        if (!processedFile) {
            throw new Error(`Processed file with ID ${fileId} not found`);
        }
        
        switch (format) {
            case 'json':
                return JSON.stringify(processedFile.convertedData, null, 2);
            case 'xml':
                // Convert back to XML format if needed
                return this.convertToXML(processedFile.convertedData);
            case 'csv':
                // Convert to CSV format if applicable
                return this.convertToCSV(processedFile.convertedData, processedFile.templateType);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }
    
    /**
     * Convert data to XML format
     */
    convertToXML(data) {
        // Simplified XML conversion - in reality this would be more complex
        return `<?xml version="1.0" encoding="UTF-8"?>
<data>
    <convertedFromStoryline>true</convertedFromStoryline>
    <templateType>${data.metadata?.template || 'unknown'}</templateType>
    <title>${data.metadata?.title || 'Converted Content'}</title>
</data>`;
    }
    
    /**
     * Convert data to CSV format
     */
    convertToCSV(data, templateType) {
        let csv = '';
        
        switch (templateType) {
            case 'mcq':
                csv = 'Question,Option A,Option B,Option C,Option D,Correct Answer\n';
                if (data.questions) {
                    data.questions.forEach(q => {
                        const row = [
                            `"${q.question.replace(/"/g, '""')}"`,
                            `"${(q.options && q.options[0]) ? q.options[0].replace(/"/g, '""') : ''}"`,
                            `"${(q.options && q.options[1]) ? q.options[1].replace(/"/g, '""') : ''}"`,
                            `"${(q.options && q.options[2]) ? q.options[2].replace(/"/g, '""') : ''}"`,
                            `"${(q.options && q.options[3]) ? q.options[3].replace(/"/g, '""') : ''}"`,
                            q.correctIndex !== undefined ? q.correctIndex + 1 : ''
                        ];
                        csv += row.join(',') + '\n';
                    });
                }
                break;
                
            case 'truefalse':
                csv = 'Statement,True,False,Correct Answer\n';
                if (data.items) {
                    data.items.forEach(item => {
                        csv += `"${item.question.replace(/"/g, '""')}","True","False","${item.isTrue ? 'True' : 'False'}"\n`;
                    });
                }
                break;
                
            default:
                csv = 'Data exported in native format\n';
                break;
        }
        
        return csv;
    }
}

// Export the service
export default StorylineIntegrationService;