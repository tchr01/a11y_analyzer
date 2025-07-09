class AccessibilityAuditor {
    constructor() {
        this.form = document.getElementById('auditForm');
        this.loadingSection = document.getElementById('loadingSection');
        this.reportSection = document.getElementById('reportSection');
        this.reportContent = document.getElementById('reportContent');
        this.generateBtn = document.getElementById('generateBtn');
        
        this.init();
    }

    init() {
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const urlInput = document.getElementById('urlInput');
        const url = urlInput.value.trim();
        
        if (!this.isValidURL(url)) {
            alert('Please enter a valid URL');
            return;
        }

        this.showLoading();
        
        try {
            const report = await this.generateReport(url);
            this.displayReport(report);
        } catch (error) {
            console.error('Error generating report:', error);
            this.showError(error.message || 'Error generating report. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    isValidURL(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    showLoading() {
        this.loadingSection.style.display = 'block';
        this.reportSection.style.display = 'none';
        this.generateBtn.disabled = true;
    }

    hideLoading() {
        this.loadingSection.style.display = 'none';
        this.generateBtn.disabled = false;
    }
    
    showError(message) {
        this.reportContent.innerHTML = `
            <div class="error-message">
                <h3>Error</h3>
                <p>${message}</p>
                <p>Please check:</p>
                <ul>
                    <li>The URL is accessible and publicly available</li>
                    <li>The server is running (run <code>npm start</code>)</li>
                    <li>The URL doesn't require authentication</li>
                    <li>The site allows web scraping</li>
                </ul>
            </div>
        `;
        this.reportSection.style.display = 'block';
        this.reportSection.scrollIntoView({ behavior: 'smooth' });
    }

    async generateReport(url) {
        try {
            // Call the backend proxy to analyze the URL
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Analysis failed');
            }

            // Process axe-core results
            const issues = this.processAxeResults(data.results);
            const wcagCompliance = this.assessWCAGCompliance(issues);
            const triagePlan = this.generateTriagePlan(issues);
            const executiveSummary = this.generateExecutiveSummary(issues, wcagCompliance);
            const culturalConsiderations = this.generateCulturalConsiderations();
            const prdRequirements = this.generatePRDRequirements(issues);

            return {
                url,
                pageInfo: data.pageInfo,
                timestamp: new Date().toISOString(),
                executiveSummary,
                wcagCompliance,
                issues,
                triagePlan,
                culturalConsiderations,
                prdRequirements,
                rawAxeResults: data.results
            };
        } catch (error) {
            console.error('Error generating report:', error);
            throw error;
        }
    }

    async simulateAnalysis() {
        return new Promise(resolve => {
            setTimeout(resolve, 2000);
        });
    }

    processAxeResults(axeResults) {
        const issues = [];
        
        // Process violations (failures)
        axeResults.violations.forEach(violation => {
            const issue = this.mapAxeViolationToIssue(violation, 'violation');
            issues.push(issue);
        });
        
        // Process incomplete (needs manual review)
        axeResults.incomplete.forEach(incomplete => {
            const issue = this.mapAxeViolationToIssue(incomplete, 'incomplete');
            issues.push(issue);
        });
        
        return issues;
    }
    
    mapAxeViolationToIssue(violation, type) {
        const wcagLevel = this.getWCAGLevel(violation.tags);
        const priority = this.getPriority(violation.impact, type);
        const severity = type === 'violation' ? this.getSeverity(violation.impact) : 'warning';
        
        return {
            id: violation.id,
            title: violation.help,
            description: violation.description,
            wcagLevel: wcagLevel,
            priority: priority,
            severity: severity,
            impact: violation.impact || 'moderate',
            recommendation: violation.help,
            elements: violation.nodes.map(node => node.target.join(' ')),
            effort: this.estimateEffort(violation.nodes.length, violation.impact),
            timeline: this.estimateTimeline(violation.nodes.length, violation.impact),
            helpUrl: violation.helpUrl,
            nodes: violation.nodes.map(node => ({
                target: node.target,
                html: node.html,
                impact: node.impact,
                message: node.any.length > 0 ? node.any[0].message : node.all.length > 0 ? node.all[0].message : ''
            }))
        };
    }
    
    getWCAGLevel(tags) {
        if (tags.includes('wcag2a')) return 'A';
        if (tags.includes('wcag2aa')) return 'AA';
        if (tags.includes('wcag2aaa')) return 'AAA';
        if (tags.includes('wcag21a')) return 'A';
        if (tags.includes('wcag21aa')) return 'AA';
        if (tags.includes('wcag21aaa')) return 'AAA';
        return 'AA'; // Default to AA
    }
    
    getPriority(impact, type) {
        if (type === 'violation') {
            switch (impact) {
                case 'critical': return 'high';
                case 'serious': return 'high';
                case 'moderate': return 'medium';
                case 'minor': return 'low';
                default: return 'medium';
            }
        } else {
            return 'medium'; // incomplete items are medium priority
        }
    }
    
    getSeverity(impact) {
        switch (impact) {
            case 'critical': return 'critical';
            case 'serious': return 'critical';
            case 'moderate': return 'warning';
            case 'minor': return 'info';
            default: return 'warning';
        }
    }
    
    estimateEffort(nodeCount, impact) {
        const baseEffort = {
            'critical': 3,
            'serious': 2,
            'moderate': 1,
            'minor': 1
        };
        
        const effort = (baseEffort[impact] || 1) * Math.min(nodeCount, 5);
        
        if (effort <= 2) return 'Low';
        if (effort <= 4) return 'Medium';
        return 'High';
    }
    
    estimateTimeline(nodeCount, impact) {
        const baseTime = {
            'critical': 2,
            'serious': 1,
            'moderate': 0.5,
            'minor': 0.25
        };
        
        const totalDays = (baseTime[impact] || 0.5) * Math.min(nodeCount, 10);
        
        if (totalDays <= 1) return '1 day';
        if (totalDays <= 3) return '2-3 days';
        if (totalDays <= 7) return '1 week';
        return '1-2 weeks';
    }

    assessWCAGCompliance(issues) {
        const levelA = issues.filter(issue => issue.wcagLevel === 'A');
        const levelAA = issues.filter(issue => issue.wcagLevel === 'AA');
        const levelAAA = issues.filter(issue => issue.wcagLevel === 'AAA');

        return {
            levelA: {
                total: levelA.length,
                critical: levelA.filter(i => i.severity === 'critical').length,
                score: Math.max(0, 100 - (levelA.length * 15))
            },
            levelAA: {
                total: levelAA.length,
                critical: levelAA.filter(i => i.severity === 'critical').length,
                score: Math.max(0, 100 - (levelAA.length * 12))
            },
            levelAAA: {
                total: levelAAA.length,
                critical: levelAAA.filter(i => i.severity === 'critical').length,
                score: Math.max(0, 100 - (levelAAA.length * 10))
            }
        };
    }

    generateTriagePlan(issues) {
        const criticalIssues = issues.filter(i => i.severity === 'critical');
        const warningIssues = issues.filter(i => i.severity === 'warning');

        return {
            immediate: criticalIssues.filter(i => i.priority === 'high'),
            shortTerm: [...criticalIssues.filter(i => i.priority === 'medium'), ...warningIssues.filter(i => i.priority === 'high')],
            longTerm: warningIssues.filter(i => i.priority === 'medium' || i.priority === 'low'),
            estimatedEffort: this.calculateTotalEffort(issues),
            timeline: this.generateTimeline(issues)
        };
    }

    calculateTotalEffort(issues) {
        const effortMap = { 'Low': 1, 'Medium': 3, 'High': 5 };
        return issues.reduce((total, issue) => total + effortMap[issue.effort], 0);
    }

    generateTimeline(issues) {
        return {
            week1: issues.filter(i => i.timeline.includes('day')).length,
            week2: issues.filter(i => i.timeline.includes('week')).length,
            month1: issues.filter(i => i.timeline.includes('month')).length
        };
    }

    generateExecutiveSummary(issues, wcagCompliance) {
        const criticalCount = issues.filter(i => i.severity === 'critical').length;
        const warningCount = issues.filter(i => i.severity === 'warning').length;
        
        return {
            overallScore: Math.round((wcagCompliance.levelA.score + wcagCompliance.levelAA.score) / 2),
            criticalIssues: criticalCount,
            warningIssues: warningCount,
            totalIssues: issues.length,
            keyFindings: [
                'Multiple critical accessibility barriers identified',
                'Color contrast issues affect readability',
                'Keyboard navigation needs improvement',
                'Screen reader compatibility requires attention'
            ],
            businessImpact: [
                'Potential legal compliance risks',
                'Reduced user base accessibility',
                'Negative impact on user experience',
                'SEO implications'
            ],
            recommendations: [
                'Prioritize critical issues for immediate resolution',
                'Implement accessibility testing in development workflow',
                'Train team on WCAG guidelines',
                'Consider accessibility audit for existing products'
            ]
        };
    }

    generateCulturalConsiderations() {
        return {
            language: [
                'Consider right-to-left language support',
                'Provide multiple language options',
                'Use culturally appropriate imagery',
                'Avoid text in images for translation purposes'
            ],
            cultural: [
                'Color meanings vary across cultures',
                'Consider different reading patterns',
                'Respect cultural symbols and imagery',
                'Provide culturally relevant examples'
            ],
            situational: [
                'Design for various lighting conditions',
                'Consider mobile-first approach for developing regions',
                'Account for limited bandwidth scenarios',
                'Support for older assistive technologies'
            ]
        };
    }

    generatePRDRequirements(issues) {
        // Analyze actual issues to generate targeted requirements
        const issueTypes = this.categorizeIssues(issues);
        const requirements = {
            functional: [],
            technical: [],
            testing: [],
            compliance: []
        };

        // Generate functional requirements based on detected issues
        if (issueTypes.keyboardNavigation > 0) {
            requirements.functional.push({
                requirement: `Fix keyboard navigation issues (${issueTypes.keyboardNavigation} violations found)`,
                benefit: 'Enables users who cannot use a mouse to navigate and interact with all functionality',
                userImpact: 'Expands user base to include motor-impaired users and power users who prefer keyboard navigation',
                implementation: `Address specific keyboard issues in: ${this.getElementsForCategory(issues, 'keyboard').join(', ')}`,
                priority: 'Critical',
                affectedElements: issueTypes.keyboardNavigation
            });
        }

        if (issueTypes.colorContrast > 0) {
            requirements.functional.push({
                requirement: `Improve color contrast ratios (${issueTypes.colorContrast} violations found)`,
                benefit: 'Makes content readable for users with visual impairments, color blindness, or viewing in bright conditions',
                userImpact: 'Improves readability for 8% of men and 0.5% of women who have color vision deficiencies',
                implementation: `Fix contrast issues in: ${this.getElementsForCategory(issues, 'color-contrast').join(', ')}`,
                priority: 'High',
                affectedElements: issueTypes.colorContrast
            });
        }

        if (issueTypes.missingAltText > 0) {
            requirements.functional.push({
                requirement: `Add alternative text to images (${issueTypes.missingAltText} violations found)`,
                benefit: 'Allows screen reader users to understand visual content and participate fully in the experience',
                userImpact: 'Makes content accessible to 253 million people worldwide who are visually impaired',
                implementation: `Add descriptive alt text to: ${this.getElementsForCategory(issues, 'image-alt').join(', ')}`,
                priority: 'Critical',
                affectedElements: issueTypes.missingAltText
            });
        }

        if (issueTypes.formLabels > 0) {
            requirements.functional.push({
                requirement: `Fix form labeling issues (${issueTypes.formLabels} violations found)`,
                benefit: 'Reduces user frustration and abandonment by making forms easy to understand and complete',
                userImpact: 'Improves conversion rates and reduces support requests for all users',
                implementation: `Add proper labels to: ${this.getElementsForCategory(issues, 'label').join(', ')}`,
                priority: 'High',
                affectedElements: issueTypes.formLabels
            });
        }

        if (issueTypes.focusIndicators > 0) {
            requirements.functional.push({
                requirement: `Add visible focus indicators (${issueTypes.focusIndicators} violations found)`,
                benefit: 'Shows keyboard users exactly where they are in the interface at all times',
                userImpact: 'Prevents users from getting lost in complex interfaces and enables confident navigation',
                implementation: `Add focus indicators to: ${this.getElementsForCategory(issues, 'focus').join(', ')}`,
                priority: 'Medium',
                affectedElements: issueTypes.focusIndicators
            });
        }

        // Generate technical requirements based on detected issues
        if (issueTypes.headingStructure > 0) {
            requirements.technical.push({
                requirement: `Fix heading hierarchy issues (${issueTypes.headingStructure} violations found)`,
                benefit: 'Creates a logical content outline that users can navigate efficiently',
                userImpact: 'Allows screen reader users to understand content structure and jump between sections',
                implementation: `Restructure headings in: ${this.getElementsForCategory(issues, 'heading').join(', ')}`,
                priority: 'Medium',
                affectedElements: issueTypes.headingStructure
            });
        }

        if (issueTypes.ariaIssues > 0) {
            requirements.technical.push({
                requirement: `Fix ARIA implementation issues (${issueTypes.ariaIssues} violations found)`,
                benefit: 'Provides context and meaning for complex interactive components',
                userImpact: 'Makes custom UI components understandable to assistive technology users',
                implementation: `Fix ARIA issues in: ${this.getElementsForCategory(issues, 'aria').join(', ')}`,
                priority: 'High',
                affectedElements: issueTypes.ariaIssues
            });
        }

        if (issueTypes.landmarks > 0) {
            requirements.technical.push({
                requirement: `Add semantic landmarks (${issueTypes.landmarks} violations found)`,
                benefit: 'Creates a logical document structure that assistive technologies can navigate efficiently',
                userImpact: 'Enables screen reader users to quickly jump to relevant sections and understand page structure',
                implementation: `Add landmarks to: ${this.getElementsForCategory(issues, 'landmark').join(', ')}`,
                priority: 'Medium',
                affectedElements: issueTypes.landmarks
            });
        }

        // Generate testing requirements based on issue severity
        const criticalIssues = issues.filter(i => i.severity === 'critical').length;
        const totalIssues = issues.length;

        if (criticalIssues > 0) {
            requirements.testing.push({
                requirement: `Implement automated accessibility testing (${criticalIssues} critical issues detected)`,
                benefit: 'Catches accessibility issues early in development, reducing remediation costs',
                userImpact: 'Ensures consistent accessibility quality without manual oversight',
                implementation: `Set up axe-core testing to catch issues like those found in this audit`,
                priority: 'Critical',
                affectedElements: criticalIssues
            });
        }

        if (totalIssues > 5) {
            requirements.testing.push({
                requirement: `Establish manual testing protocols (${totalIssues} total issues found)`,
                benefit: 'Validates that automated tools cannot detect - real user experience quality',
                userImpact: 'Ensures the interface actually works well for assistive technology users',
                implementation: `Focus testing on areas with highest violation density: ${this.getTopProblemAreas(issues)}`,
                priority: 'High',
                affectedElements: totalIssues
            });
        }

        // Generate compliance requirements based on violation patterns
        const wcagLevels = this.getWCAGLevelBreakdown(issues);
        
        requirements.compliance.push({
            requirement: `Achieve WCAG 2.1 AA compliance (${wcagLevels.A + wcagLevels.AA} violations currently failing)`,
            benefit: 'Meets international accessibility standards and legal requirements',
            userImpact: 'Ensures broad accessibility coverage and reduces legal compliance risk',
            implementation: `Prioritize fixing ${wcagLevels.A} Level A violations and ${wcagLevels.AA} Level AA violations`,
            priority: 'Critical',
            affectedElements: wcagLevels.A + wcagLevels.AA
        });

        if (totalIssues > 10) {
            requirements.compliance.push({
                requirement: `Establish accessibility governance process (${totalIssues} issues indicate systemic problems)`,
                benefit: 'Maintains accessibility quality as the product evolves',
                userImpact: 'Ensures long-term usability and prevents regression of accessibility features',
                implementation: `Create accessibility checklist, training, and regular audit schedule`,
                priority: 'High',
                affectedElements: totalIssues
            });
        }

        return requirements;
    }

    categorizeIssues(issues) {
        const categories = {
            keyboardNavigation: 0,
            colorContrast: 0,
            missingAltText: 0,
            formLabels: 0,
            focusIndicators: 0,
            headingStructure: 0,
            ariaIssues: 0,
            landmarks: 0
        };

        issues.forEach(issue => {
            if (issue.id.includes('keyboard') || issue.id.includes('tabindex') || issue.id.includes('focus')) {
                categories.keyboardNavigation++;
            }
            if (issue.id.includes('color-contrast')) {
                categories.colorContrast++;
            }
            if (issue.id.includes('image-alt') || issue.id.includes('alt-text')) {
                categories.missingAltText++;
            }
            if (issue.id.includes('label') || issue.id.includes('form')) {
                categories.formLabels++;
            }
            if (issue.id.includes('focus-order') || issue.id.includes('focus-visible')) {
                categories.focusIndicators++;
            }
            if (issue.id.includes('heading') || issue.id.includes('h1') || issue.id.includes('h2')) {
                categories.headingStructure++;
            }
            if (issue.id.includes('aria') || issue.id.includes('role')) {
                categories.ariaIssues++;
            }
            if (issue.id.includes('landmark') || issue.id.includes('region')) {
                categories.landmarks++;
            }
        });

        return categories;
    }

    getElementsForCategory(issues, category) {
        const categoryKeywords = {
            'keyboard': ['keyboard', 'tabindex', 'focus'],
            'color-contrast': ['color-contrast'],
            'image-alt': ['image-alt', 'alt-text'],
            'label': ['label', 'form'],
            'focus': ['focus-order', 'focus-visible'],
            'heading': ['heading', 'h1', 'h2'],
            'aria': ['aria', 'role'],
            'landmark': ['landmark', 'region']
        };

        const keywords = categoryKeywords[category] || [];
        const relevantIssues = issues.filter(issue => 
            keywords.some(keyword => issue.id.includes(keyword))
        );

        return relevantIssues.slice(0, 3).map(issue => 
            issue.elements.length > 0 ? issue.elements[0] : issue.id
        );
    }

    getTopProblemAreas(issues) {
        const areas = {};
        issues.forEach(issue => {
            if (issue.elements && issue.elements.length > 0) {
                issue.elements.forEach(element => {
                    const selector = element.split(' ')[0]; // Get main selector
                    areas[selector] = (areas[selector] || 0) + 1;
                });
            }
        });

        return Object.entries(areas)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([selector, count]) => `${selector} (${count} issues)`)
            .join(', ');
    }

    getWCAGLevelBreakdown(issues) {
        const breakdown = { A: 0, AA: 0, AAA: 0 };
        issues.forEach(issue => {
            if (issue.wcagLevel === 'A') breakdown.A++;
            else if (issue.wcagLevel === 'AA') breakdown.AA++;
            else if (issue.wcagLevel === 'AAA') breakdown.AAA++;
        });
        return breakdown;
    }

    displayReport(report) {
        this.currentReport = report; // Store for export functions
        this.reportContent.innerHTML = this.generateReportHTML(report);
        this.reportSection.style.display = 'block';
        this.reportSection.scrollIntoView({ behavior: 'smooth' });
        this.setupNavigation();
    }

    setupNavigation() {
        // Add smooth scrolling to navigation links
        const navLinks = document.querySelectorAll('.nav-links a');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Add export functionality to each section
        this.setupExportButtons();
    }

    setupExportButtons() {
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            const exportButton = document.createElement('button');
            exportButton.className = 'export-button';
            exportButton.innerHTML = '📋 Copy Section';
            exportButton.title = 'Copy formatted content for use in Google Slides, PowerPoint, etc.';
            
            const sectionTitle = section.querySelector('.section-title');
            if (sectionTitle) {
                sectionTitle.appendChild(exportButton);
            }
            
            exportButton.addEventListener('click', () => {
                this.exportSection(section);
            });
        });
    }

    async exportSection(section) {
        const sectionId = section.id;
        let richTextContent = '';
        let plainTextContent = '';

        switch (sectionId) {
            case 'executive-summary':
                richTextContent = this.generateExecutiveSummaryExport();
                plainTextContent = this.generateExecutiveSummaryPlainText();
                break;
            case 'wcag-compliance':
                richTextContent = this.generateWCAGComplianceExport();
                plainTextContent = this.generateWCAGCompliancePlainText();
                break;
            case 'detailed-issues':
                richTextContent = this.generateDetailedIssuesExport();
                plainTextContent = this.generateDetailedIssuesPlainText();
                break;
            case 'triage-plan':
                richTextContent = this.generateTriagePlanExport();
                plainTextContent = this.generateTriagePlanPlainText();
                break;
            case 'cultural-accessibility':
                richTextContent = this.generateCulturalAccessibilityExport();
                plainTextContent = this.generateCulturalAccessibilityPlainText();
                break;
            case 'prd-requirements':
                richTextContent = this.generatePRDRequirementsExport();
                plainTextContent = this.generatePRDRequirementsPlainText();
                break;
        }

        try {
            // Create a rich text blob for clipboard
            const htmlBlob = new Blob([richTextContent], { type: 'text/html' });
            const plainBlob = new Blob([plainTextContent], { type: 'text/plain' });
            
            const clipboardItem = new ClipboardItem({
                'text/html': htmlBlob,
                'text/plain': plainBlob
            });
            
            await navigator.clipboard.write([clipboardItem]);
            
            // Show success feedback
            this.showCopySuccess(section.querySelector('.export-button'));
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            // Fallback to plain text
            await navigator.clipboard.writeText(plainTextContent);
            this.showCopySuccess(section.querySelector('.export-button'));
        }
    }

    showCopySuccess(button) {
        const originalText = button.innerHTML;
        button.innerHTML = '✅ Copied!';
        button.style.background = 'var(--success)';
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.background = '';
        }, 2000);
    }

    generateReportHTML(report) {
        return `
            <div class="report-header">
                <h2 class="report-title">Accessibility Audit Report</h2>
                <p class="report-subtitle">URL: ${report.url}</p>
                <p class="report-subtitle">Page Title: ${report.pageInfo?.title || 'N/A'}</p>
                <p class="report-subtitle">Generated: ${new Date(report.timestamp).toLocaleDateString()}</p>
            </div>

            <nav class="report-navigation">
                <h3>Quick Navigation</h3>
                <ul class="nav-links">
                    <li><a href="#executive-summary"><span class="nav-icon">📊</span>Executive Summary</a></li>
                    <li><a href="#wcag-compliance"><span class="nav-icon">✅</span>WCAG Compliance</a></li>
                    <li><a href="#detailed-issues"><span class="nav-icon">🔍</span>Detailed Issues</a></li>
                    <li><a href="#triage-plan"><span class="nav-icon">📋</span>Triage Plan</a></li>
                    <li><a href="#cultural-accessibility"><span class="nav-icon">🌍</span>Cultural & Situational</a></li>
                    <li><a href="#prd-requirements"><span class="nav-icon">📝</span>PRD Requirements</a></li>
                </ul>
            </nav>

            <div class="section" id="executive-summary">
                <h3 class="section-title">Executive Summary</h3>
                
                <div class="summary-dashboard">
                    <div class="score-card">
                        <div class="score-circle ${this.getScoreClass(report.executiveSummary.overallScore)}">
                            <span class="score-number">${report.executiveSummary.overallScore}</span>
                            <span class="score-label">/100</span>
                        </div>
                        <h4>Overall Accessibility Score</h4>
                    </div>
                    
                    <div class="summary-metrics">
                        <div class="metric-card critical">
                            <div class="metric-number">${report.executiveSummary.criticalIssues}</div>
                            <div class="metric-label">Critical Issues</div>
                        </div>
                        <div class="metric-card warning">
                            <div class="metric-number">${report.executiveSummary.warningIssues}</div>
                            <div class="metric-label">Warning Issues</div>
                        </div>
                        <div class="metric-card total">
                            <div class="metric-number">${report.executiveSummary.totalIssues}</div>
                            <div class="metric-label">Total Issues</div>
                        </div>
                    </div>
                </div>

                <div class="summary-sections">
                    <div class="summary-section">
                        <h4>Key Findings</h4>
                        <ul>
                            ${report.executiveSummary.keyFindings.map(finding => `<li>${finding}</li>`).join('')}
                        </ul>
                    </div>

                    <div class="summary-section">
                        <h4>Business Impact</h4>
                        <ul>
                            ${report.executiveSummary.businessImpact.map(impact => `<li>${impact}</li>`).join('')}
                        </ul>
                    </div>

                    <div class="summary-section">
                        <h4>Immediate Actions Required</h4>
                        <ul>
                            ${report.executiveSummary.recommendations.slice(0, 3).map(rec => `<li>${rec}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>

            <div class="section" id="wcag-compliance">
                <h3 class="section-title">WCAG Compliance Assessment</h3>
                <div class="wcag-assessment">
                    <div class="wcag-level">
                        <h4><span class="wcag-level wcag-a">WCAG A</span> Score: ${report.wcagCompliance.levelA.score}/100</h4>
                        <p>Issues: ${report.wcagCompliance.levelA.total} (${report.wcagCompliance.levelA.critical} critical)</p>
                    </div>
                    <div class="wcag-level">
                        <h4><span class="wcag-level wcag-aa">WCAG AA</span> Score: ${report.wcagCompliance.levelAA.score}/100</h4>
                        <p>Issues: ${report.wcagCompliance.levelAA.total} (${report.wcagCompliance.levelAA.critical} critical)</p>
                    </div>
                    <div class="wcag-level">
                        <h4><span class="wcag-level wcag-aaa">WCAG AAA</span> Score: ${report.wcagCompliance.levelAAA.score}/100</h4>
                        <p>Issues: ${report.wcagCompliance.levelAAA.total} (${report.wcagCompliance.levelAAA.critical} critical)</p>
                    </div>
                </div>
            </div>

            <div class="section" id="detailed-issues">
                <h3 class="section-title">Detailed Issues</h3>
                ${report.issues.map(issue => `
                    <div class="issue-item issue-${issue.severity}">
                        <h4>${issue.title} <span class="wcag-level wcag-${issue.wcagLevel.toLowerCase()}">${issue.wcagLevel}</span></h4>
                        <p><strong>Priority:</strong> <span class="priority-${issue.priority}">${issue.priority}</span></p>
                        <p><strong>Description:</strong> ${issue.description}</p>
                        <p><strong>Impact:</strong> ${issue.impact}</p>
                        <p><strong>Affected Elements:</strong> ${issue.elements.slice(0, 3).join(', ')}${issue.elements.length > 3 ? ` (+${issue.elements.length - 3} more)` : ''}</p>
                        <p><strong>Effort:</strong> ${issue.effort} | <strong>Timeline:</strong> ${issue.timeline}</p>
                        <div class="recommendation">
                            <strong>Recommendation:</strong> ${issue.recommendation}
                            ${issue.helpUrl ? `<br><a href="${issue.helpUrl}" target="_blank">Learn more</a>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="section" id="triage-plan">
                <h3 class="section-title">Triage Plan</h3>
                <h4>Immediate Actions (Critical Priority)</h4>
                <ul>
                    ${report.triagePlan.immediate.map(issue => `<li>${issue.title} - ${issue.timeline}</li>`).join('')}
                </ul>
                
                <h4>Short-term Actions (1-2 weeks)</h4>
                <ul>
                    ${report.triagePlan.shortTerm.map(issue => `<li>${issue.title} - ${issue.timeline}</li>`).join('')}
                </ul>
                
                <h4>Long-term Actions (1+ months)</h4>
                <ul>
                    ${report.triagePlan.longTerm.map(issue => `<li>${issue.title} - ${issue.timeline}</li>`).join('')}
                </ul>
                
                <p><strong>Estimated Total Effort:</strong> ${report.triagePlan.estimatedEffort} story points</p>
            </div>

            <div class="section" id="cultural-accessibility">
                <h3 class="section-title">Cultural & Situational Accessibility</h3>
                
                <h4>Language & Localization</h4>
                <ul>
                    ${report.culturalConsiderations.language.map(item => `<li>${item}</li>`).join('')}
                </ul>
                
                <h4>Cultural Considerations</h4>
                <div class="cultural-note">
                    <ul>
                        ${report.culturalConsiderations.cultural.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
                
                <h4>Situational Accessibility</h4>
                <ul>
                    ${report.culturalConsiderations.situational.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>

            <div class="section" id="prd-requirements">
                <h3 class="section-title">Product Requirements for PRD</h3>
                
                <h4>Functional Requirements</h4>
                <div class="requirements-grid">
                    ${report.prdRequirements.functional.map(req => `
                        <div class="requirement-card">
                            <h5 class="requirement-title">${req.requirement}</h5>
                            <div class="requirement-details">
                                <div class="benefit-section">
                                    <strong>💡 Why this matters:</strong>
                                    <p>${req.benefit}</p>
                                </div>
                                <div class="impact-section">
                                    <strong>📊 User Impact:</strong>
                                    <p>${req.userImpact}</p>
                                </div>
                                <div class="implementation-section">
                                    <strong>🔧 Implementation:</strong>
                                    <p>${req.implementation}</p>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <h4>Technical Requirements</h4>
                <div class="requirements-grid">
                    ${report.prdRequirements.technical.map(req => `
                        <div class="requirement-card">
                            <h5 class="requirement-title">${req.requirement}</h5>
                            <div class="requirement-details">
                                <div class="benefit-section">
                                    <strong>💡 Why this matters:</strong>
                                    <p>${req.benefit}</p>
                                </div>
                                <div class="impact-section">
                                    <strong>📊 User Impact:</strong>
                                    <p>${req.userImpact}</p>
                                </div>
                                <div class="implementation-section">
                                    <strong>🔧 Implementation:</strong>
                                    <p>${req.implementation}</p>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <h4>Testing Requirements</h4>
                <div class="requirements-grid">
                    ${report.prdRequirements.testing.map(req => `
                        <div class="requirement-card">
                            <h5 class="requirement-title">${req.requirement}</h5>
                            <div class="requirement-details">
                                <div class="benefit-section">
                                    <strong>💡 Why this matters:</strong>
                                    <p>${req.benefit}</p>
                                </div>
                                <div class="impact-section">
                                    <strong>📊 User Impact:</strong>
                                    <p>${req.userImpact}</p>
                                </div>
                                <div class="implementation-section">
                                    <strong>🔧 Implementation:</strong>
                                    <p>${req.implementation}</p>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <h4>Compliance Requirements</h4>
                <div class="requirements-grid">
                    ${report.prdRequirements.compliance.map(req => `
                        <div class="requirement-card">
                            <h5 class="requirement-title">${req.requirement}</h5>
                            <div class="requirement-details">
                                <div class="benefit-section">
                                    <strong>💡 Why this matters:</strong>
                                    <p>${req.benefit}</p>
                                </div>
                                <div class="impact-section">
                                    <strong>📊 User Impact:</strong>
                                    <p>${req.userImpact}</p>
                                </div>
                                <div class="implementation-section">
                                    <strong>🔧 Implementation:</strong>
                                    <p>${req.implementation}</p>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Export functions for each section
    generateExecutiveSummaryExport() {
        const report = this.currentReport;
        return `
            <h2>Executive Summary - Accessibility Audit</h2>
            <p><strong>URL:</strong> ${report.url}</p>
            <p><strong>Generated:</strong> ${new Date(report.timestamp).toLocaleDateString()}</p>
            
            <h3>Key Metrics</h3>
            <ul>
                <li><strong>Overall Accessibility Score:</strong> ${report.executiveSummary.overallScore}/100</li>
                <li><strong>Critical Issues:</strong> ${report.executiveSummary.criticalIssues}</li>
                <li><strong>Warning Issues:</strong> ${report.executiveSummary.warningIssues}</li>
                <li><strong>Total Issues:</strong> ${report.executiveSummary.totalIssues}</li>
            </ul>
            
            <h3>Key Findings</h3>
            <ul>
                ${report.executiveSummary.keyFindings.map(finding => `<li>${finding}</li>`).join('')}
            </ul>
            
            <h3>Business Impact</h3>
            <ul>
                ${report.executiveSummary.businessImpact.map(impact => `<li>${impact}</li>`).join('')}
            </ul>
            
            <h3>Immediate Actions Required</h3>
            <ul>
                ${report.executiveSummary.recommendations.slice(0, 3).map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        `;
    }

    generateExecutiveSummaryPlainText() {
        const report = this.currentReport;
        return `Executive Summary - Accessibility Audit
URL: ${report.url}
Generated: ${new Date(report.timestamp).toLocaleDateString()}

Key Metrics:
• Overall Accessibility Score: ${report.executiveSummary.overallScore}/100
• Critical Issues: ${report.executiveSummary.criticalIssues}
• Warning Issues: ${report.executiveSummary.warningIssues}
• Total Issues: ${report.executiveSummary.totalIssues}

Key Findings:
${report.executiveSummary.keyFindings.map(finding => `• ${finding}`).join('\n')}

Business Impact:
${report.executiveSummary.businessImpact.map(impact => `• ${impact}`).join('\n')}

Immediate Actions Required:
${report.executiveSummary.recommendations.slice(0, 3).map(rec => `• ${rec}`).join('\n')}`;
    }

    generateWCAGComplianceExport() {
        const report = this.currentReport;
        return `
            <h2>WCAG Compliance Assessment</h2>
            
            <h3>WCAG Level A</h3>
            <p><strong>Score:</strong> ${report.wcagCompliance.levelA.score}/100</p>
            <p><strong>Issues:</strong> ${report.wcagCompliance.levelA.total} (${report.wcagCompliance.levelA.critical} critical)</p>
            
            <h3>WCAG Level AA</h3>
            <p><strong>Score:</strong> ${report.wcagCompliance.levelAA.score}/100</p>
            <p><strong>Issues:</strong> ${report.wcagCompliance.levelAA.total} (${report.wcagCompliance.levelAA.critical} critical)</p>
            
            <h3>WCAG Level AAA</h3>
            <p><strong>Score:</strong> ${report.wcagCompliance.levelAAA.score}/100</p>
            <p><strong>Issues:</strong> ${report.wcagCompliance.levelAAA.total} (${report.wcagCompliance.levelAAA.critical} critical)</p>
        `;
    }

    generateWCAGCompliancePlainText() {
        const report = this.currentReport;
        return `WCAG Compliance Assessment

WCAG Level A
Score: ${report.wcagCompliance.levelA.score}/100
Issues: ${report.wcagCompliance.levelA.total} (${report.wcagCompliance.levelA.critical} critical)

WCAG Level AA
Score: ${report.wcagCompliance.levelAA.score}/100
Issues: ${report.wcagCompliance.levelAA.total} (${report.wcagCompliance.levelAA.critical} critical)

WCAG Level AAA
Score: ${report.wcagCompliance.levelAAA.score}/100
Issues: ${report.wcagCompliance.levelAAA.total} (${report.wcagCompliance.levelAAA.critical} critical)`;
    }

    generateDetailedIssuesExport() {
        const report = this.currentReport;
        return `
            <h2>Detailed Issues</h2>
            ${report.issues.map(issue => `
                <div style="margin-bottom: 20px; padding: 15px; border-left: 4px solid #ccc;">
                    <h3>${issue.title} (${issue.wcagLevel})</h3>
                    <p><strong>Priority:</strong> ${issue.priority}</p>
                    <p><strong>Description:</strong> ${issue.description}</p>
                    <p><strong>Impact:</strong> ${issue.impact}</p>
                    <p><strong>Affected Elements:</strong> ${issue.elements.slice(0, 3).join(', ')}</p>
                    <p><strong>Effort:</strong> ${issue.effort} | <strong>Timeline:</strong> ${issue.timeline}</p>
                    <p><strong>Recommendation:</strong> ${issue.recommendation}</p>
                </div>
            `).join('')}
        `;
    }

    generateDetailedIssuesPlainText() {
        const report = this.currentReport;
        return `Detailed Issues

${report.issues.map(issue => `${issue.title} (${issue.wcagLevel})
Priority: ${issue.priority}
Description: ${issue.description}
Impact: ${issue.impact}
Affected Elements: ${issue.elements.slice(0, 3).join(', ')}
Effort: ${issue.effort} | Timeline: ${issue.timeline}
Recommendation: ${issue.recommendation}

`).join('')}`;
    }

    generateTriagePlanExport() {
        const report = this.currentReport;
        return `
            <h2>Triage Plan</h2>
            
            <h3>Immediate Actions (Critical Priority)</h3>
            <ul>
                ${report.triagePlan.immediate.map(issue => `<li>${issue.title} - ${issue.timeline}</li>`).join('')}
            </ul>
            
            <h3>Short-term Actions (1-2 weeks)</h3>
            <ul>
                ${report.triagePlan.shortTerm.map(issue => `<li>${issue.title} - ${issue.timeline}</li>`).join('')}
            </ul>
            
            <h3>Long-term Actions (1+ months)</h3>
            <ul>
                ${report.triagePlan.longTerm.map(issue => `<li>${issue.title} - ${issue.timeline}</li>`).join('')}
            </ul>
            
            <p><strong>Estimated Total Effort:</strong> ${report.triagePlan.estimatedEffort} story points</p>
        `;
    }

    generateTriagePlanPlainText() {
        const report = this.currentReport;
        return `Triage Plan

Immediate Actions (Critical Priority):
${report.triagePlan.immediate.map(issue => `• ${issue.title} - ${issue.timeline}`).join('\n')}

Short-term Actions (1-2 weeks):
${report.triagePlan.shortTerm.map(issue => `• ${issue.title} - ${issue.timeline}`).join('\n')}

Long-term Actions (1+ months):
${report.triagePlan.longTerm.map(issue => `• ${issue.title} - ${issue.timeline}`).join('\n')}

Estimated Total Effort: ${report.triagePlan.estimatedEffort} story points`;
    }

    generateCulturalAccessibilityExport() {
        const report = this.currentReport;
        return `
            <h2>Cultural & Situational Accessibility</h2>
            
            <h3>Language & Localization</h3>
            <ul>
                ${report.culturalConsiderations.language.map(item => `<li>${item}</li>`).join('')}
            </ul>
            
            <h3>Cultural Considerations</h3>
            <ul>
                ${report.culturalConsiderations.cultural.map(item => `<li>${item}</li>`).join('')}
            </ul>
            
            <h3>Situational Accessibility</h3>
            <ul>
                ${report.culturalConsiderations.situational.map(item => `<li>${item}</li>`).join('')}
            </ul>
        `;
    }

    generateCulturalAccessibilityPlainText() {
        const report = this.currentReport;
        return `Cultural & Situational Accessibility

Language & Localization:
${report.culturalConsiderations.language.map(item => `• ${item}`).join('\n')}

Cultural Considerations:
${report.culturalConsiderations.cultural.map(item => `• ${item}`).join('\n')}

Situational Accessibility:
${report.culturalConsiderations.situational.map(item => `• ${item}`).join('\n')}`;
    }

    generatePRDRequirementsExport() {
        const report = this.currentReport;
        return `
            <h2>Product Requirements for PRD</h2>
            
            <h3>Functional Requirements</h3>
            ${report.prdRequirements.functional.map(req => `
                <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd;">
                    <h4>${req.requirement}</h4>
                    <p><strong>Why this matters:</strong> ${req.benefit}</p>
                    <p><strong>User Impact:</strong> ${req.userImpact}</p>
                    <p><strong>Implementation:</strong> ${req.implementation}</p>
                    <p><strong>Priority:</strong> ${req.priority} | <strong>Affected Elements:</strong> ${req.affectedElements}</p>
                </div>
            `).join('')}
            
            <h3>Technical Requirements</h3>
            ${report.prdRequirements.technical.map(req => `
                <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd;">
                    <h4>${req.requirement}</h4>
                    <p><strong>Why this matters:</strong> ${req.benefit}</p>
                    <p><strong>User Impact:</strong> ${req.userImpact}</p>
                    <p><strong>Implementation:</strong> ${req.implementation}</p>
                    <p><strong>Priority:</strong> ${req.priority} | <strong>Affected Elements:</strong> ${req.affectedElements}</p>
                </div>
            `).join('')}
            
            <h3>Testing Requirements</h3>
            ${report.prdRequirements.testing.map(req => `
                <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd;">
                    <h4>${req.requirement}</h4>
                    <p><strong>Why this matters:</strong> ${req.benefit}</p>
                    <p><strong>User Impact:</strong> ${req.userImpact}</p>
                    <p><strong>Implementation:</strong> ${req.implementation}</p>
                    <p><strong>Priority:</strong> ${req.priority} | <strong>Affected Elements:</strong> ${req.affectedElements}</p>
                </div>
            `).join('')}
            
            <h3>Compliance Requirements</h3>
            ${report.prdRequirements.compliance.map(req => `
                <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd;">
                    <h4>${req.requirement}</h4>
                    <p><strong>Why this matters:</strong> ${req.benefit}</p>
                    <p><strong>User Impact:</strong> ${req.userImpact}</p>
                    <p><strong>Implementation:</strong> ${req.implementation}</p>
                    <p><strong>Priority:</strong> ${req.priority} | <strong>Affected Elements:</strong> ${req.affectedElements}</p>
                </div>
            `).join('')}
        `;
    }

    generatePRDRequirementsPlainText() {
        const report = this.currentReport;
        let content = 'Product Requirements for PRD\n\n';
        
        content += 'Functional Requirements:\n';
        report.prdRequirements.functional.forEach(req => {
            content += `\n${req.requirement}\n`;
            content += `Why this matters: ${req.benefit}\n`;
            content += `User Impact: ${req.userImpact}\n`;
            content += `Implementation: ${req.implementation}\n`;
            content += `Priority: ${req.priority} | Affected Elements: ${req.affectedElements}\n`;
        });
        
        content += '\nTechnical Requirements:\n';
        report.prdRequirements.technical.forEach(req => {
            content += `\n${req.requirement}\n`;
            content += `Why this matters: ${req.benefit}\n`;
            content += `User Impact: ${req.userImpact}\n`;
            content += `Implementation: ${req.implementation}\n`;
            content += `Priority: ${req.priority} | Affected Elements: ${req.affectedElements}\n`;
        });
        
        content += '\nTesting Requirements:\n';
        report.prdRequirements.testing.forEach(req => {
            content += `\n${req.requirement}\n`;
            content += `Why this matters: ${req.benefit}\n`;
            content += `User Impact: ${req.userImpact}\n`;
            content += `Implementation: ${req.implementation}\n`;
            content += `Priority: ${req.priority} | Affected Elements: ${req.affectedElements}\n`;
        });
        
        content += '\nCompliance Requirements:\n';
        report.prdRequirements.compliance.forEach(req => {
            content += `\n${req.requirement}\n`;
            content += `Why this matters: ${req.benefit}\n`;
            content += `User Impact: ${req.userImpact}\n`;
            content += `Implementation: ${req.implementation}\n`;
            content += `Priority: ${req.priority} | Affected Elements: ${req.affectedElements}\n`;
        });
        
        return content;
    }

    getScoreClass(score) {
        if (score >= 80) return 'score-good';
        if (score >= 60) return 'score-fair';
        return 'score-poor';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AccessibilityAuditor();
});