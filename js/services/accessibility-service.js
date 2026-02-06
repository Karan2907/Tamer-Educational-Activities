/**
 * Accessibility Service
 * 
 * This service adds accessibility features to the educational platform including
 * ARIA labels, keyboard navigation, high contrast mode, and screen reader support.
 */

class AccessibilityService {
    constructor() {
        this.isEnabled = true;
        this.highContrastMode = false;
        this.screenReaderMode = false;
        this.keyboardNavigationMode = true;
        this.focusIndicator = true;
        this.currentFocus = null;
        this.focusHistory = [];
        this.accessibleElements = new Map();
        this.observers = [];
        this.keyBindings = new Map();
    }
    
    /**
     * Initialize accessibility features
     */
    initialize() {
        // Apply initial accessibility settings
        this.applyAccessibilitySettings();
        
        // Set up keyboard navigation
        this.setupKeyboardNavigation();
        
        // Set up focus management
        this.setupFocusManagement();
        
        // Set up ARIA enhancements
        this.setupARIAEnhancements();
        
        // Monitor for dynamic content
        this.setupDynamicContentMonitoring();
        
        // Apply high contrast if enabled
        if (this.highContrastMode) {
            this.enableHighContrast();
        }
        
        console.log('Accessibility service initialized');
    }
    
    /**
     * Apply accessibility settings to the page
     */
    applyAccessibilitySettings() {
        // Set language attribute for screen readers
        document.documentElement.setAttribute('lang', 'en');
        
        // Add landmark roles for screen readers
        this.addLandmarkRoles();
        
        // Enhance form controls
        this.enhanceFormControls();
        
        // Add skip links for keyboard users
        this.addSkipLinks();
    }
    
    /**
     * Add landmark roles for screen readers
     */
    addLandmarkRoles() {
        // Add banner role to header
        const header = document.querySelector('header') || document.querySelector('.header');
        if (header && !header.getAttribute('role')) {
            header.setAttribute('role', 'banner');
        }
        
        // Add main role to main content
        const main = document.querySelector('main') || document.querySelector('.main');
        if (main && !main.getAttribute('role')) {
            main.setAttribute('role', 'main');
        }
        
        // Add navigation role to nav elements
        const navs = document.querySelectorAll('nav, .navigation, .navbar');
        navs.forEach(nav => {
            if (!nav.getAttribute('role')) {
                nav.setAttribute('role', 'navigation');
            }
        });
        
        // Add complementary role to sidebars
        const sidebars = document.querySelectorAll('.sidebar, .aside');
        sidebars.forEach(sidebar => {
            if (!sidebar.getAttribute('role')) {
                sidebar.setAttribute('role', 'complementary');
            }
        });
        
        // Add contentinfo role to footer
        const footer = document.querySelector('footer') || document.querySelector('.footer');
        if (footer && !footer.getAttribute('role')) {
            footer.setAttribute('role', 'contentinfo');
        }
    }
    
    /**
     * Enhance form controls with accessibility attributes
     */
    enhanceFormControls() {
        // Add labels to form controls
        const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea, select');
        inputs.forEach(input => {
            this.enhanceFormControl(input);
        });
        
        // Enhance buttons
        const buttons = document.querySelectorAll('button, .btn, [role="button"]');
        buttons.forEach(button => {
            this.enhanceButton(button);
        });
        
        // Enhance links
        const links = document.querySelectorAll('a[href]');
        links.forEach(link => {
            this.enhanceLink(link);
        });
    }
    
    /**
     * Enhance a form control with accessibility attributes
     */
    enhanceFormControl(input) {
        const id = input.id || `acc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        if (!input.id) {
            input.id = id;
        }
        
        // Find associated label
        let label = document.querySelector(`label[for="${input.id}"]`);
        if (!label) {
            // Try to find a label in the parent
            let parent = input.parentElement;
            while (parent && parent !== document) {
                label = parent.querySelector(`label[for="${input.id}"]`);
                if (label) break;
                parent = parent.parentElement;
            }
        }
        
        // If no label exists, create one if possible
        if (!label && input.placeholder) {
            // Add aria-label if no visible label exists
            if (!input.getAttribute('aria-label')) {
                input.setAttribute('aria-label', input.placeholder);
            }
        }
        
        // Add required attribute for screen readers
        if (input.required) {
            input.setAttribute('aria-required', 'true');
        }
        
        // Add describedby if there's help text
        const helpText = input.nextElementSibling;
        if (helpText && (helpText.classList.contains('help-text') || helpText.classList.contains('text-muted'))) {
            const helpId = `help-${id}`;
            helpText.id = helpId;
            input.setAttribute('aria-describedby', helpId);
        }
    }
    
    /**
     * Enhance a button with accessibility attributes
     */
    enhanceButton(button) {
        // Ensure button has accessible name
        if (!button.getAttribute('aria-label') && !button.textContent.trim() && !button.getAttribute('title')) {
            button.setAttribute('aria-label', 'Button');
        }
        
        // Add role if it's a fake button
        if (!button.tagName.match(/BUTTON|INPUT/) && !button.getAttribute('role')) {
            button.setAttribute('role', 'button');
        }
        
        // Make keyboard accessible
        if (button.getAttribute('tabindex') === null) {
            button.setAttribute('tabindex', '0');
        }
    }
    
    /**
     * Enhance a link with accessibility attributes
     */
    enhanceLink(link) {
        // Add aria-label if link text is not descriptive
        const linkText = link.textContent.trim();
        if (!link.getAttribute('aria-label') && (linkText.length < 3 || ['click here', 'here', 'more', 'read more'].includes(linkText.toLowerCase()))) {
            const ariaLabel = link.title || `Link to ${link.href}`;
            link.setAttribute('aria-label', ariaLabel);
        }
    }
    
    /**
     * Add skip links for keyboard navigation
     */
    addSkipLinks() {
        // Create skip links container
        let skipLinks = document.querySelector('#skip-links');
        if (!skipLinks) {
            skipLinks = document.createElement('div');
            skipLinks.id = 'skip-links';
            skipLinks.style.cssText = `
                position: absolute;
                top: -40px;
                left: 6px;
                z-index: 10000;
                padding: 8px;
                background: #000;
                color: #fff;
                text-decoration: none;
            `;
            skipLinks.setAttribute('aria-label', 'Skip navigation links');
            document.body.insertBefore(skipLinks, document.body.firstChild);
        }
        
        // Add main content skip link
        const mainSkip = document.createElement('a');
        mainSkip.href = '#main-content';
        mainSkip.textContent = 'Skip to main content';
        mainSkip.style.cssText = 'display: block; margin: 4px 0; color: white; text-decoration: underline;';
        skipLinks.appendChild(mainSkip);
        
        // Add navigation skip link
        const navSkip = document.createElement('a');
        navSkip.href = '#navigation';
        navSkip.textContent = 'Skip to navigation';
        navSkip.style.cssText = 'display: block; margin: 4px 0; color: white; text-decoration: underline;';
        skipLinks.appendChild(navSkip);
    }
    
    /**
     * Set up keyboard navigation
     */
    setupKeyboardNavigation() {
        // Handle Tab key for focus management
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Tab') {
                this.handleTabKey(event);
            } else if (event.key === 'Enter' || event.key === ' ') {
                this.handleEnterOrSpace(event);
            } else if (event.key === 'Escape') {
                this.handleEscapeKey(event);
            } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                this.handleArrowKeys(event);
            }
        });
        
        // Show focus indicators when using keyboard
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });
        
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
    }
    
    /**
     * Handle Tab key for focus management
     */
    handleTabKey(event) {
        const activeElement = document.activeElement;
        this.currentFocus = activeElement;
        this.focusHistory.push(activeElement);
        
        // Add visual focus indicator
        if (this.focusIndicator) {
            this.addFocusIndicator(activeElement);
        }
    }
    
    /**
     * Handle Enter or Space key for activation
     */
    handleEnterOrSpace(event) {
        const activeElement = document.activeElement;
        
        // Activate buttons, links, etc. when Enter or Space is pressed
        if (activeElement && 
            (activeElement.tagName === 'BUTTON' || 
             activeElement.getAttribute('role') === 'button' ||
             activeElement.tagName === 'A' ||
             activeElement.getAttribute('role') === 'link')) {
            event.preventDefault();
            activeElement.click();
        }
        
        // Toggle checkboxes and radio buttons
        if (activeElement && 
            (activeElement.type === 'checkbox' || activeElement.type === 'radio')) {
            event.preventDefault();
            activeElement.click();
        }
        
        // Expand/collapse elements with aria-expanded
        if (activeElement && activeElement.getAttribute('aria-expanded') !== null) {
            event.preventDefault();
            this.toggleExpandableElement(activeElement);
        }
    }
    
    /**
     * Handle Escape key for closing modals, menus, etc.
     */
    handleEscapeKey(event) {
        // Close any open dropdowns, modals, or other expandable elements
        this.closeOpenElements();
    }
    
    /**
     * Handle Arrow keys for navigation in special components
     */
    handleArrowKeys(event) {
        const activeElement = document.activeElement;
        
        // Handle arrow keys in tab lists
        if (activeElement && activeElement.getAttribute('role') === 'tab') {
            event.preventDefault();
            this.handleTabArrowNavigation(event, activeElement);
        }
        
        // Handle arrow keys in radio groups
        if (activeElement && activeElement.type === 'radio') {
            event.preventDefault();
            this.handleRadioArrowNavigation(event, activeElement);
        }
    }
    
    /**
     * Handle arrow navigation in tab lists
     */
    handleTabArrowNavigation(event, activeElement) {
        const tabList = activeElement.parentElement;
        const tabs = Array.from(tabList.querySelectorAll('[role="tab"]'));
        const currentIndex = tabs.indexOf(activeElement);
        let newIndex;
        
        if (event.key === 'ArrowRight') {
            newIndex = (currentIndex + 1) % tabs.length;
        } else if (event.key === 'ArrowLeft') {
            newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        }
        
        if (newIndex !== undefined && tabs[newIndex]) {
            tabs[newIndex].focus();
            this.activateTab(tabs[newIndex]);
        }
    }
    
    /**
     * Handle arrow navigation in radio groups
     */
    handleRadioArrowNavigation(event, activeElement) {
        const radioGroup = document.querySelector(`[role="radiogroup"][data-name="${activeElement.name}"]`) ||
                          activeElement.closest(`[role="radiogroup"]`);
        if (!radioGroup) return;
        
        const radios = Array.from(radioGroup.querySelectorAll(`input[type="radio"][name="${activeElement.name}"]`));
        const currentIndex = radios.indexOf(activeElement);
        let newIndex;
        
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            newIndex = (currentIndex + 1) % radios.length;
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            newIndex = (currentIndex - 1 + radios.length) % radios.length;
        }
        
        if (newIndex !== undefined && radios[newIndex]) {
            radios[newIndex].focus();
            radios[newIndex].click();
        }
    }
    
    /**
     * Set up focus management
     */
    setupFocusManagement() {
        // Track focus changes
        document.addEventListener('focusin', (event) => {
            this.currentFocus = event.target;
            
            // Add focus styles
            this.addFocusIndicator(event.target);
        });
        
        document.addEventListener('focusout', (event) => {
            // Remove focus styles
            this.removeFocusIndicator(event.target);
        });
    }
    
    /**
     * Add focus indicator to an element
     */
    addFocusIndicator(element) {
        if (!element) return;
        
        // Remove any existing focus indicators
        this.removeFocusIndicator(element);
        
        // Add focus class
        element.classList.add('accessible-focus');
        
        // Add CSS for focus indicator if not already present
        if (!document.getElementById('accessibility-focus-styles')) {
            const style = document.createElement('style');
            style.id = 'accessibility-focus-styles';
            style.textContent = `
                .accessible-focus,
                .accessible-focus:focus {
                    outline: 3px solid #4A90E2 !important;
                    outline-offset: 2px !important;
                    border-radius: 4px !important;
                }
                
                .keyboard-navigation .accessible-focus,
                .keyboard-navigation .accessible-focus:focus {
                    outline: 3px solid #FF6B35 !important;
                    outline-offset: 2px !important;
                    border-radius: 4px !important;
                }
                
                /* High contrast focus indicator */
                .high-contrast .accessible-focus,
                .high-contrast .accessible-focus:focus {
                    outline: 4px solid #000 !important;
                    outline-offset: 2px !important;
                    background-color: #FFFF00 !important;
                    color: #000 !important;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    /**
     * Remove focus indicator from an element
     */
    removeFocusIndicator(element) {
        if (element) {
            element.classList.remove('accessible-focus');
        }
    }
    
    /**
     * Set up ARIA enhancements
     */
    setupARIAEnhancements() {
        // Enhance common UI patterns
        this.enhanceDialogs();
        this.enhanceMenus();
        this.enhanceTabs();
        this.enhanceAlerts();
        this.enhanceProgressBar();
        this.enhanceSlider();
    }
    
    /**
     * Enhance dialog accessibility
     */
    enhanceDialogs() {
        const dialogs = document.querySelectorAll('[role="dialog"], .modal, [aria-modal="true"]');
        dialogs.forEach(dialog => {
            this.enhanceDialog(dialog);
        });
    }
    
    /**
     * Enhance a dialog with accessibility features
     */
    enhanceDialog(dialog) {
        // Ensure dialog has proper attributes
        if (!dialog.getAttribute('aria-labelledby') && !dialog.getAttribute('aria-label')) {
            const title = dialog.querySelector('h1, h2, h3, h4, h5, h6, .modal-title');
            if (title) {
                const titleId = `dialog-title-${Date.now()}`;
                title.id = titleId;
                dialog.setAttribute('aria-labelledby', titleId);
            }
        }
        
        // Trap focus within dialog
        dialog.addEventListener('keydown', (event) => {
            if (event.key === 'Tab') {
                this.trapFocusWithinDialog(event, dialog);
            }
        });
    }
    
    /**
     * Trap focus within a dialog
     */
    trapFocusWithinDialog(event, dialog) {
        const focusableElements = dialog.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const isShift = event.shiftKey;
        
        if (event.target === firstElement && isShift) {
            event.preventDefault();
            lastElement.focus();
        } else if (event.target === lastElement && !isShift) {
            event.preventDefault();
            firstElement.focus();
        }
    }
    
    /**
     * Enhance menu accessibility
     */
    enhanceMenus() {
        const menus = document.querySelectorAll('[role="menu"], .dropdown-menu, .menu');
        menus.forEach(menu => {
            this.enhanceMenu(menu);
        });
    }
    
    /**
     * Enhance a menu with accessibility features
     */
    enhanceMenu(menu) {
        // Add proper ARIA attributes
        if (!menu.getAttribute('role')) {
            menu.setAttribute('role', 'menu');
        }
        
        // Enhance menu items
        const menuItems = menu.querySelectorAll('[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]');
        menuItems.forEach((item, index) => {
            if (!item.getAttribute('role')) {
                item.setAttribute('role', 'menuitem');
            }
            item.setAttribute('tabindex', '-1');
            
            // Add keyboard event handlers
            item.addEventListener('keydown', (event) => {
                this.handleMenuItemKeydown(event, menu, index);
            });
        });
    }
    
    /**
     * Handle menu item keyboard events
     */
    handleMenuItemKeydown(event, menu, currentIndex) {
        const menuItems = Array.from(menu.querySelectorAll('[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]'));
        
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                const nextIndex = (currentIndex + 1) % menuItems.length;
                menuItems[nextIndex].focus();
                break;
                
            case 'ArrowUp':
                event.preventDefault();
                const prevIndex = (currentIndex - 1 + menuItems.length) % menuItems.length;
                menuItems[prevIndex].focus();
                break;
                
            case 'Home':
                event.preventDefault();
                menuItems[0].focus();
                break;
                
            case 'End':
                event.preventDefault();
                menuItems[menuItems.length - 1].focus();
                break;
                
            case 'Enter':
            case ' ':
                event.preventDefault();
                event.target.click();
                break;
        }
    }
    
    /**
     * Enhance tab accessibility
     */
    enhanceTabs() {
        const tabLists = document.querySelectorAll('[role="tablist"]');
        tabLists.forEach(tabList => {
            this.enhanceTabList(tabList);
        });
    }
    
    /**
     * Enhance a tab list with accessibility features
     */
    enhanceTabList(tabList) {
        const tabs = tabList.querySelectorAll('[role="tab"]');
        const panels = tabList.parentNode.querySelectorAll('[role="tabpanel"]');
        
        tabs.forEach((tab, index) => {
            // Set up tab attributes
            tab.setAttribute('tabindex', index === 0 ? '0' : '-1');
            tab.setAttribute('aria-selected', index === 0);
            tab.setAttribute('aria-controls', panels[index] ? panels[index].id : `panel-${index}`);
            
            // Set up panel attributes
            if (panels[index]) {
                panels[index].setAttribute('aria-labelledby', tab.id);
                panels[index].hidden = index !== 0;
            }
            
            // Add event listeners
            tab.addEventListener('click', () => {
                this.activateTab(tab);
            });
        });
    }
    
    /**
     * Activate a tab
     */
    activateTab(tab) {
        // Deactivate all tabs
        const tabList = tab.closest('[role="tablist"]');
        const allTabs = tabList.querySelectorAll('[role="tab"]');
        const allPanels = tabList.parentNode.querySelectorAll('[role="tabpanel"]');
        
        allTabs.forEach(t => {
            t.setAttribute('aria-selected', 'false');
            t.setAttribute('tabindex', '-1');
        });
        
        allPanels.forEach(p => {
            p.hidden = true;
        });
        
        // Activate clicked tab
        tab.setAttribute('aria-selected', 'true');
        tab.setAttribute('tabindex', '0');
        tab.focus();
        
        // Show corresponding panel
        const panelId = tab.getAttribute('aria-controls');
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.hidden = false;
        }
    }
    
    /**
     * Enhance alert accessibility
     */
    enhanceAlerts() {
        const alerts = document.querySelectorAll('.alert, [role="alert"], .notification');
        alerts.forEach(alert => {
            if (!alert.getAttribute('role')) {
                alert.setAttribute('role', 'alert');
            }
            if (!alert.getAttribute('aria-live')) {
                alert.setAttribute('aria-live', 'assertive');
            }
        });
    }
    
    /**
     * Enhance progress bar accessibility
     */
    enhanceProgressBar() {
        const progressBars = document.querySelectorAll('.progress, [role="progressbar"]');
        progressBars.forEach(progressBar => {
            if (!progressBar.getAttribute('role')) {
                progressBar.setAttribute('role', 'progressbar');
            }
            if (!progressBar.getAttribute('aria-valuemin')) {
                progressBar.setAttribute('aria-valuemin', '0');
            }
            if (!progressBar.getAttribute('aria-valuemax')) {
                progressBar.setAttribute('aria-valuemax', '100');
            }
            
            // Update value dynamically
            const value = progressBar.getAttribute('data-value') || 
                         progressBar.querySelector('.progress-fill')?.style.width?.replace('%', '') || 0;
            progressBar.setAttribute('aria-valuenow', value);
        });
    }
    
    /**
     * Enhance slider accessibility
     */
    enhanceSlider() {
        const sliders = document.querySelectorAll('input[type="range"], .slider');
        sliders.forEach(slider => {
            if (!slider.getAttribute('role')) {
                slider.setAttribute('role', 'slider');
            }
            if (!slider.getAttribute('aria-valuemin')) {
                slider.setAttribute('aria-valuemin', slider.min || '0');
            }
            if (!slider.getAttribute('aria-valuemax')) {
                slider.setAttribute('aria-valuemax', slider.max || '100');
            }
            if (!slider.getAttribute('aria-valuenow')) {
                slider.setAttribute('aria-valuenow', slider.value);
            }
            
            slider.addEventListener('input', () => {
                slider.setAttribute('aria-valuenow', slider.value);
            });
        });
    }
    
    /**
     * Set up monitoring for dynamically added content
     */
    setupDynamicContentMonitoring() {
        // Create mutation observer for dynamic content
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.enhanceElementAccessibility(node);
                        
                        // Enhance any child elements that were added
                        const walker = document.createTreeWalker(
                            node,
                            NodeFilter.SHOW_ELEMENT,
                            null,
                            false
                        );
                        
                        let currentNode;
                        while (currentNode = walker.nextNode()) {
                            this.enhanceElementAccessibility(currentNode);
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        this.observers.push(observer);
    }
    
    /**
     * Enhance a single element's accessibility
     */
    enhanceElementAccessibility(element) {
        // Enhance different types of elements
        if (element.tagName === 'BUTTON' || element.classList.contains('btn')) {
            this.enhanceButton(element);
        } else if (element.tagName.match(/^INPUT|SELECT|TEXTAREA$/)) {
            this.enhanceFormControl(element);
        } else if (element.tagName === 'A') {
            this.enhanceLink(element);
        } else if (element.getAttribute('role') === 'dialog' || element.classList.contains('modal')) {
            this.enhanceDialog(element);
        } else if (element.getAttribute('role') === 'menu' || element.classList.contains('menu')) {
            this.enhanceMenu(element);
        } else if (element.getAttribute('role') === 'tablist') {
            this.enhanceTabList(element);
        } else if (element.classList.contains('alert') || element.getAttribute('role') === 'alert') {
            this.enhanceAlerts();
        } else if (element.classList.contains('progress') || element.getAttribute('role') === 'progressbar') {
            this.enhanceProgressBar();
        }
    }
    
    /**
     * Toggle high contrast mode
     */
    toggleHighContrast() {
        this.highContrastMode = !this.highContrastMode;
        if (this.highContrastMode) {
            this.enableHighContrast();
        } else {
            this.disableHighContrast();
        }
    }
    
    /**
     * Enable high contrast mode
     */
    enableHighContrast() {
        document.body.classList.add('high-contrast');
        
        // Add high contrast styles
        if (!document.getElementById('high-contrast-styles')) {
            const style = document.createElement('style');
            style.id = 'high-contrast-styles';
            style.textContent = `
                .high-contrast * {
                    background-color: #FFFFFF !important;
                    color: #000000 !important;
                    border-color: #000000 !important;
                }
                
                .high-contrast a,
                .high-contrast a:visited {
                    color: #0000EE !important;
                }
                
                .high-contrast a:hover {
                    color: #0000FF !important;
                    text-decoration: underline !important;
                }
                
                .high-contrast button,
                .high-contrast input[type="button"],
                .high-contrast input[type="submit"],
                .high-contrast input[type="reset"] {
                    border: 2px solid #000000 !important;
                    background-color: #FFFFFF !important;
                    color: #000000 !important;
                }
                
                .high-contrast img {
                    border: 2px solid #000000 !important;
                }
                
                .high-contrast .accessible-focus,
                .high-contrast .accessible-focus:focus {
                    outline: 4px solid #000000 !important;
                    outline-offset: 2px !important;
                    background-color: #FFFF00 !important;
                    color: #000000 !important;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    /**
     * Disable high contrast mode
     */
    disableHighContrast() {
        document.body.classList.remove('high-contrast');
    }
    
    /**
     * Toggle screen reader mode
     */
    toggleScreenReaderMode() {
        this.screenReaderMode = !this.screenReaderMode;
        if (this.screenReaderMode) {
            this.enableScreenReaderMode();
        } else {
            this.disableScreenReaderMode();
        }
    }
    
    /**
     * Enable screen reader mode
     */
    enableScreenReaderMode() {
        document.body.classList.add('screen-reader-mode');
        
        // Add screen reader specific styles
        if (!document.getElementById('screen-reader-styles')) {
            const style = document.createElement('style');
            style.id = 'screen-reader-styles';
            style.textContent = `
                .screen-reader-only {
                    position: absolute !important;
                    width: 1px !important;
                    height: 1px !important;
                    padding: 0 !important;
                    margin: -1px !important;
                    overflow: hidden !important;
                    clip: rect(0, 0, 0, 0) !important;
                    white-space: nowrap !important;
                    border: 0 !important;
                }
                
                .screen-reader-mode * {
                    speak: normal !important;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    /**
     * Disable screen reader mode
     */
    disableScreenReaderMode() {
        document.body.classList.remove('screen-reader-mode');
    }
    
    /**
     * Announce text to screen readers
     */
    announceToScreenReader(text, priority = 'polite') {
        // Create or reuse announcement element
        let announcer = document.getElementById('accessibility-announcer');
        if (!announcer) {
            announcer = document.createElement('div');
            announcer.id = 'accessibility-announcer';
            announcer.className = 'screen-reader-only';
            announcer.setAttribute('aria-live', priority);
            announcer.setAttribute('aria-atomic', 'true');
            document.body.appendChild(announcer);
        }
        
        // Clear and set new announcement
        announcer.textContent = '';
        // Small delay to ensure screen reader picks up the change
        setTimeout(() => {
            announcer.textContent = text;
        }, 100);
    }
    
    /**
     * Close any open elements (dialogs, menus, etc.)
     */
    closeOpenElements() {
        // Close all open dialogs
        const openDialogs = document.querySelectorAll('[role="dialog"][aria-hidden="false"], .modal.show');
        openDialogs.forEach(dialog => {
            if (dialog.close) {
                dialog.close();
            } else {
                dialog.style.display = 'none';
                dialog.setAttribute('aria-hidden', 'true');
            }
        });
        
        // Close all open menus
        const openMenus = document.querySelectorAll('[role="menu"][aria-hidden="false"], .dropdown.show');
        openMenus.forEach(menu => {
            menu.setAttribute('aria-hidden', 'true');
            menu.classList.remove('show');
        });
    }
    
    /**
     * Toggle expandable element (like collapsible sections)
     */
    toggleExpandableElement(element) {
        const expanded = element.getAttribute('aria-expanded') === 'true';
        element.setAttribute('aria-expanded', !expanded);
        
        // If there's a corresponding panel, show/hide it
        const controlsId = element.getAttribute('aria-controls');
        if (controlsId) {
            const panel = document.getElementById(controlsId);
            if (panel) {
                panel.hidden = expanded;
            }
        }
    }
    
    /**
     * Activate a tab (helper method)
     */
    activateTab(tab) {
        // This method is called from keyboard navigation
        // It's defined here to avoid circular dependency issues
        this.enhanceTabList(tab.closest('[role="tablist"]'));
    }
    
    /**
     * Get current accessibility settings
     */
    getSettings() {
        return {
            highContrastMode: this.highContrastMode,
            screenReaderMode: this.screenReaderMode,
            keyboardNavigationMode: this.keyboardNavigationMode,
            focusIndicator: this.focusIndicator
        };
    }
    
    /**
     * Set accessibility settings
     */
    setSettings(settings) {
        if (settings.highContrastMode !== undefined) {
            if (settings.highContrastMode && !this.highContrastMode) {
                this.enableHighContrast();
            } else if (!settings.highContrastMode && this.highContrastMode) {
                this.disableHighContrast();
            }
            this.highContrastMode = settings.highContrastMode;
        }
        
        if (settings.screenReaderMode !== undefined) {
            if (settings.screenReaderMode && !this.screenReaderMode) {
                this.enableScreenReaderMode();
            } else if (!settings.screenReaderMode && this.screenReaderMode) {
                this.disableScreenReaderMode();
            }
            this.screenReaderMode = settings.screenReaderMode;
        }
        
        if (settings.keyboardNavigationMode !== undefined) {
            this.keyboardNavigationMode = settings.keyboardNavigationMode;
        }
        
        if (settings.focusIndicator !== undefined) {
            this.focusIndicator = settings.focusIndicator;
        }
    }
    
    /**
     * Add accessibility shortcut key
     */
    addShortcutKey(key, callback, description) {
        this.keyBindings.set(key, { callback, description });
    }
    
    /**
     * Remove accessibility shortcut key
     */
    removeShortcutKey(key) {
        this.keyBindings.delete(key);
    }
    
    /**
     * Focus on a specific element with accessibility features
     */
    focusElement(element) {
        if (element) {
            element.focus();
            this.addFocusIndicator(element);
            this.currentFocus = element;
        }
    }
    
    /**
     * Get current focused element
     */
    getCurrentFocus() {
        return this.currentFocus || document.activeElement;
    }
    
    /**
     * Cleanup accessibility service
     */
    cleanup() {
        // Remove observers
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
        
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
        
        // Remove styles
        const stylesToRemove = ['accessibility-focus-styles', 'high-contrast-styles', 'screen-reader-styles'];
        stylesToRemove.forEach(id => {
            const style = document.getElementById(id);
            if (style) {
                style.remove();
            }
        });
        
        // Remove announcer
        const announcer = document.getElementById('accessibility-announcer');
        if (announcer) {
            announcer.remove();
        }
        
        // Remove skip links
        const skipLinks = document.getElementById('skip-links');
        if (skipLinks) {
            skipLinks.remove();
        }
        
        // Clean up maps
        this.accessibleElements.clear();
        this.keyBindings.clear();
        this.focusHistory = [];
    }
    
    /**
     * Run accessibility audit
     */
    runAccessibilityAudit() {
        const issues = [];
        
        // Check for missing alt attributes on images
        const images = document.querySelectorAll('img:not([alt])');
        images.forEach(img => {
            issues.push({
                type: 'error',
                element: img,
                message: 'Image missing alt attribute'
            });
        });
        
        // Check for missing labels on form controls
        const inputs = document.querySelectorAll('input:not([type="hidden"]):not([aria-label]):not([title]), textarea:not([aria-label]):not([title]), select:not([aria-label]):not([title])');
        inputs.forEach(input => {
            const hasLabel = document.querySelector(`label[for="${input.id}"]`) || 
                           input.closest('label');
            if (!hasLabel) {
                issues.push({
                    type: 'warning',
                    element: input,
                    message: 'Form control missing associated label'
                });
            }
        });
        
        // Check for low contrast text
        const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
        textElements.forEach(el => {
            // This is a simplified check - in practice you'd need more sophisticated contrast checking
            const computedStyle = window.getComputedStyle(el);
            const bgColor = this.hexToRgb(computedStyle.backgroundColor);
            const textColor = this.hexToRgb(computedStyle.color);
            
            if (bgColor && textColor) {
                const contrastRatio = this.contrastRatio(bgColor, textColor);
                if (contrastRatio < 4.5) {
                    issues.push({
                        type: 'warning',
                        element: el,
                        message: `Low contrast ratio: ${contrastRatio.toFixed(2)} (should be >= 4.5)`
                    });
                }
            }
        });
        
        return {
            totalIssues: issues.length,
            issues: issues,
            passed: issues.length === 0
        };
    }
    
    /**
     * Convert hex color to RGB
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    /**
     * Calculate contrast ratio between two colors
     */
    contrastRatio(color1, color2) {
        const lum1 = this.relativeLuminance(color1);
        const lum2 = this.relativeLuminance(color2);
        return (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
    }
    
    /**
     * Calculate relative luminance
     */
    relativeLuminance(color) {
        const r = color.r / 255;
        const g = color.g / 255;
        const b = color.b / 255;
        
        const sRGB = (c) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        
        return 0.2126 * sRGB(r) + 0.7152 * sRGB(g) + 0.0722 * sRGB(b);
    }
}

// Export the service
export default AccessibilityService;