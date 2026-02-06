/**
 * SCORM Package Processor
 * 
 * This service handles the detection, analysis, and processing of SCORM packages.
 * It integrates with the manifest parser to auto-detect package types and map
 * them to appropriate templates.
 */

import SCORMManifestParser from './scorm-manifest-parser.js';

class SCORMPackageProcessor {
    constructor() {
        this.parser = new SCORMManifestParser();
        this.packages = new Map();
        this.processedPackages = new Map();
    }
    
    /**
     * Scan for SCORM packages in a directory structure
     */
    async scanForPackages(directoryPath = 'Scrom/') {
        try {
            // Define mapping between directory names and template types
            const templateMapping = {
                'quiz': 'mcq',
                'flashcards': 'flipcards',
                'match up': 'dragdrop',
                'drag and drop': 'dragdrop',
                'crossword': 'crossword',
                'survey': 'survey',
                'timeline': 'timeline',
                'content reveal': 'contentreveal',
                'label diagram': 'labeldiagram',
                'pick many': 'pickmany',
                'card swipe': 'gamearena',
                'world search': 'gamearena',
                'storyline': 'gamearena'
            };
            
            // This would normally involve server-side code to scan actual filesystem
            // Since we're in a browser environment, we'll create a simulated structure
            // based on the actual directory structure observed in the Scrom folder
            const scormPackages = {
                'mcq': [
                    { name: 'Quiz Template by Montse', path: 'Scrom/Quiz/Quiz Template by Montse/story.html', description: 'Interactive quiz activity' }
                ],
                'flipcards': [
                    { name: 'Flash Cards', path: 'Scrom/Flashcards/flash cards/story.html', description: 'Interactive flash cards activity' }
                ],
                'dragdrop': [
                    { name: 'Drag and Drop', path: 'Scrom/Drag and Drop/story.html', description: 'Interactive drag and drop activity' }
                ],
                'crossword': [],
                'survey': [
                    { name: 'Survey', path: 'Scrom/Survey/survey/story.html', description: 'Interactive survey activity' }
                ],
                'timeline': [
                    { name: 'Timeline', path: 'Scrom/Timeline/timeline/story.html', description: 'Interactive timeline activity' }
                ],
                'contentreveal': [],
                'labeldiagram': [
                    { name: 'Label Diagram', path: 'Scrom/Label Diagram/label diagram/story.html', description: 'Interactive labeling activity' }
                ],
                'pickmany': [],
                'gamearena': [
                    { name: 'Card Swipe', path: 'Scrom/Card swipe/Card Swipe/story.html', description: 'Interactive card swipe game' },
                    { name: 'World Search', path: 'Scrom/World search/Untitled1/story.html', description: 'Word search game' }
                ]
            };
            
            // Add packages from the Storyline directory based on their names
            const storylinePackages = [
                { name: 'Quiz Storyline', path: 'Scrom/Storyline/Quiz.story', description: 'Interactive quiz from Storyline' },
                { name: 'Card Swipe Tamer', path: 'Scrom/Storyline/SL360_Card-Swipe_Tamer.story', description: 'Interactive card swipe game from Storyline' },
                { name: 'Card Swipe Tamer Backup', path: 'Scrom/Storyline/SL360_Card-Swipe_Tamer - SL2 Backup.story', description: 'Interactive card swipe game backup from Storyline' },
                { name: 'Content Reveal', path: 'Scrom/Storyline/content reveal.story', description: 'Interactive content reveal from Storyline' },
                { name: 'Crossword', path: 'Scrom/Storyline/crossword.story', description: 'Interactive crossword from Storyline' },
                { name: 'Flash Cards', path: 'Scrom/Storyline/flash cards.story', description: 'Interactive flash cards from Storyline' },
                { name: 'Label Diagram', path: 'Scrom/Storyline/label diagram.story', description: 'Interactive label diagram from Storyline' },
                { name: 'Label Diagram Backup', path: 'Scrom/Storyline/label diagram - SL2 Backup.story', description: 'Interactive label diagram backup from Storyline' },
                { name: 'Match Up', path: 'Scrom/Storyline/match up.story', description: 'Interactive match up from Storyline' },
                { name: 'Pick Many', path: 'Scrom/Storyline/pick many.story', description: 'Interactive pick many from Storyline' },
                { name: 'Survey', path: 'Scrom/Storyline/survey.story', description: 'Interactive survey from Storyline' },
                { name: 'Timeline', path: 'Scrom/Storyline/timeline.story', description: 'Interactive timeline from Storyline' },
                { name: 'Word Search Template', path: 'Scrom/Storyline/word search.storytemplate', description: 'Word search template from Storyline' }
            ];
            
            // Categorize Storyline packages based on their names
            storylinePackages.forEach(pkg => {
                let templateType = 'gamearena'; // default
                
                const pkgName = pkg.name.toLowerCase();
                if (pkgName.includes('quiz')) templateType = 'mcq';
                else if (pkgName.includes('flash') || pkgName.includes('card')) templateType = 'flipcards';
                else if (pkgName.includes('match') || pkgName.includes('drag')) templateType = 'dragdrop';
                else if (pkgName.includes('crossword')) templateType = 'crossword';
                else if (pkgName.includes('survey')) templateType = 'survey';
                else if (pkgName.includes('timeline')) templateType = 'timeline';
                else if (pkgName.includes('reveal') || pkgName.includes('content')) templateType = 'contentreveal';
                else if (pkgName.includes('label') || pkgName.includes('diagram')) templateType = 'labeldiagram';
                else if (pkgName.includes('pick') || pkgName.includes('many')) templateType = 'pickmany';
                else if (pkgName.includes('card') || pkgName.includes('swipe') || pkgName.includes('search')) templateType = 'gamearena';
                
                if (scormPackages[templateType]) {
                    scormPackages[templateType].push(pkg);
                }
            });
            
            return scormPackages;
        } catch (error) {
            console.error('Error scanning SCORM packages:', error);
            return {};
        }
    }
    
    /**
     * Auto-detect package type and map to templates
     */
    async autoDetectAndMap(packagePath) {
        try {
            // First, try to read the imsmanifest.xml file from the package
            const manifestPath = packagePath.replace(/\/[^\/]*$/, '/imsmanifest.xml');
            
            // This would normally be an actual file read in a real implementation
            // For now, we'll use the directory name to determine the type
            const directoryName = packagePath.split('/')[1]; // Get the main directory name
            
            // Map directory names to template types
            const directoryToTemplate = {
                'Quiz': 'mcq',
                'Flashcards': 'flipcards',
                'Drag and Drop': 'dragdrop',
                'Crossword': 'crossword',
                'Survey': 'survey',
                'Timeline': 'timeline',
                'Content reveal': 'contentreveal',
                'Label Diagram': 'labeldiagram',
                'Pick Many': 'pickmany',
                'Card swipe': 'gamearena',
                'World search': 'gamearena',
                'Storyline': 'gamearena'
            };
            
            const templateType = directoryToTemplate[directoryName] || 'gamearena';
            
            // Create a processed package object
            const processedPackage = {
                id: this.generateId(),
                name: this.extractPackageName(packagePath),
                path: packagePath,
                templateType: templateType,
                manifestData: null, // Would be populated if manifest was read
                configuration: this.getDefaultConfiguration(templateType),
                status: 'processed',
                processedAt: new Date()
            };
            
            // Store the processed package
            this.processedPackages.set(processedPackage.id, processedPackage);
            
            return processedPackage;
        } catch (error) {
            console.error('Error auto-detecting and mapping package:', error);
            throw error;
        }
    }
    
    /**
     * Process a SCORM package
     */
    async processPackage(packageInfo) {
        try {
            // Check if we have a manifest file to parse
            const manifestPath = packageInfo.path.replace(/\/[^\/]*$/, '/imsmanifest.xml');
            
            let manifestData = null;
            try {
                // In a real implementation, we would fetch and parse the actual manifest
                // For now, we'll simulate based on the path
                manifestData = await this.simulateManifestParsing(manifestPath, packageInfo);
            } catch (manifestError) {
                console.warn('Could not parse manifest, using directory-based detection:', manifestError);
                // Fall back to directory-based detection
                manifestData = this.createFallbackManifest(packageInfo);
            }
            
            // Detect template type from manifest
            const detectedType = this.parser.detectTemplateType(manifestData);
            
            // Create processed package
            const processedPackage = {
                id: this.generateId(),
                name: packageInfo.name || this.extractPackageName(packageInfo.path),
                path: packageInfo.path,
                templateType: detectedType,
                manifestData: manifestData,
                configuration: this.extractConfiguration(manifestData),
                status: 'processed',
                processedAt: new Date(),
                originalInfo: packageInfo
            };
            
            // Store the processed package
            this.processedPackages.set(processedPackage.id, processedPackage);
            
            return processedPackage;
        } catch (error) {
            console.error('Error processing SCORM package:', error);
            throw error;
        }
    }
    
    /**
     * Simulate manifest parsing (would be replaced with actual file reading)
     */
    async simulateManifestParsing(manifestPath, packageInfo) {
        // In a real implementation, this would fetch and parse the actual manifest file
        // For now, we'll create a simulated manifest based on the package info
        
        const directoryName = packageInfo.path.split('/')[1];
        
        // Create a simulated manifest based on directory name
        const simulatedManifest = {
            manifestId: this.generateId(),
            version: '1.2',
            metadata: {
                title: directoryName,
                description: `SCORM package from ${directoryName} directory`
            },
            organizations: [],
            resources: [],
            isValid: true
        };
        
        return simulatedManifest;
    }
    
    /**
     * Create fallback manifest when parsing fails
     */
    createFallbackManifest(packageInfo) {
        const directoryName = packageInfo.path.split('/')[1];
        
        return {
            manifestId: this.generateId(),
            version: '1.2',
            metadata: {
                title: directoryName,
                description: `Fallback manifest for ${packageInfo.path}`
            },
            organizations: [],
            resources: [],
            isValid: true
        };
    }
    
    /**
     * Extract configuration from manifest
     */
    extractConfiguration(manifestData) {
        if (!manifestData || !manifestData.isValid) {
            return this.getDefaultConfiguration('scormviewer');
        }
        
        return this.parser.extractSCORMConfiguration(manifestData);
    }
    
    /**
     * Get default configuration for a template type
     */
    getDefaultConfiguration(templateType) {
        const defaults = {
            mcq: {
                version: '1.2',
                completionThreshold: 100,
                masteryScore: 70,
                allowRetakes: true,
                showFeedback: true
            },
            flipcards: {
                version: '1.2',
                completionThreshold: 100,
                masteryScore: null,
                allowRetakes: true,
                showFeedback: true
            },
            dragdrop: {
                version: '1.2',
                completionThreshold: 100,
                masteryScore: 70,
                allowRetakes: true,
                showFeedback: true
            },
            crossword: {
                version: '1.2',
                completionThreshold: 100,
                masteryScore: null,
                allowRetakes: true,
                showFeedback: true
            },
            survey: {
                version: '1.2',
                completionThreshold: 100,
                masteryScore: null,
                allowRetakes: true,
                showFeedback: false
            },
            timeline: {
                version: '1.2',
                completionThreshold: 100,
                masteryScore: null,
                allowRetakes: true,
                showFeedback: true
            },
            contentreveal: {
                version: '1.2',
                completionThreshold: 100,
                masteryScore: null,
                allowRetakes: true,
                showFeedback: true
            },
            labeldiagram: {
                version: '1.2',
                completionThreshold: 100,
                masteryScore: 70,
                allowRetakes: true,
                showFeedback: true
            },
            pickmany: {
                version: '1.2',
                completionThreshold: 100,
                masteryScore: 70,
                allowRetakes: true,
                showFeedback: true
            },
            gamearena: {
                version: '1.2',
                completionThreshold: 100,
                masteryScore: null,
                allowRetakes: true,
                showFeedback: true
            },
            scormviewer: {
                version: '1.2',
                completionThreshold: 100,
                masteryScore: null,
                allowRetakes: true,
                showFeedback: true
            }
        };
        
        return defaults[templateType] || defaults.scormviewer;
    }
    
    /**
     * Extract package name from path
     */
    extractPackageName(path) {
        const parts = path.split('/');
        const fileName = parts[parts.length - 1];
        return fileName.replace(/\.[^/.]+$/, ""); // Remove extension
    }
    
    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    /**
     * Get all processed packages
     */
    getAllProcessedPackages() {
        return Array.from(this.processedPackages.values());
    }
    
    /**
     * Get processed packages by template type
     */
    getPackagesByTemplateType(templateType) {
        return Array.from(this.processedPackages.values()).filter(
            pkg => pkg.templateType === templateType
        );
    }
    
    /**
     * Get a specific processed package
     */
    getPackageById(id) {
        return this.processedPackages.get(id);
    }
    
    /**
     * Clear processed packages cache
     */
    clearCache() {
        this.processedPackages.clear();
    }
    
    /**
     * Process all packages in a directory
     */
    async processAllPackages(directoryPath = 'Scrom/') {
        try {
            const allPackages = await this.scanForPackages(directoryPath);
            const results = [];
            
            // Process each package type
            for (const [templateType, packages] of Object.entries(allPackages)) {
                for (const pkg of packages) {
                    try {
                        const processed = await this.processPackage(pkg);
                        results.push(processed);
                    } catch (error) {
                        console.error(`Failed to process package ${pkg.path}:`, error);
                        // Continue with other packages
                    }
                }
            }
            
            return results;
        } catch (error) {
            console.error('Error processing all packages:', error);
            throw error;
        }
    }
    
    /**
     * Update package configuration
     */
    updatePackageConfiguration(packageId, newConfig) {
        const pkg = this.processedPackages.get(packageId);
        if (!pkg) {
            throw new Error(`Package with ID ${packageId} not found`);
        }
        
        pkg.configuration = { ...pkg.configuration, ...newConfig };
        pkg.processedAt = new Date();
        
        // Update the stored package
        this.processedPackages.set(packageId, pkg);
        
        return pkg;
    }
}

// Export the processor
export default SCORMPackageProcessor;