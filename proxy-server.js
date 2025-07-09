const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const path = require('path');
const { Anthropic } = require('@anthropic-ai/sdk');

const app = express();
const PORT = 3000;

// Initialize Claude API client
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || 'your-api-key-here'
});

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Proxy endpoint to fetch and analyze URLs
app.post('/analyze', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    let browser;
    try {
        // Launch Puppeteer browser
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Set user agent to avoid bot detection
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        // Navigate to the URL
        await page.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Inject axe-core
        await page.addScriptTag({
            url: 'https://unpkg.com/axe-core@4.8.2/axe.min.js'
        });

        // Run axe accessibility scan
        const results = await page.evaluate(async () => {
            return await axe.run();
        });

        // Get page title and meta info
        const pageInfo = await page.evaluate(() => {
            return {
                title: document.title,
                url: window.location.href,
                description: document.querySelector('meta[name="description"]')?.content || '',
                viewport: document.querySelector('meta[name="viewport"]')?.content || ''
            };
        });

        res.json({
            success: true,
            pageInfo,
            results
        });

    } catch (error) {
        console.error('Error analyzing URL:', error);
        res.status(500).json({ 
            error: 'Failed to analyze URL',
            details: error.message 
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

// New endpoint to generate PRD requirements using Claude AI
app.post('/generate-prd-requirements', async (req, res) => {
    const { issues, wcagCompliance, url } = req.body;
    
    if (!issues || !wcagCompliance) {
        return res.status(400).json({ error: 'Issues and WCAG compliance data are required' });
    }

    try {
        // Prepare the WCAG analysis data for Claude
        const analysisData = {
            url: url,
            totalIssues: issues.length,
            criticalIssues: issues.filter(i => i.severity === 'critical').length,
            warningIssues: issues.filter(i => i.severity === 'warning').length,
            wcagCompliance: wcagCompliance,
            issuesByCategory: categorizeIssuesForAI(issues),
            topIssues: issues.slice(0, 10).map(issue => ({
                id: issue.id,
                title: issue.title,
                description: issue.description,
                wcagLevel: issue.wcagLevel,
                priority: issue.priority,
                severity: issue.severity,
                impact: issue.impact,
                elements: issue.elements.slice(0, 3),
                effort: issue.effort,
                timeline: issue.timeline
            }))
        };

        // Generate PRD requirements using Claude
        const prdRequirements = await generatePRDRequirementsWithClaude(analysisData);
        
        res.json({
            success: true,
            prdRequirements
        });

    } catch (error) {
        console.error('Error generating PRD requirements:', error);
        res.status(500).json({ 
            error: 'Failed to generate PRD requirements',
            details: error.message 
        });
    }
});

// Helper function to categorize issues for AI processing
function categorizeIssuesForAI(issues) {
    const categories = {
        keyboardNavigation: [],
        colorContrast: [],
        missingAltText: [],
        formLabels: [],
        focusIndicators: [],
        headingStructure: [],
        ariaIssues: [],
        landmarks: []
    };

    issues.forEach(issue => {
        if (issue.id.includes('keyboard') || issue.id.includes('tabindex') || issue.id.includes('focus')) {
            categories.keyboardNavigation.push(issue);
        }
        if (issue.id.includes('color-contrast')) {
            categories.colorContrast.push(issue);
        }
        if (issue.id.includes('image-alt') || issue.id.includes('alt-text')) {
            categories.missingAltText.push(issue);
        }
        if (issue.id.includes('label') || issue.id.includes('form')) {
            categories.formLabels.push(issue);
        }
        if (issue.id.includes('focus-order') || issue.id.includes('focus-visible')) {
            categories.focusIndicators.push(issue);
        }
        if (issue.id.includes('heading') || issue.id.includes('h1') || issue.id.includes('h2')) {
            categories.headingStructure.push(issue);
        }
        if (issue.id.includes('aria') || issue.id.includes('role')) {
            categories.ariaIssues.push(issue);
        }
        if (issue.id.includes('landmark') || issue.id.includes('region')) {
            categories.landmarks.push(issue);
        }
    });

    return categories;
}

// Function to generate PRD requirements using Claude AI
async function generatePRDRequirementsWithClaude(analysisData) {
    const prompt = `You are an expert UX accessibility consultant helping to create Product Requirements Document (PRD) requirements based on WCAG accessibility analysis results.

Based on the following accessibility analysis of a web application, generate specific, actionable PRD requirements:

**Analysis Summary:**
- URL: ${analysisData.url}
- Total Issues: ${analysisData.totalIssues}
- Critical Issues: ${analysisData.criticalIssues}
- Warning Issues: ${analysisData.warningIssues}
- WCAG Level A Score: ${analysisData.wcagCompliance.levelA.score}/100
- WCAG Level AA Score: ${analysisData.wcagCompliance.levelAA.score}/100

**Issue Categories:**
${Object.entries(analysisData.issuesByCategory).map(([category, issues]) => 
    `- ${category}: ${issues.length} issues`
).join('\n')}

**Top Priority Issues:**
${analysisData.topIssues.map(issue => 
    `- ${issue.title} (${issue.wcagLevel}, ${issue.priority} priority, ${issue.severity} severity)`
).join('\n')}

Please generate comprehensive PRD requirements in the following categories:
1. **Functional Requirements** - User-facing features and behaviors
2. **Technical Requirements** - Implementation specifications
3. **Testing Requirements** - Quality assurance and validation
4. **Compliance Requirements** - Legal and standards compliance

For each requirement, provide:
- **requirement**: Clear, actionable requirement statement
- **benefit**: Why this requirement matters for users
- **userImpact**: Specific impact on user experience and accessibility
- **implementation**: How to implement this requirement
- **priority**: Critical, High, Medium, or Low
- **affectedElements**: Number of elements that need to be addressed

Focus on:
- Specific actionable requirements based on the actual issues found
- Clear business value and user impact
- Practical implementation guidance
- Prioritization based on WCAG compliance levels and user impact

Return the response as a JSON object with the structure:
{
  "functional": [...],
  "technical": [...],
  "testing": [...],
  "compliance": [...]
}

Each requirement should be an object with the fields mentioned above.`;

    try {
        const response = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4000,
            temperature: 0.3,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        });

        const content = response.content[0].text;
        
        // Extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        } else {
            throw new Error('No valid JSON found in Claude response');
        }
    } catch (error) {
        console.error('Error calling Claude API:', error);
        // Fallback to a basic structure if Claude API fails
        return {
            functional: [{
                requirement: "Address accessibility issues found in analysis",
                benefit: "Improves user experience for users with disabilities",
                userImpact: "Makes the application accessible to a broader user base",
                implementation: "Fix issues identified in the accessibility audit",
                priority: "High",
                affectedElements: analysisData.totalIssues
            }],
            technical: [],
            testing: [],
            compliance: []
        };
    }
}

app.listen(PORT, () => {
    console.log(`Accessibility analyzer server running on http://localhost:${PORT}`);
});