/**
 * Articulate Storyline Parser
 * 
 * This service parses Articulate Storyline (.story) files and converts them to native templates.
 * Storyline files are ZIP archives containing XML-based content that needs to be extracted and mapped.
 */

class StorylineParser {
    constructor() {
        this.parser = new DOMParser();
        this.jszip = null;
    }
    
    /**
     * Initialize JSZip library
     */
    async initializeJSZip() {
        if (typeof JSZip !== 'undefined') {
            this.jszip = JSZip;
        } else {
            // Dynamically load JSZip if not available
            try {
                const jszipModule = await import('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
                this.jszip = jszipModule.default || jszipModule.JSZip || window.JSZip;
            } catch (error) {
                console.error('Failed to load JSZip:', error);
                throw new Error('JSZip library is required for Storyline parsing');
            }
        }
    }
    
    /**
     * Parse a Storyline file
     */
    async parseStorylineFile(file) {
        if (!this.jszip) {
            await this.initializeJSZip();
        }
        
        try {
            // Read the file as ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();
            
            // Load the ZIP file
            const zip = await this.jszip.loadAsync(arrayBuffer);
            
            // Extract content and analyze structure
            const content = await this.extractStorylineContent(zip);
            
            // Determine template type based on content
            const templateType = this.detectTemplateType(content);
            
            // Convert to native template format
            const convertedData = await this.convertToTemplate(content, templateType);
            
            return {
                templateType: templateType,
                data: convertedData,
                originalFile: file.name,
                fileSize: file.size,
                analysis: content.analysis
            };
        } catch (error) {
            console.error('Error parsing Storyline file:', error);
            throw error;
        }
    }
    
    /**
     * Extract content from Storyline ZIP archive
     */
    async extractStorylineContent(zip) {
        const content = {
            files: [],
            storyXml: null,
            slides: [],
            interactions: [],
            questions: [],
            multimedia: [],
            analysis: {
                hasQuiz: false,
                hasInteractions: false,
                slideCount: 0,
                questionCount: 0,
                mediaCount: 0
            }
        };
        
        // Get all file names
        const fileNames = Object.keys(zip.files);
        content.files = fileNames;
        
        // Look for the main story file
        let storyFile = null;
        const possibleStoryFiles = [
            'story.xml',
            'story_content/model.xml',
            'story/story.xml',
            'course.xml',
            'presentation.xml'
        ];
        
        for (const fileName of possibleStoryFiles) {
            if (zip.file(fileName)) {
                storyFile = fileName;
                break;
            }
        }
        
        if (storyFile) {
            content.storyXml = await zip.file(storyFile).async('string');
        }
        
        // Parse the main story content if available
        if (content.storyXml) {
            const xmlDoc = this.parser.parseFromString(content.storyXml, 'text/xml');
            content.slides = this.extractSlides(xmlDoc);
            content.interactions = this.extractInteractions(xmlDoc);
            content.questions = this.extractQuestions(xmlDoc);
            content.multimedia = this.extractMultimedia(xmlDoc);
        }
        
        // Analyze the content
        this.analyzeContent(content);
        
        return content;
    }
    
    /**
     * Extract slides from Storyline XML
     */
    extractSlides(xmlDoc) {
        const slides = [];
        const slideNodes = xmlDoc.getElementsByTagName('slide');
        
        for (let i = 0; i < slideNodes.length; i++) {
            const slideNode = slideNodes[i];
            const slide = {
                id: slideNode.getAttribute('id') || `slide_${i}`,
                title: slideNode.getAttribute('name') || slideNode.getAttribute('title') || `Slide ${i + 1}`,
                type: slideNode.getAttribute('type') || 'standard',
                duration: slideNode.getAttribute('duration'),
                content: this.extractSlideContent(slideNode)
            };
            
            slides.push(slide);
        }
        
        return slides;
    }
    
    /**
     * Extract slide content
     */
    extractSlideContent(slideNode) {
        const content = {
            text: [],
            images: [],
            videos: [],
            audio: [],
            shapes: [],
            other: []
        };
        
        // Extract text elements
        const textNodes = slideNode.getElementsByTagName('text');
        for (let i = 0; i < textNodes.length; i++) {
            const textNode = textNodes[i];
            content.text.push({
                id: textNode.getAttribute('id'),
                value: textNode.textContent || textNode.getAttribute('value') || '',
                format: textNode.getAttribute('format'),
                position: {
                    x: textNode.getAttribute('x'),
                    y: textNode.getAttribute('y'),
                    width: textNode.getAttribute('width'),
                    height: textNode.getAttribute('height')
                }
            });
        }
        
        // Extract image elements
        const imageNodes = slideNode.getElementsByTagName('image');
        for (let i = 0; i < imageNodes.length; i++) {
            const imageNode = imageNodes[i];
            content.images.push({
                id: imageNode.getAttribute('id'),
                src: imageNode.getAttribute('src') || imageNode.getAttribute('source'),
                alt: imageNode.getAttribute('alt'),
                position: {
                    x: imageNode.getAttribute('x'),
                    y: imageNode.getAttribute('y'),
                    width: imageNode.getAttribute('width'),
                    height: imageNode.getAttribute('height')
                }
            });
        }
        
        // Extract video elements
        const videoNodes = slideNode.getElementsByTagName('video');
        for (let i = 0; i < videoNodes.length; i++) {
            const videoNode = videoNodes[i];
            content.videos.push({
                id: videoNode.getAttribute('id'),
                src: videoNode.getAttribute('src') || videoNode.getAttribute('source'),
                position: {
                    x: videoNode.getAttribute('x'),
                    y: videoNode.getAttribute('y'),
                    width: videoNode.getAttribute('width'),
                    height: videoNode.getAttribute('height')
                }
            });
        }
        
        // Extract audio elements
        const audioNodes = slideNode.getElementsByTagName('audio');
        for (let i = 0; i < audioNodes.length; i++) {
            const audioNode = audioNodes[i];
            content.audio.push({
                id: audioNode.getAttribute('id'),
                src: audioNode.getAttribute('src') || audioNode.getAttribute('source')
            });
        }
        
        return content;
    }
    
    /**
     * Extract interactions from Storyline XML
     */
    extractInteractions(xmlDoc) {
        const interactions = [];
        const interactionTypes = ['trigger', 'action', 'question', 'quiz', 'assessment'];
        
        for (const type of interactionTypes) {
            const nodes = xmlDoc.getElementsByTagName(type);
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                const interaction = {
                    id: node.getAttribute('id'),
                    type: type,
                    trigger: node.getAttribute('trigger'),
                    action: node.getAttribute('action'),
                    target: node.getAttribute('target'),
                    condition: node.getAttribute('condition'),
                    parameters: this.extractAttributes(node)
                };
                
                interactions.push(interaction);
            }
        }
        
        return interactions;
    }
    
    /**
     * Extract questions from Storyline XML
     */
    extractQuestions(xmlDoc) {
        const questions = [];
        const questionTypes = ['question', 'assessment', 'quiz'];
        
        for (const type of questionTypes) {
            const nodes = xmlDoc.getElementsByTagName(type);
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                const question = {
                    id: node.getAttribute('id'),
                    type: node.getAttribute('questiontype') || node.getAttribute('type') || 'multiplechoice',
                    prompt: node.getAttribute('prompt') || node.textContent || '',
                    options: this.extractQuestionOptions(node),
                    correctAnswer: node.getAttribute('correctanswer') || node.getAttribute('correct'),
                    points: parseInt(node.getAttribute('points')) || 1,
                    feedback: this.extractFeedback(node)
                };
                
                questions.push(question);
            }
        }
        
        return questions;
    }
    
    /**
     * Extract question options
     */
    extractQuestionOptions(questionNode) {
        const options = [];
        const optionNodes = questionNode.getElementsByTagName('option');
        
        for (let i = 0; i < optionNodes.length; i++) {
            const optionNode = optionNodes[i];
            options.push({
                id: optionNode.getAttribute('id'),
                text: optionNode.textContent || optionNode.getAttribute('text') || '',
                isCorrect: optionNode.getAttribute('correct') === 'true' ||
                          optionNode.getAttribute('iscorrect') === 'true',
                feedback: optionNode.getAttribute('feedback') || ''
            });
        }
        
        return options;
    }
    
    /**
     * Extract feedback from node
     */
    extractFeedback(node) {
        const feedback = {
            correct: '',
            incorrect: '',
            general: ''
        };
        
        const correctFeedbackNodes = node.getElementsByTagName('correctfeedback');
        if (correctFeedbackNodes.length > 0) {
            feedback.correct = correctFeedbackNodes[0].textContent;
        }
        
        const incorrectFeedbackNodes = node.getElementsByTagName('incorrectfeedback');
        if (incorrectFeedbackNodes.length > 0) {
            feedback.incorrect = incorrectFeedbackNodes[0].textContent;
        }
        
        const generalFeedbackNodes = node.getElementsByTagName('feedback');
        if (generalFeedbackNodes.length > 0) {
            feedback.general = generalFeedbackNodes[0].textContent;
        }
        
        return feedback;
    }
    
    /**
     * Extract multimedia elements
     */
    extractMultimedia(xmlDoc) {
        const multimedia = [];
        
        // Extract various media types
        const mediaTypes = ['audio', 'video', 'image', 'media'];
        for (const type of mediaTypes) {
            const nodes = xmlDoc.getElementsByTagName(type);
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                multimedia.push({
                    id: node.getAttribute('id'),
                    type: type,
                    src: node.getAttribute('src') || node.getAttribute('source'),
                    title: node.getAttribute('title') || node.getAttribute('name'),
                    duration: node.getAttribute('duration')
                });
            }
        }
        
        return multimedia;
    }
    
    /**
     * Extract all attributes from a node
     */
    extractAttributes(node) {
        const attributes = {};
        for (let i = 0; i < node.attributes.length; i++) {
            const attr = node.attributes[i];
            attributes[attr.name] = attr.value;
        }
        return attributes;
    }
    
    /**
     * Analyze content to determine characteristics
     */
    analyzeContent(content) {
        content.analysis.hasQuiz = content.questions.length > 0;
        content.analysis.hasInteractions = content.interactions.length > 0;
        content.analysis.slideCount = content.slides.length;
        content.analysis.questionCount = content.questions.length;
        content.analysis.mediaCount = content.multimedia.length;
    }
    
    /**
     * Detect template type based on content analysis
     */
    detectTemplateType(content) {
        const analysis = content.analysis;
        
        // Priority order for detection
        if (analysis.questionCount > 0) {
            // Determine specific question type
            if (content.questions.some(q => 
                q.type.toLowerCase().includes('truefalse') || 
                q.type.toLowerCase().includes('true_false')
            )) {
                return 'truefalse';
            }
            
            if (content.questions.some(q => 
                q.type.toLowerCase().includes('pickmany') || 
                q.type.toLowerCase().includes('pick_many') ||
                q.type.toLowerCase().includes('multipleselect')
            )) {
                return 'pickmany';
            }
            
            // Default to MCQ for other question types
            return 'mcq';
        }
        
        if (content.slides.some(slide => 
            slide.content.text.length >= 2 && 
            slide.content.text.length <= 10 &&
            slide.content.text.every(text => text.value.length < 200)
        )) {
            // Likely flashcards (short text pairs)
            return 'flipcards';
        }
        
        if (content.interactions.some(interaction => 
            interaction.action && 
            interaction.action.toLowerCase().includes('drag')
        )) {
            return 'dragdrop';
        }
        
        if (content.slides.some(slide => 
            slide.content.images.length > 0 && 
            slide.content.text.length > 0
        )) {
            // Content with labels/images - likely label diagram
            return 'labeldiagram';
        }
        
        if (content.slides.some(slide => 
            slide.content.text.length > 5 && 
            slide.type === 'timeline'
        )) {
            return 'timeline';
        }
        
        if (content.slides.some(slide => 
            slide.content.text.length > 3 && 
            slide.type === 'reveal'
        )) {
            return 'contentreveal';
        }
        
        if (content.interactions.some(interaction => 
            interaction.action && 
            interaction.action.toLowerCase().includes('survey') ||
            interaction.action.toLowerCase().includes('poll')
        )) {
            return 'survey';
        }
        
        // Default to game arena for complex interactions
        if (analysis.hasInteractions && analysis.slideCount > 5) {
            return 'gamearena';
        }
        
        // Fallback to general viewer
        return 'scormviewer';
    }
    
    /**
     * Convert Storyline content to native template format
     */
    async convertToTemplate(content, templateType) {
        switch (templateType) {
            case 'mcq':
                return this.convertToMCQ(content);
            case 'truefalse':
                return this.convertToTrueFalse(content);
            case 'flipcards':
                return this.convertToFlashCards(content);
            case 'dragdrop':
                return this.convertToDragDrop(content);
            case 'labeldiagram':
                return this.convertToLabelDiagram(content);
            case 'timeline':
                return this.convertToTimeline(content);
            case 'contentreveal':
                return this.convertToContentReveal(content);
            case 'survey':
                return this.convertToSurvey(content);
            case 'pickmany':
                return this.convertToPickMany(content);
            case 'gamearena':
                return this.convertToGameArena(content);
            case 'scormviewer':
            default:
                return this.convertToSCORMViewer(content);
        }
    }
    
    /**
     * Convert to MCQ template
     */
    convertToMCQ(content) {
        const questions = content.questions.map((question, index) => ({
            id: question.id || `q${index}`,
            question: question.prompt || question.text || `Question ${index + 1}`,
            options: question.options.map(option => option.text),
            correctIndex: question.options.findIndex(option => option.isCorrect),
            explanation: question.feedback.correct || question.feedback.general || '',
            points: question.points || 1
        }));
        
        return {
            metadata: {
                id: `mcq_${Date.now()}`,
                title: content.slides[0]?.title || 'Converted MCQ Quiz',
                template: 'mcq',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            config: {
                timeLimit: 0,
                allowRetakes: true,
                showFeedback: true
            },
            questions: questions
        };
    }
    
    /**
     * Convert to True/False template
     */
    convertToTrueFalse(content) {
        const items = content.questions
            .filter(q => q.type.toLowerCase().includes('truefalse'))
            .map((question, index) => ({
                id: question.id || `tf${index}`,
                question: question.prompt || question.text || `Statement ${index + 1}`,
                isTrue: question.correctAnswer === 'true' || question.correctAnswer === 'True' || 
                       question.options.find(opt => opt.isCorrect)?.text?.toLowerCase() === 'true',
                explanation: question.feedback.correct || question.feedback.general || '',
                points: question.points || 1
            }));
        
        return {
            metadata: {
                id: `tf_${Date.now()}`,
                title: content.slides[0]?.title || 'Converted True/False Quiz',
                template: 'truefalse',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            config: {
                timeLimit: 0,
                allowRetakes: true,
                showFeedback: true
            },
            items: items
        };
    }
    
    /**
     * Convert to Flash Cards template
     */
    convertToFlashCards(content) {
        const cards = [];
        
        // Try to pair text elements as front/back
        for (let i = 0; i < content.slides.length; i += 2) {
            const frontSlide = content.slides[i];
            const backSlide = content.slides[i + 1];
            
            if (frontSlide && frontSlide.content.text.length > 0) {
                const front = frontSlide.content.text[0].value || frontSlide.title;
                const back = backSlide && backSlide.content.text.length > 0 ? 
                           backSlide.content.text[0].value : 
                           'More information on this topic';
                           
                cards.push({
                    id: `card_${i}`,
                    front: front,
                    back: back
                });
            }
        }
        
        return {
            metadata: {
                id: `fc_${Date.now()}`,
                title: content.slides[0]?.title || 'Converted Flash Cards',
                template: 'flipcards',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            config: {
                timeLimit: 0,
                allowRetakes: true,
                showFeedback: true
            },
            cards: cards
        };
    }
    
    /**
     * Convert to Drag & Drop template
     */
    convertToDragDrop(content) {
        const pairs = [];
        
        // Look for drag/drop interactions in the content
        const dragActions = content.interactions.filter(interaction => 
            interaction.action && 
            interaction.action.toLowerCase().includes('drag')
        );
        
        for (const action of dragActions) {
            // Extract drag/drop pairs from interactions or slide content
            // This is a simplified approach - real implementation would be more complex
            pairs.push({
                id: action.id || `pair_${pairs.length}`,
                left: action.parameters.source || action.target || `Item ${pairs.length + 1}`,
                right: action.parameters.target || action.trigger || `Match ${pairs.length + 1}`
            });
        }
        
        // If no drag actions found, try to extract from slides
        if (pairs.length === 0) {
            for (const slide of content.slides) {
                if (slide.content.text.length >= 2) {
                    pairs.push({
                        id: `pair_${pairs.length}`,
                        left: slide.content.text[0].value,
                        right: slide.content.text[1].value
                    });
                }
            }
        }
        
        return {
            metadata: {
                id: `dd_${Date.now()}`,
                title: content.slides[0]?.title || 'Converted Drag & Drop',
                template: 'dragdrop',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            config: {
                timeLimit: 0,
                allowRetakes: true,
                showFeedback: true
            },
            pairs: pairs
        };
    }
    
    /**
     * Convert to Label Diagram template
     */
    convertToLabelDiagram(content) {
        // Look for slides with images and text that could be labels
        const slideWithImage = content.slides.find(slide => 
            slide.content.images.length > 0 && slide.content.text.length > 0
        );
        
        if (slideWithImage) {
            const imageUrl = slideWithImage.content.images[0].src;
            const labels = slideWithImage.content.text.map((text, index) => ({
                id: `label_${index}`,
                x: text.position?.x || 10 + (index * 10), // Default positioning
                y: text.position?.y || 10 + (index * 10),
                text: text.value,
                correct: true // Assume all are correct for conversion
            }));
            
            return {
                metadata: {
                    id: `ld_${Date.now()}`,
                    title: slideWithImage.title || 'Converted Label Diagram',
                    template: 'labeldiagram',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                config: {
                    timeLimit: 0,
                    allowRetakes: true,
                    showFeedback: true
                },
                imageUrl: imageUrl,
                labels: labels
            };
        }
        
        // Fallback
        return {
            metadata: {
                id: `ld_${Date.now()}`,
                title: 'Converted Label Diagram',
                template: 'labeldiagram',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            config: {
                timeLimit: 0,
                allowRetakes: true,
                showFeedback: true
            },
            imageUrl: '',
            labels: []
        };
    }
    
    /**
     * Convert to Timeline template
     */
    convertToTimeline(content) {
        const events = content.slides
            .filter(slide => slide.type === 'timeline' || slide.content.text.length > 0)
            .map((slide, index) => ({
                id: slide.id || `event_${index}`,
                date: slide.title || `Event ${index + 1}`,
                title: slide.title || `Timeline Event ${index + 1}`,
                description: slide.content.text.length > 0 ? 
                           slide.content.text[0].value : 
                           'Event description',
                position: index
            }));
        
        return {
            metadata: {
                id: `tl_${Date.now()}`,
                title: content.slides[0]?.title || 'Converted Timeline',
                template: 'timeline',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            config: {
                timeLimit: 0,
                allowRetakes: true,
                showFeedback: true
            },
            events: events
        };
    }
    
    /**
     * Convert to Content Reveal template
     */
    convertToContentReveal(content) {
        const panels = content.slides
            .filter(slide => slide.type === 'reveal' || slide.content.text.length > 0)
            .map((slide, index) => ({
                id: slide.id || `panel_${index}`,
                title: slide.title || `Panel ${index + 1}`,
                content: slide.content.text.map(t => t.value).join('\n') || 'Panel content',
                revealed: false
            }));
        
        return {
            metadata: {
                id: `cr_${Date.now()}`,
                title: content.slides[0]?.title || 'Converted Content Reveal',
                template: 'contentreveal',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            config: {
                timeLimit: 0,
                allowRetakes: true,
                showFeedback: true
            },
            panels: panels
        };
    }
    
    /**
     * Convert to Survey template
     */
    convertToSurvey(content) {
        const questions = content.questions.map((question, index) => ({
            id: question.id || `sq${index}`,
            question: question.prompt || question.text || `Survey Question ${index + 1}`,
            type: question.type.toLowerCase().includes('rating') ? 'rating' : 
                  question.type.toLowerCase().includes('text') ? 'text' : 'multiple',
            options: question.options.map(opt => opt.text),
            required: true,
            points: question.points || 1
        }));
        
        return {
            metadata: {
                id: `sv_${Date.now()}`,
                title: content.slides[0]?.title || 'Converted Survey',
                template: 'survey',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            config: {
                timeLimit: 0,
                allowRetakes: true,
                showFeedback: false
            },
            questions: questions
        };
    }
    
    /**
     * Convert to Pick Many template
     */
    convertToPickMany(content) {
        const firstQuestion = content.questions.find(q => 
            q.type.toLowerCase().includes('pickmany') || 
            q.type.toLowerCase().includes('pick_many') ||
            q.options.length > 2
        );
        
        if (firstQuestion) {
            const items = firstQuestion.options.map((option, index) => ({
                id: option.id || `item_${index}`,
                text: option.text,
                isCorrect: option.isCorrect
            }));
            
            return {
                metadata: {
                    id: `pm_${Date.now()}`,
                    title: firstQuestion.prompt || 'Converted Pick Many',
                    template: 'pickmany',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                config: {
                    timeLimit: 0,
                    allowRetakes: true,
                    showFeedback: true
                },
                question: firstQuestion.prompt || 'Select all correct answers:',
                items: items
            };
        }
        
        // Fallback to first question with multiple options
        const fallbackQuestion = content.questions[0];
        if (fallbackQuestion && fallbackQuestion.options.length > 2) {
            const items = fallbackQuestion.options.map((option, index) => ({
                id: option.id || `item_${index}`,
                text: option.text,
                isCorrect: option.isCorrect
            }));
            
            return {
                metadata: {
                    id: `pm_${Date.now()}`,
                    title: fallbackQuestion.prompt || 'Converted Pick Many',
                    template: 'pickmany',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                config: {
                    timeLimit: 0,
                    allowRetakes: true,
                    showFeedback: true
                },
                question: fallbackQuestion.prompt || 'Select all correct answers:',
                items: items
            };
        }
        
        // Ultimate fallback
        return {
            metadata: {
                id: `pm_${Date.now()}`,
                title: 'Converted Pick Many',
                template: 'pickmany',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            config: {
                timeLimit: 0,
                allowRetakes: true,
                showFeedback: true
            },
            question: 'Select all correct answers:',
            items: [{ id: 'item_0', text: 'Option A', isCorrect: true }]
        };
    }
    
    /**
     * Convert to Game Arena template
     */
    convertToGameArena(content) {
        return {
            metadata: {
                id: `ga_${Date.now()}`,
                title: content.slides[0]?.title || 'Converted Game Arena',
                template: 'gamearena',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            config: {
                timeLimit: 0,
                allowRetakes: true,
                showFeedback: true
            },
            packagePath: 'converted-storyline-package',
            instructions: 'This content was converted from a Storyline package',
            width: '100%',
            height: '700px'
        };
    }
    
    /**
     * Convert to SCORM Viewer template
     */
    convertToSCORMViewer(content) {
        return {
            metadata: {
                id: `scorm_${Date.now()}`,
                title: content.slides[0]?.title || 'Converted SCORM Package',
                template: 'scormviewer',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            config: {
                timeLimit: 0,
                allowRetakes: true,
                showFeedback: true
            },
            scormUrl: 'converted-storyline-package/index.html',
            width: '100%',
            height: '600px'
        };
    }
    
    /**
     * Parse Storyline XML from string
     */
    parseStorylineXML(xmlString) {
        const xmlDoc = this.parser.parseFromString(xmlString, 'text/xml');
        
        // Check for parsing errors
        const parserError = xmlDoc.getElementsByTagName('parsererror');
        if (parserError.length > 0) {
            throw new Error('Invalid XML format');
        }
        
        return xmlDoc;
    }
    
    /**
     * Validate if a file is a Storyline file
     */
    isStorylineFile(file) {
        const fileName = file.name.toLowerCase();
        const fileType = file.type.toLowerCase();
        
        // Check file extension
        const validExtensions = ['.story', '.zip'];
        const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
        
        // Check file type
        const hasValidType = fileType.includes('zip') || fileType.includes('octet-stream');
        
        // If it's a ZIP file, it might be a Storyline package
        if (hasValidType || hasValidExtension) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Get template conversion summary
     */
    getConversionSummary(result) {
        return {
            originalFile: result.originalFile,
            templateType: result.templateType,
            fileSize: result.fileSize,
            questionCount: result.data.questions?.length || 
                         result.data.items?.length || 
                         result.data.cards?.length || 0,
            slideCount: result.analysis?.slideCount || 0,
            mediaCount: result.analysis?.mediaCount || 0,
            conversionSuccess: true
        };
    }
}

// Export the parser
export default StorylineParser;