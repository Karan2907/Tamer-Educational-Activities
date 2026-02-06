/**
 * State Restoration Service
 * 
 * This service handles restoring state after page reloads for templates that lose state
 * like Flash Cards, Reveal Panels, and Timeline. It preserves user progress, current
 * position, and interaction state.
 */

class StateRestorationService {
    constructor(firebaseService) {
        this.firebaseService = firebaseService;
        this.stateCache = new Map(); // Cache for in-memory state preservation
        this.restorationCallbacks = new Map(); // Callbacks for restoration
        this.unloadHandler = null;
        this.visibilityHandler = null;
        this.pageShowHandler = null;
    }
    
    /**
     * Initialize the restoration service
     */
    initialize() {
        // Set up handlers to preserve state before page unload/visibility change
        this.setupStatePreservationHandlers();
        
        // Set up handler to restore state after page show
        this.setupStateRestorationHandlers();
        
        console.log('State restoration service initialized');
    }
    
    /**
     * Set up state preservation handlers
     */
    setupStatePreservationHandlers() {
        // Preserve state before page unload
        this.unloadHandler = () => {
            this.preserveCurrentState();
        };
        window.addEventListener('beforeunload', this.unloadHandler);
        
        // Preserve state when page becomes hidden
        this.visibilityHandler = () => {
            if (document.visibilityState === 'hidden') {
                this.preserveCurrentState();
            }
        };
        document.addEventListener('visibilitychange', this.visibilityHandler);
    }
    
    /**
     * Set up state restoration handlers
     */
    setupStateRestorationHandlers() {
        // Restore state when page becomes visible again
        this.pageShowHandler = (event) => {
            if (event.persisted || performance.navigation.type === 2) {
                // Page was restored from bfcache or back-forward cache
                setTimeout(() => {
                    this.restoreCurrentState();
                }, 0);
            }
        };
        window.addEventListener('pageshow', this.pageShowHandler);
    }
    
    /**
     * Preserve current state to cache and/or storage
     */
    preserveCurrentState() {
        try {
            // Get current activity and template info
            const currentActivity = this.getCurrentActivityInfo();
            if (!currentActivity) {
                return;
            }
            
            const { activityId, templateType, userId } = currentActivity;
            
            // Get state based on template type
            const state = this.captureTemplateState(templateType);
            
            if (state) {
                // Store in memory cache
                const cacheKey = `${userId}:${activityId}`;
                this.stateCache.set(cacheKey, {
                    ...state,
                    templateType,
                    timestamp: new Date(),
                    preservedAt: new Date()
                });
                
                // Store in sessionStorage for immediate restoration
                sessionStorage.setItem('preservedState', JSON.stringify({
                    ...state,
                    templateType,
                    activityId,
                    userId,
                    timestamp: new Date().toISOString()
                }));
                
                // If user is authenticated, also save to Firestore
                if (this.firebaseService && this.firebaseService.isAuthenticated()) {
                    this.saveStateToFirestore(userId, activityId, state, templateType);
                }
                
                console.log(`State preserved for ${templateType} template: ${activityId}`);
            }
        } catch (error) {
            console.error('Error preserving state:', error);
        }
    }
    
    /**
     * Capture state for specific template type
     */
    captureTemplateState(templateType) {
        switch (templateType) {
            case 'flipcards':
                return this.captureFlashCardState();
            case 'contentreveal':
                return this.captureRevealPanelState();
            case 'timeline':
                return this.captureTimelineState();
            case 'interactivevideo':
                return this.captureInteractiveVideoState();
            case 'mcq':
                return this.captureMCQState();
            case 'truefalse':
                return this.captureTrueFalseState();
            case 'dragdrop':
                return this.captureDragDropState();
            case 'pickmany':
                return this.capturePickManyState();
            case 'labeldiagram':
                return this.captureLabelDiagramState();
            case 'gamearena':
                return this.captureGameArenaState();
            case 'scormviewer':
                return this.captureSCORMViewerState();
            default:
                return null;
        }
    }
    
    /**
     * Capture Flash Card state
     */
    captureFlashCardState() {
        const flipCardsContainer = document.querySelector('.flipcards-play-mode');
        if (!flipCardsContainer) {
            return null;
        }
        
        // Find all card elements and their flip states
        const cards = [];
        const cardElements = flipCardsContainer.querySelectorAll('.flashcard-item');
        
        cardElements.forEach((cardElement, index) => {
            const isFlipped = cardElement.classList.contains('flipped');
            const isReviewed = cardElement.classList.contains('reviewed');
            
            cards.push({
                index,
                isFlipped,
                isReviewed,
                front: cardElement.querySelector('.front')?.textContent || '',
                back: cardElement.querySelector('.back')?.textContent || ''
            });
        });
        
        // Find current position
        const currentPositionElement = flipCardsContainer.querySelector('.current-position');
        const currentPosition = currentPositionElement ? 
            parseInt(currentPositionElement.textContent) : 0;
        
        // Find total count
        const totalCountElement = flipCardsContainer.querySelector('.total-count');
        const totalCount = totalCountElement ? 
            parseInt(totalCountElement.textContent) : cards.length;
        
        return {
            template: 'flipcards',
            cards,
            currentPosition,
            totalCount,
            totalReviewed: cards.filter(card => card.isReviewed).length
        };
    }
    
    /**
     * Capture Content Reveal state
     */
    captureRevealPanelState() {
        const revealContainer = document.querySelector('.content-reveal-play-mode');
        if (!revealContainer) {
            return null;
        }
        
        const panels = [];
        const panelElements = revealContainer.querySelectorAll('.reveal-panel');
        
        panelElements.forEach((panelElement, index) => {
            const isRevealed = panelElement.classList.contains('revealed');
            
            panels.push({
                index,
                isRevealed,
                title: panelElement.querySelector('.panel-title')?.textContent || '',
                content: panelElement.querySelector('.panel-content')?.textContent || ''
            });
        });
        
        return {
            template: 'contentreveal',
            panels,
            revealedCount: panels.filter(panel => panel.isRevealed).length
        };
    }
    
    /**
     * Capture Timeline state
     */
    captureTimelineState() {
        const timelineContainer = document.querySelector('.timeline-play-mode');
        if (!timelineContainer) {
            return null;
        }
        
        const events = [];
        const eventElements = timelineContainer.querySelectorAll('.timeline-event');
        
        eventElements.forEach((eventElement, index) => {
            const isActive = eventElement.classList.contains('active');
            const isVisited = eventElement.classList.contains('visited');
            
            events.push({
                index,
                isActive,
                isVisited,
                title: eventElement.querySelector('.event-title')?.textContent || '',
                description: eventElement.querySelector('.event-description')?.textContent || '',
                date: eventElement.querySelector('.event-date')?.textContent || ''
            });
        });
        
        // Get current scroll position
        const timelineScroll = timelineContainer.querySelector('.timeline-scroll');
        const scrollPosition = timelineScroll ? timelineScroll.scrollLeft : 0;
        
        return {
            template: 'timeline',
            events,
            scrollPosition,
            visitedCount: events.filter(event => event.isVisited).length
        };
    }
    
    /**
     * Capture Interactive Video state
     */
    captureInteractiveVideoState() {
        const videoContainer = document.querySelector('.interactive-video-container');
        if (!videoContainer) {
            return null;
        }
        
        const videoElement = videoContainer.querySelector('iframe');
        const currentTime = this.getCurrentVideoTime(videoElement);
        const isPlaying = !videoContainer.classList.contains('paused');
        
        // Get question states
        const questions = [];
        const questionElements = videoContainer.querySelectorAll('.video-question-overlay');
        
        questionElements.forEach((questionElement, index) => {
            const isVisible = !questionElement.classList.contains('hidden');
            const isAnswered = questionElement.classList.contains('answered');
            
            questions.push({
                index,
                isVisible,
                isAnswered,
                questionText: questionElement.querySelector('#question-text')?.textContent || ''
            });
        });
        
        return {
            template: 'interactivevideo',
            currentTime,
            isPlaying,
            questions,
            answeredCount: questions.filter(q => q.isAnswered).length
        };
    }
    
    /**
     * Capture MCQ state
     */
    captureMCQState() {
        const mcqContainer = document.querySelector('.mcq-play-mode');
        if (!mcqContainer) {
            return null;
        }
        
        const questions = [];
        const questionElements = mcqContainer.querySelectorAll('.question-card');
        
        questionElements.forEach((questionElement, index) => {
            const selectedOption = questionElement.querySelector('.option-btn.selected');
            const isAnswered = !!selectedOption;
            const selectedOptionIndex = selectedOption ? 
                Array.from(questionElement.querySelectorAll('.option-btn')).indexOf(selectedOption) : -1;
            
            questions.push({
                index,
                isAnswered,
                selectedOptionIndex,
                questionText: questionElement.querySelector('.question-text')?.textContent || ''
            });
        });
        
        // Get current position
        const currentPosElement = mcqContainer.querySelector('.current-question');
        const currentPos = currentPosElement ? parseInt(currentPosElement.textContent) - 1 : 0;
        
        // Get total
        const totalElement = mcqContainer.querySelector('.total-questions');
        const total = totalElement ? parseInt(totalElement.textContent) : questions.length;
        
        return {
            template: 'mcq',
            questions,
            currentPosition: currentPos,
            total,
            answeredCount: questions.filter(q => q.isAnswered).length
        };
    }
    
    /**
     * Capture True/False state
     */
    captureTrueFalseState() {
        const tfContainer = document.querySelector('.truefalse-play-mode');
        if (!tfContainer) {
            return null;
        }
        
        const items = [];
        const itemElements = tfContainer.querySelectorAll('.truefalse-item');
        
        itemElements.forEach((itemElement, index) => {
            const isSelected = itemElement.classList.contains('selected');
            const isCorrect = itemElement.classList.contains('correct');
            const isAnswered = itemElement.classList.contains('answered');
            const userSelection = itemElement.querySelector('.true-btn.selected') ? 'true' :
                                 itemElement.querySelector('.false-btn.selected') ? 'false' : null;
            
            items.push({
                index,
                isAnswered,
                userSelection,
                isCorrect,
                statement: itemElement.querySelector('.statement-text')?.textContent || ''
            });
        });
        
        return {
            template: 'truefalse',
            items,
            answeredCount: items.filter(item => item.isAnswered).length
        };
    }
    
    /**
     * Capture Drag & Drop state
     */
    captureDragDropState() {
        const ddContainer = document.querySelector('.dragdrop-play-mode');
        if (!ddContainer) {
            return null;
        }
        
        const pairs = [];
        const pairElements = ddContainer.querySelectorAll('.dragdrop-pair');
        
        pairElements.forEach((pairElement, index) => {
            const isMatched = pairElement.classList.contains('matched');
            const leftElement = pairElement.querySelector('.drag-item');
            const rightElement = pairElement.querySelector('.drop-zone');
            
            pairs.push({
                index,
                isMatched,
                leftText: leftElement?.textContent || '',
                rightText: rightElement?.textContent || '',
                userMatched: leftElement?.classList.contains('matched') || false
            });
        });
        
        return {
            template: 'dragdrop',
            pairs,
            matchedCount: pairs.filter(pair => pair.isMatched).length
        };
    }
    
    /**
     * Capture Pick Many state
     */
    capturePickManyState() {
        const pmContainer = document.querySelector('.pickmany-play-mode');
        if (!pmContainer) {
            return null;
        }
        
        const items = [];
        const itemElements = pmContainer.querySelectorAll('.pickmany-item');
        
        itemElements.forEach((itemElement, index) => {
            const isSelected = itemElement.classList.contains('selected');
            const isCorrect = itemElement.classList.contains('correct');
            const isAnswered = itemElement.classList.contains('answered');
            
            items.push({
                index,
                isSelected,
                isCorrect,
                isAnswered,
                text: itemElement.querySelector('.item-text')?.textContent || ''
            });
        });
        
        return {
            template: 'pickmany',
            items,
            selectedCount: items.filter(item => item.isSelected).length,
            correctCount: items.filter(item => item.isCorrect).length
        };
    }
    
    /**
     * Capture Label Diagram state
     */
    captureLabelDiagramState() {
        const ldContainer = document.querySelector('.labeldiagram-play-mode');
        if (!ldContainer) {
            return null;
        }
        
        const labels = [];
        const labelElements = ldContainer.querySelectorAll('.label-input');
        
        labelElements.forEach((labelElement, index) => {
            const isCorrect = labelElement.classList.contains('correct');
            const isFilled = labelElement.value !== '';
            
            labels.push({
                index,
                isFilled,
                isCorrect,
                value: labelElement.value,
                labelText: labelElement.placeholder || ''
            });
        });
        
        return {
            template: 'labeldiagram',
            labels,
            filledCount: labels.filter(label => label.isFilled).length,
            correctCount: labels.filter(label => label.isCorrect).length
        };
    }
    
    /**
     * Capture Game Arena state
     */
    captureGameArenaState() {
        const gaContainer = document.querySelector('.gamearena-play-mode');
        if (!gaContainer) {
            return null;
        }
        
        // For Game Arena, we might preserve score, level, or other game state
        const scoreElement = gaContainer.querySelector('.game-score');
        const levelElement = gaContainer.querySelector('.game-level');
        const livesElement = gaContainer.querySelector('.game-lives');
        
        return {
            template: 'gamearena',
            score: scoreElement ? parseInt(scoreElement.textContent) : 0,
            level: levelElement ? parseInt(levelElement.textContent) : 1,
            lives: livesElement ? parseInt(livesElement.textContent) : 3,
            gameState: 'preserved' // Placeholder for actual game state
        };
    }
    
    /**
     * Capture SCORM Viewer state
     */
    captureSCORMViewerState() {
        const scormContainer = document.querySelector('.scorm-viewer-play-mode');
        if (!scormContainer) {
            return null;
        }
        
        // For SCORM viewer, we preserve bookmark and progress
        const iframe = scormContainer.querySelector('iframe');
        const statusElement = scormContainer.querySelector('#scorm-status-text');
        
        return {
            template: 'scormviewer',
            progress: this.getCurrentSCORMProgress(iframe),
            bookmark: this.getCurrentSCORMBookmark(iframe),
            status: statusElement ? statusElement.textContent : 'unknown'
        };
    }
    
    /**
     * Get current video time (helper method)
     */
    getCurrentVideoTime(videoElement) {
        // For iframe videos, we might not be able to get exact time
        // This is a placeholder - in a real implementation, you'd use YouTube/Vimeo APIs
        return 0;
    }
    
    /**
     * Get current SCORM progress (placeholder)
     */
    getCurrentSCORMProgress(iframe) {
        // This would interact with the SCORM API in a real implementation
        return 0;
    }
    
    /**
     * Get current SCORM bookmark (placeholder)
     */
    getCurrentSCORMBookmark(iframe) {
        // This would interact with the SCORM API in a real implementation
        return '';
    }
    
    /**
     * Restore current state from cache and/or storage
     */
    restoreCurrentState() {
        try {
            // First, try to restore from sessionStorage
            const preservedStateJson = sessionStorage.getItem('preservedState');
            if (preservedStateJson) {
                const preservedState = JSON.parse(preservedStateJson);
                
                // Check if this is the current activity
                const currentActivity = this.getCurrentActivityInfo();
                if (currentActivity && 
                    currentActivity.activityId === preservedState.activityId &&
                    currentActivity.userId === preservedState.userId) {
                    
                    this.applyTemplateState(preservedState.templateType, preservedState);
                    console.log(`State restored from sessionStorage for ${preservedState.templateType}`);
                    return;
                }
            }
            
            // If not in sessionStorage, try memory cache
            const currentActivity = this.getCurrentActivityInfo();
            if (currentActivity) {
                const cacheKey = `${currentActivity.userId}:${currentActivity.activityId}`;
                const cachedState = this.stateCache.get(cacheKey);
                
                if (cachedState) {
                    this.applyTemplateState(cachedState.templateType, cachedState);
                    console.log(`State restored from memory cache for ${cachedState.templateType}`);
                    return;
                }
            }
            
            // If not in cache, try to load from Firestore
            if (this.firebaseService && this.firebaseService.isAuthenticated() && currentActivity) {
                this.loadStateFromFirestore(currentActivity.userId, currentActivity.activityId)
                    .then(state => {
                        if (state) {
                            this.applyTemplateState(state.templateType, state);
                            console.log(`State restored from Firestore for ${state.templateType}`);
                        }
                    })
                    .catch(error => {
                        console.error('Error loading state from Firestore:', error);
                    });
            }
        } catch (error) {
            console.error('Error restoring state:', error);
        }
    }
    
    /**
     * Apply state to specific template
     */
    applyTemplateState(templateType, state) {
        switch (templateType) {
            case 'flipcards':
                this.applyFlashCardState(state);
                break;
            case 'contentreveal':
                this.applyRevealPanelState(state);
                break;
            case 'timeline':
                this.applyTimelineState(state);
                break;
            case 'interactivevideo':
                this.applyInteractiveVideoState(state);
                break;
            case 'mcq':
                this.applyMCQState(state);
                break;
            case 'truefalse':
                this.applyTrueFalseState(state);
                break;
            case 'dragdrop':
                this.applyDragDropState(state);
                break;
            case 'pickmany':
                this.applyPickManyState(state);
                break;
            case 'labeldiagram':
                this.applyLabelDiagramState(state);
                break;
            case 'gamearena':
                this.applyGameArenaState(state);
                break;
            case 'scormviewer':
                this.applySCORMViewerState(state);
                break;
            default:
                console.warn(`No state restoration handler for template: ${templateType}`);
        }
    }
    
    /**
     * Apply Flash Card state
     */
    applyFlashCardState(state) {
        const flipCardsContainer = document.querySelector('.flipcards-play-mode');
        if (!flipCardsContainer) {
            return;
        }
        
        // Restore card states
        state.cards.forEach((cardState, index) => {
            const cardElement = flipCardsContainer.querySelectorAll('.flashcard-item')[index];
            if (cardElement) {
                if (cardState.isFlipped) {
                    cardElement.classList.add('flipped');
                }
                if (cardState.isReviewed) {
                    cardElement.classList.add('reviewed');
                }
            }
        });
        
        // Restore position
        if (state.currentPosition !== undefined) {
            // This would update the position indicator
            const posElement = flipCardsContainer.querySelector('.current-position');
            if (posElement) {
                posElement.textContent = state.currentPosition + 1;
            }
        }
        
        if (state.totalCount !== undefined) {
            const totalElement = flipCardsContainer.querySelector('.total-count');
            if (totalElement) {
                totalElement.textContent = state.totalCount;
            }
        }
    }
    
    /**
     * Apply Content Reveal state
     */
    applyRevealPanelState(state) {
        const revealContainer = document.querySelector('.content-reveal-play-mode');
        if (!revealContainer) {
            return;
        }
        
        // Restore panel states
        state.panels.forEach((panelState, index) => {
            const panelElement = revealContainer.querySelectorAll('.reveal-panel')[index];
            if (panelElement) {
                if (panelState.isRevealed) {
                    panelElement.classList.add('revealed');
                    panelElement.classList.remove('hidden');
                }
            }
        });
    }
    
    /**
     * Apply Timeline state
     */
    applyTimelineState(state) {
        const timelineContainer = document.querySelector('.timeline-play-mode');
        if (!timelineContainer) {
            return;
        }
        
        // Restore event states
        state.events.forEach((eventState, index) => {
            const eventElement = timelineContainer.querySelectorAll('.timeline-event')[index];
            if (eventElement) {
                if (eventState.isActive) {
                    eventElement.classList.add('active');
                }
                if (eventState.isVisited) {
                    eventElement.classList.add('visited');
                }
            }
        });
        
        // Restore scroll position
        if (state.scrollPosition !== undefined) {
            const timelineScroll = timelineContainer.querySelector('.timeline-scroll');
            if (timelineScroll) {
                timelineScroll.scrollLeft = state.scrollPosition;
            }
        }
    }
    
    /**
     * Apply Interactive Video state
     */
    applyInteractiveVideoState(state) {
        const videoContainer = document.querySelector('.interactive-video-container');
        if (!videoContainer) {
            return;
        }
        
        // Restore video state
        if (state.currentTime !== undefined) {
            // In a real implementation, you'd use YouTube/Vimeo APIs to seek to time
            console.log(`Would restore video to time: ${state.currentTime}`);
        }
        
        if (state.isPlaying !== undefined && !state.isPlaying) {
            videoContainer.classList.add('paused');
        }
        
        // Restore question states
        state.questions.forEach((questionState, index) => {
            const questionElement = videoContainer.querySelectorAll('.video-question-overlay')[index];
            if (questionElement) {
                if (questionState.isVisible) {
                    questionElement.classList.remove('hidden');
                }
                if (questionState.isAnswered) {
                    questionElement.classList.add('answered');
                }
            }
        });
    }
    
    /**
     * Apply MCQ state
     */
    applyMCQState(state) {
        const mcqContainer = document.querySelector('.mcq-play-mode');
        if (!mcqContainer) {
            return;
        }
        
        // Restore question states
        state.questions.forEach((questionState, index) => {
            const questionElement = mcqContainer.querySelectorAll('.question-card')[index];
            if (questionElement && questionState.selectedOptionIndex !== -1) {
                const optionButtons = questionElement.querySelectorAll('.option-btn');
                if (optionButtons[questionState.selectedOptionIndex]) {
                    optionButtons[questionState.selectedOptionIndex].classList.add('selected');
                }
            }
        });
        
        // Restore position
        if (state.currentPosition !== undefined) {
            const posElement = mcqContainer.querySelector('.current-question');
            if (posElement) {
                posElement.textContent = state.currentPosition + 1;
            }
        }
        
        if (state.total !== undefined) {
            const totalElement = mcqContainer.querySelector('.total-questions');
            if (totalElement) {
                totalElement.textContent = state.total;
            }
        }
    }
    
    /**
     * Apply True/False state
     */
    applyTrueFalseState(state) {
        const tfContainer = document.querySelector('.truefalse-play-mode');
        if (!tfContainer) {
            return;
        }
        
        // Restore item states
        state.items.forEach((itemState, index) => {
            const itemElement = tfContainer.querySelectorAll('.truefalse-item')[index];
            if (itemElement) {
                if (itemState.userSelection === 'true') {
                    itemElement.querySelector('.true-btn')?.classList.add('selected');
                } else if (itemState.userSelection === 'false') {
                    itemElement.querySelector('.false-btn')?.classList.add('selected');
                }
                
                if (itemState.isAnswered) {
                    itemElement.classList.add('answered');
                }
                if (itemState.isCorrect) {
                    itemElement.classList.add('correct');
                }
            }
        });
    }
    
    /**
     * Apply Drag & Drop state
     */
    applyDragDropState(state) {
        const ddContainer = document.querySelector('.dragdrop-play-mode');
        if (!ddContainer) {
            return;
        }
        
        // Restore pair states
        state.pairs.forEach((pairState, index) => {
            const pairElement = ddContainer.querySelectorAll('.dragdrop-pair')[index];
            if (pairElement) {
                if (pairState.isMatched) {
                    pairElement.classList.add('matched');
                }
                if (pairState.userMatched) {
                    pairElement.querySelector('.drag-item')?.classList.add('matched');
                }
            }
        });
    }
    
    /**
     * Apply Pick Many state
     */
    applyPickManyState(state) {
        const pmContainer = document.querySelector('.pickmany-play-mode');
        if (!pmContainer) {
            return;
        }
        
        // Restore item states
        state.items.forEach((itemState, index) => {
            const itemElement = pmContainer.querySelectorAll('.pickmany-item')[index];
            if (itemElement) {
                if (itemState.isSelected) {
                    itemElement.classList.add('selected');
                }
                if (itemState.isAnswered) {
                    itemElement.classList.add('answered');
                }
                if (itemState.isCorrect) {
                    itemElement.classList.add('correct');
                }
            }
        });
    }
    
    /**
     * Apply Label Diagram state
     */
    applyLabelDiagramState(state) {
        const ldContainer = document.querySelector('.labeldiagram-play-mode');
        if (!ldContainer) {
            return;
        }
        
        // Restore label states
        state.labels.forEach((labelState, index) => {
            const labelElement = ldContainer.querySelectorAll('.label-input')[index];
            if (labelElement) {
                labelElement.value = labelState.value || '';
                if (labelState.isCorrect) {
                    labelElement.classList.add('correct');
                }
            }
        });
    }
    
    /**
     * Apply Game Arena state
     */
    applyGameArenaState(state) {
        const gaContainer = document.querySelector('.gamearena-play-mode');
        if (!gaContainer) {
            return;
        }
        
        // Restore game state
        if (state.score !== undefined) {
            const scoreElement = gaContainer.querySelector('.game-score');
            if (scoreElement) {
                scoreElement.textContent = state.score;
            }
        }
        
        if (state.level !== undefined) {
            const levelElement = gaContainer.querySelector('.game-level');
            if (levelElement) {
                levelElement.textContent = state.level;
            }
        }
        
        if (state.lives !== undefined) {
            const livesElement = gaContainer.querySelector('.game-lives');
            if (livesElement) {
                livesElement.textContent = state.lives;
            }
        }
    }
    
    /**
     * Apply SCORM Viewer state
     */
    applySCORMViewerState(state) {
        const scormContainer = document.querySelector('.scorm-viewer-play-mode');
        if (!scormContainer) {
            return;
        }
        
        // Restore SCORM state
        if (state.progress !== undefined) {
            // In a real implementation, you'd communicate with the SCORM API
            console.log(`Would restore SCORM progress to: ${state.progress}%`);
        }
        
        if (state.bookmark !== undefined) {
            // In a real implementation, you'd communicate with the SCORM API
            console.log(`Would restore SCORM bookmark: ${state.bookmark}`);
        }
        
        if (state.status !== undefined) {
            const statusElement = scormContainer.querySelector('#scorm-status-text');
            if (statusElement) {
                statusElement.textContent = state.status;
            }
        }
    }
    
    /**
     * Get current activity info
     */
    getCurrentActivityInfo() {
        // This would get the current activity from the application state
        // In a real implementation, this would interface with the main application
        const platform = window.platform;
        if (platform) {
            const currentTemplate = platform.getTemplate();
            const currentUser = platform.getUser();
            const currentActivity = platform.getActivityData();
            
            if (currentTemplate && currentUser && currentActivity) {
                return {
                    templateType: currentTemplate,
                    userId: currentUser.uid,
                    activityId: currentActivity.metadata?.id
                };
            }
        }
        
        return null;
    }
    
    /**
     * Save state to Firestore
     */
    async saveStateToFirestore(userId, activityId, state, templateType) {
        if (!this.firebaseService || !this.firebaseService.isAuthenticated()) {
            return;
        }
        
        try {
            const stateRef = this.firebaseService.firestore.collection('users').doc(userId)
                .collection('states').doc(`temp_${activityId}`);
            
            const saveData = {
                userId,
                activityId,
                templateType,
                state,
                savedAt: this.firebaseService.firestore.FieldValue.serverTimestamp()
            };
            
            await stateRef.set(saveData, { merge: true });
        } catch (error) {
            console.error('Error saving state to Firestore:', error);
        }
    }
    
    /**
     * Load state from Firestore
     */
    async loadStateFromFirestore(userId, activityId) {
        if (!this.firebaseService || !this.firebaseService.isAuthenticated()) {
            return null;
        }
        
        try {
            const stateRef = this.firebaseService.firestore.collection('users').doc(userId)
                .collection('states').doc(`temp_${activityId}`);
            
            const doc = await stateRef.get();
            
            if (doc.exists) {
                return doc.data();
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error loading state from Firestore:', error);
            return null;
        }
    }
    
    /**
     * Register a restoration callback for a specific template
     */
    registerRestorationCallback(templateType, callback) {
        if (!this.restorationCallbacks.has(templateType)) {
            this.restorationCallbacks.set(templateType, []);
        }
        this.restorationCallbacks.get(templateType).push(callback);
    }
    
    /**
     * Clear preserved state from sessionStorage
     */
    clearPreservedState() {
        sessionStorage.removeItem('preservedState');
    }
    
    /**
     * Cleanup the restoration service
     */
    cleanup() {
        // Remove event listeners
        if (this.unloadHandler) {
            window.removeEventListener('beforeunload', this.unloadHandler);
        }
        if (this.visibilityHandler) {
            document.removeEventListener('visibilitychange', this.visibilityHandler);
        }
        if (this.pageShowHandler) {
            window.removeEventListener('pageshow', this.pageShowHandler);
        }
        
        // Clear caches
        this.stateCache.clear();
        this.restorationCallbacks.clear();
        
        // Clear preserved state
        this.clearPreservedState();
    }
    
    /**
     * Force state preservation (for external calls)
     */
    forcePreserveState() {
        this.preserveCurrentState();
    }
    
    /**
     * Force state restoration (for external calls)
     */
    forceRestoreState() {
        this.restoreCurrentState();
    }
}

// Export the service
export default StateRestorationService;