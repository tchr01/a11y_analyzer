# A11y Audit Pro

A comprehensive accessibility audit tool for UX designers that generates detailed accessibility reports with WCAG compliance analysis, triage plans, and AI-powered product requirements. Features real axe-core scanning, Claude AI integration, and rich text export capabilities.

## ✨ Features

- **Real Accessibility Scanning**: Uses axe-core to perform actual accessibility analysis on live websites
- **WCAG Compliance Assessment**: Evaluates compliance with WCAG A, AA, and AAA standards
- **AI-Powered PRD Generation**: Uses Claude AI to create specific, actionable product requirements based on actual scan results
- **Rich Text Export**: Copy formatted content directly to Google Slides, PowerPoint, Jira, etc.
- **Executive Summaries**: Business-focused reports with key findings and recommendations
- **Detailed Triage Plans**: Prioritizes issues by severity and impact with timelines
- **Cultural & Situational A11y**: Addresses diverse user needs and contexts
- **Designer-Focused UI**: Modern, intuitive interface built for UX professionals

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Anthropic API key (for AI-powered PRD generation)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd a11y-audit-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   - Get your API key from [Anthropic Console](https://console.anthropic.com)
   - Edit `.env` and add your API key:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```

### Development

4. **Start development with Vite (recommended)**
   ```bash
   # Start both the API server and Vite dev server
   npm run dev:full
   ```
   - API server runs on `http://localhost:3000`
   - Vite dev server runs on `http://localhost:5173`
   - Open `http://localhost:5173` in your browser

   **OR**

   **Start development servers separately**
   ```bash
   # Terminal 1: Start the API server
   npm run dev
   
   # Terminal 2: Start the Vite dev server
   npm run dev:vite
   ```

   **OR**

   **Legacy development (single server)**
   ```bash
   npm start
   ```
   - Navigate to `http://localhost:3000` in your browser

### Production

5. **Build for production**
   ```bash
   npm run build
   ```

6. **Serve production build**
   ```bash
   # Build and serve with preview
   npm run serve
   
   # OR build and serve with production server
   npm run build
   NODE_ENV=production npm start
   ```

### Important Notes
- **Use Vite dev server for development** - provides hot reloading and better DX
- **Don't open HTML files directly** - must use a server
- **API server must be running** - handles accessibility analysis and AI generation
- **Target URLs must be publicly accessible** - no authentication required

## 📖 Usage

1. **Enter a URL**: Input any publicly accessible website URL
2. **Generate Report**: Click "Generate Accessibility Report" and wait for analysis
3. **Review Results**: Navigate through sections using the quick navigation menu
4. **Export Content**: Use the "📋 Copy Section" buttons to export formatted content
5. **Take Action**: Use the triage plan and PRD requirements for implementation

### Export Capabilities
Each section can be exported with rich formatting to:
- **Google Slides/Docs**: Full formatting preserved
- **PowerPoint**: Headers, lists, and emphasis maintained
- **Jira/Confluence**: Structured content with proper hierarchy
- **Slack/Teams**: Clean formatting for messaging
- **Email clients**: Professional appearance

## 🛠️ Technical Architecture

### Backend (`proxy-server.js`)
- **Express.js server** with CORS handling
- **Puppeteer** for web scraping and page analysis
- **axe-core integration** for accessibility scanning
- **Cross-origin handling** to bypass browser restrictions

### Frontend (`script.js`)
- **Real-time axe-core processing** into structured reports
- **Dynamic PRD generation** based on actual violations
- **WCAG level mapping** and priority assessment
- **Rich text export** with dual HTML/plain text formats
- **Responsive design** with modern UI components

### Dependencies
```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5", 
  "puppeteer": "^21.5.0",
  "axe-core": "^4.8.2",
  "@anthropic-ai/sdk": "^0.56.0",
  "vite": "^7.0.3",
  "vite-plugin-node-polyfills": "^0.24.0"
}
```

## 📊 Report Sections

### Executive Summary
- Overall accessibility score (0-100)
- Critical and warning issue counts
- Key findings and business impact
- Immediate action recommendations

### WCAG Compliance Assessment
- Level A, AA, and AAA compliance scores
- Detailed violation breakdowns
- Success criteria mapping

### Detailed Issues
- Complete issue descriptions with context
- Affected elements and specific locations
- Effort estimates and timelines
- Actionable recommendations with help links

### Triage Plan
- Immediate, short-term, and long-term actions
- Priority-based organization
- Effort estimation in story points
- Timeline projections

### Cultural & Situational Accessibility
- Language and localization considerations
- Cultural sensitivity guidelines
- Situational accessibility factors

### PRD Requirements (AI-Powered)
- **Claude AI generation** based on actual scan results and issue patterns
- Functional, technical, testing, and compliance requirements
- Business justification and user impact analysis
- Implementation guidance with specific affected elements
- Prioritization based on WCAG compliance levels and user impact

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start API server with nodemon
npm run dev:vite         # Start Vite dev server
npm run dev:full         # Start both API server and Vite dev server

# Production
npm run build            # Build for production
npm run preview          # Preview production build
npm run serve            # Build and serve production

# Legacy
npm start                # Start API server only
```

### Development Workflow

**With Vite (Recommended):**
```bash
# Start both servers
npm run dev:full

# Access at http://localhost:5173
# API at http://localhost:3000
```

**Traditional:**
```bash
# Start API server only
npm start

# Access at http://localhost:3000
```

### Project Structure
```
a11y-audit-pro/
├── index.html          # Main application interface
├── styles.css          # Modern design system styles
├── script.js           # Client-side logic and export functions
├── proxy-server.js     # Backend server with Puppeteer & Claude AI
├── vite.config.js      # Vite configuration
├── package.json        # Dependencies and scripts
├── .env.example        # Environment variables template
├── .gitignore          # Git ignore rules
├── dist/              # Production build output (generated)
├── public/            # Static assets
└── README.md          # This file
```

## 🚫 Limitations

- **Publicly accessible URLs only** - Cannot analyze password-protected sites
- **No file:// protocol support** - Must use live URLs or local servers
- **Site restrictions** - Some sites may block automated scanning
- **Dynamic content** - Some JavaScript-heavy content may not be fully analyzed
- **Rate limiting** - Some sites may limit automated access

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test with various websites
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

**"Failed to fetch" errors:**
- Ensure you're accessing via `http://localhost:3000`, not opening the HTML file directly
- Check that the server is running (`npm start`)
- Verify the target URL is publicly accessible

**Empty or broken reports:**
- Try a different URL (some sites block automated scanning)
- Check browser console for error messages
- Ensure stable internet connection

**Puppeteer installation issues:**
- Run `npm install puppeteer --force` if installation fails
- On Linux, you may need additional dependencies for Chromium

### Getting Help

- Check the browser console for error messages
- Ensure all dependencies are properly installed
- Try testing with simple sites like `https://example.com`
- Verify Node.js version compatibility (v14+)