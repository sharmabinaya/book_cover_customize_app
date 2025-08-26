const bookCoverTemplates = [
    {
        name: 'modern',
        title: 'Modern Minimalist',
        frontCover: {
            titleFont: 'bold Arial, sans-serif',
            titleSizeFactor: 0.08,
            authorFont: 'Arial, sans-serif',
            authorSizeFactor: 0.04,
            decoration: 'line'
        }
    },
    {
        name: 'classic',
        title: 'Classic Literature',
        frontCover: {
            titleFont: 'serif',
            titleSizeFactor: 0.06,
            authorFont: 'italic serif',
            authorSizeFactor: 0.035,
            decoration: 'border'
        }
    },
    {
        name: 'bold',
        title: 'Bold & Vibrant',
        frontCover: {
            titleFont: 'bold Impact, Arial',
            titleSizeFactor: 0.1,
            authorFont: 'bold Arial',
            authorSizeFactor: 0.04,
            decoration: 'accent-shape'
        }
    },
    {
        name: 'elegant',
        title: 'Elegant Script',
        frontCover: {
            titleFont: 'Georgia, serif',
            titleSizeFactor: 0.07,
            authorFont: 'italic Georgia, serif',
            authorSizeFactor: 0.035,
            decoration: 'flourish'
        }
    },
    {
        name: 'technical',
        title: 'Technical/Academic',
        frontCover: {
            titleFont: "'Courier New', monospace",
            titleSizeFactor: 0.06,
            authorFont: "'Courier New', monospace",
            authorSizeFactor: 0.035,
            decoration: 'grid'
        }
    }
];

class BookCoverGenerator {
    constructor() {
        this.canvas = document.getElementById('book-cover-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.bookSizes = {
            '6x9': { width: 600, height: 900, dpi: 300 },
            '5.5x8.5': { width: 550, height: 850, dpi: 300 },
            '8.5x11': { width: 850, height: 1100, dpi: 300 },
            '7x10': { width: 700, height: 1000, dpi: 300 }
        };
        
        this.colorSchemes = {
            blue: { primary: '#1e3a8a', secondary: '#3b82f6', accent: '#93c5fd', text: '#ffffff' },
            green: { primary: '#14532d', secondary: '#16a34a', accent: '#86efac', text: '#ffffff' },
            red: { primary: '#991b1b', secondary: '#dc2626', accent: '#fca5a5', text: '#ffffff' },
            purple: { primary: '#581c87', secondary: '#9333ea', accent: '#c4b5fd', text: '#ffffff' },
            gold: { primary: '#92400e', secondary: '#f59e0b', accent: '#fde68a', text: '#ffffff' },
            monochrome: { primary: '#111827', secondary: '#4b5563', accent: '#d1d5db', text: '#ffffff' },
            earth: { primary: '#78350f', secondary: '#a16207', accent: '#fde047', text: '#ffffff' }
        };

        // The central state object for the application
        this.state = {
            title: '',
            author: '',
            backCoverText: '',
            size: '6x9',
            spineWidth: 0.5,
            template: 'modern',
            colorScheme: 'blue',
            backgroundStyle: 'solid',
            showGuides: true
        };

        this.initializeTemplateDropdown();
        this.initializeEventListeners();
        this.renderPreview(); // Initial render
    }

    initializeTemplateDropdown() {
        const selectElement = document.getElementById('design-template');
        bookCoverTemplates.forEach(template => {
            const option = document.createElement('option');
            option.value = template.name;
            option.textContent = template.title;
            selectElement.appendChild(option);
        });
    }

    // The main change is in this function to ensure all inputs trigger a re-render
    initializeEventListeners() {
        const inputIds = [
            'book-title', 'author-name', 'back-cover-text',
            'book-size', 'spine-width', 'design-template',
            'color-scheme', 'background-style', 'show-guides'
        ];

        const debounce = (func, wait) => {
            let timeout;
            return function(...args) {
                const context = this;
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(context, args), wait);
            };
        };

        // A debounced function for preview rendering to improve performance
        const debouncedRender = debounce(() => this.renderPreview(), 300);

        inputIds.forEach(id => {
            const element = document.getElementById(id);
            if (!element) return;
            
            element.addEventListener('input', (e) => {
                const value = (element.type === 'checkbox') ? element.checked : e.target.value;
                this.handleInputChange(id, value);
                debouncedRender();
            });
        });
        
        document.getElementById('export-btn').addEventListener('click', () => this.exportCover());
    }

    handleInputChange(id, value) {
        switch(id) {
            case 'show-guides':
                this.state.showGuides = value;
                break;
            case 'spine-width':
                this.state.spineWidth = parseFloat(value) || 0;
                break;
            case 'book-title':
                this.state.title = value;
                break;
            case 'author-name':
                this.state.author = value;
                break;
            case 'back-cover-text':
                this.state.backCoverText = value;
                break;
            default:
                // Convert ID from "book-size" to "bookSize" for state object
                this.state[id.replace(/-/g, '')] = value;
                break;
        }
    }

    renderPreview() {
        const { size, spineWidth } = this.state;
        
        // Calculate dimensions for the complete cover preview
        const baseDimensions = this.bookSizes[size];
        // Preview dimensions are scaled down for display
        const previewDPI = 100; // Use a lower DPI for faster preview rendering
        const spineWidthPx = Math.round(spineWidth * previewDPI);
        const marginPx = Math.round(0.125 * previewDPI); // 0.125 inches for bleed

        const totalWidth = marginPx + baseDimensions.width + spineWidthPx + baseDimensions.width + marginPx;
        const totalHeight = baseDimensions.height;

        // Set canvas size for the preview
        this.canvas.width = totalWidth;
        this.canvas.height = totalHeight;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.renderCompleteCover(this.ctx, this.state, totalWidth, totalHeight, previewDPI);
    }
    
    renderCompleteCover(ctx, state, totalWidth, totalHeight, dpi) {
        const { title, author, backCoverText, size, spineWidth, template, colorScheme, backgroundStyle, showGuides } = state;
        const colors = this.colorSchemes[colorScheme];
        const baseDimensions = this.bookSizes[size];
        
        const spineWidthPx = Math.round(spineWidth * dpi);
        const marginPx = Math.round(0.125 * dpi);
        
        // Calculate section positions based on dimensions
        const backCoverX = marginPx;
        const spineX = marginPx + baseDimensions.width;
        const frontCoverX = marginPx + baseDimensions.width + spineWidthPx;
        
        // Draw background for the entire cover
        this.drawBackground(ctx, backgroundStyle, colors, totalWidth, totalHeight);
        
        // Draw guide lines (optional)
        if (showGuides) {
            this.drawGuideLines(ctx, backCoverX, spineX, frontCoverX, baseDimensions.width, spineWidthPx, totalHeight);
        }
        
        // Draw back cover, spine, and front cover
        this.renderBackCover(ctx, backCoverText, author, colors, backCoverX, 0, baseDimensions.width, totalHeight, dpi);
        this.renderSpine(ctx, title, author, colors, spineX, 0, spineWidthPx, totalHeight, dpi);
        this.renderFrontCover(ctx, title, author, template, colors, frontCoverX, 0, baseDimensions.width, totalHeight, dpi);
    }

    // --- Drawing Helper Functions ---
    drawBackground(ctx, style, colors, width, height) {
        ctx.save();
        switch (style) {
            case 'solid':
                ctx.fillStyle = colors.primary;
                ctx.fillRect(0, 0, width, height);
                break;
            case 'gradient':
                const gradient = ctx.createLinearGradient(0, 0, width, height);
                gradient.addColorStop(0, colors.primary);
                gradient.addColorStop(1, colors.secondary);
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
                break;
            case 'texture':
                this.drawTexturedBackground(ctx, colors, width, height);
                break;
            case 'geometric':
                this.drawGeometricBackground(ctx, colors, width, height);
                break;
        }
        ctx.restore();
    }

    drawTexturedBackground(ctx, colors, width, height) {
        ctx.fillStyle = colors.primary;
        ctx.fillRect(0, 0, width, height);
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = colors.accent;
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 10 + 2;
            ctx.fillRect(x, y, size, size);
        }
        ctx.globalAlpha = 1;
    }

    drawGeometricBackground(ctx, colors, width, height) {
        ctx.fillStyle = colors.primary;
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = colors.secondary;
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            const x = (i % 4) * (width / 4) + width / 8;
            const y = Math.floor(i / 4) * (height / 2) + height / 4;
            const size = 50;
            ctx.moveTo(x, y - size);
            ctx.lineTo(x - size, y + size);
            ctx.lineTo(x + size, y + size);
            ctx.closePath();
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
    
    // This function was corrected to accept `ctx` and dimensions as parameters
    drawGuideLines(ctx, backCoverX, spineX, frontCoverX, coverWidth, spineWidth, height) {
        ctx.save();
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;

        // Bleed/Margin lines for the whole canvas
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, height);
        ctx.moveTo(ctx.canvas.width, 0);
        ctx.lineTo(ctx.canvas.width, height);
        ctx.moveTo(0, 0);
        ctx.lineTo(ctx.canvas.width, 0);
        ctx.moveTo(0, height);
        ctx.lineTo(ctx.canvas.width, height);
        ctx.stroke();

        // Section dividers and trim lines
        ctx.beginPath();
        // Back cover trim line
        ctx.moveTo(backCoverX, 0);
        ctx.lineTo(backCoverX, height);
        // Spine trim lines
        ctx.moveTo(spineX, 0);
        ctx.lineTo(spineX, height);
        ctx.moveTo(frontCoverX, 0);
        ctx.lineTo(frontCoverX, height);
        // Front cover trim line
        ctx.moveTo(frontCoverX + coverWidth, 0);
        ctx.lineTo(frontCoverX + coverWidth, height);
        ctx.stroke();

        ctx.restore();
    }

    renderBackCover(ctx, backCoverText, author, colors, x, y, width, height) {
        ctx.save();
        ctx.translate(x, y);
        
        ctx.fillStyle = colors.primary;
        ctx.globalAlpha = 0.9;
        ctx.fillRect(0, 0, width, height);
        ctx.globalAlpha = 1;
        
        ctx.fillStyle = colors.text;
        ctx.font = `${Math.floor(width * 0.035)}px Arial, sans-serif`;
        ctx.textAlign = 'left';
        
        const margin = width * 0.1;
        this.wrapText(ctx, backCoverText, margin, height * 0.2, width - 2 * margin, Math.floor(width * 0.05));
        
        ctx.font = `bold ${Math.floor(width * 0.04)}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(author, width / 2, height * 0.9);
        
        ctx.restore();
    }

    renderSpine(ctx, title, author, colors, x, y, width, height) {
        ctx.save();
        ctx.translate(x, y);
        
        ctx.fillStyle = colors.secondary;
        ctx.fillRect(0, 0, width, height);
        
        ctx.translate(width / 2, height / 2);
        ctx.rotate(-Math.PI / 2);
        
        ctx.fillStyle = colors.text;
        ctx.textAlign = 'center';
        
        ctx.font = `bold ${Math.floor(width * 0.8)}px Arial, sans-serif`;
        this.wrapText(ctx, title, 0, -width * 0.2, height * 0.8, width * 0.9);
        
        ctx.font = `${Math.floor(width * 0.6)}px Arial, sans-serif`;
        ctx.fillText(author, 0, width * 0.4);
        
        ctx.restore();
    }

    renderFrontCover(ctx, title, author, template, colors, x, y, width, height) {
        ctx.save();
        ctx.translate(x, y);
        
        const selectedTemplate = bookCoverTemplates.find(t => t.name === template);
        if (!selectedTemplate) return;

        // Draw decorative elements first
        this.drawDecoration(ctx, selectedTemplate.frontCover.decoration, colors, width, height);

        // Draw title
        ctx.fillStyle = colors.text;
        ctx.font = `${Math.floor(width * selectedTemplate.frontCover.titleSizeFactor)}px ${selectedTemplate.frontCover.titleFont}`;
        ctx.textAlign = 'center';
        this.wrapText(ctx, title, width / 2, height * 0.4, width * 0.8, Math.floor(width * 0.1));
        
        // Draw author
        ctx.font = `${Math.floor(width * selectedTemplate.frontCover.authorSizeFactor)}px ${selectedTemplate.frontCover.authorFont}`;
        ctx.fillText(author, width / 2, height * 0.8);
        
        ctx.restore();
    }

    // New generic decoration function
    drawDecoration(ctx, style, colors, width, height) {
        ctx.save();
        ctx.fillStyle = colors.accent;
        
        switch(style) {
            case 'line':
                ctx.fillRect(width * 0.2, height * 0.5, width * 0.6, 4);
                break;
            case 'border':
                ctx.strokeStyle = colors.accent;
                ctx.lineWidth = 6;
                ctx.strokeRect(width * 0.1, height * 0.1, width * 0.8, height * 0.8);
                break;
            case 'accent-shape':
                ctx.beginPath();
                ctx.moveTo(width * 0.1, height * 0.6);
                ctx.lineTo(width * 0.9, height * 0.6);
                ctx.lineTo(width * 0.8, height * 0.65);
                ctx.lineTo(width * 0.2, height * 0.65);
                ctx.closePath();
                ctx.fill();
                break;
            case 'flourish':
                ctx.strokeStyle = colors.accent;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(width / 2, height * 0.2, width * 0.15, 0, Math.PI);
                ctx.stroke();
                break;
            case 'grid':
                ctx.strokeStyle = colors.accent;
                ctx.lineWidth = 1;
                ctx.globalAlpha = 0.3;
                for (let i = 0; i < width; i += 50) {
                    ctx.beginPath();
                    ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
                }
                for (let i = 0; i < height; i += 50) {
                    ctx.beginPath();
                    ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
                }
                break;
        }
        ctx.restore();
    }

    // Utility function to wrap text within a defined width
    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let currentY = y;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line.trim(), x, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line.trim(), x, currentY);
    }
    
    // Optimized export function for high-resolution output
    exportCover() {
        const { size, spineWidth } = this.state;
        const baseDimensions = this.bookSizes[size];
        
        // Calculate dimensions based on the high-res DPI
        const spineWidthPx = Math.round(spineWidth * baseDimensions.dpi);
        const marginPx = Math.round(0.125 * baseDimensions.dpi);
        
        const totalWidth = marginPx + baseDimensions.width + spineWidthPx + baseDimensions.width + marginPx;
        const totalHeight = baseDimensions.height;
        
        // Create a temporary canvas for high-res rendering
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = totalWidth;
        exportCanvas.height = totalHeight;
        const exportCtx = exportCanvas.getContext('2d');

        // Render the complete design at the full DPI
        this.renderCompleteCover(exportCtx, this.state, totalWidth, totalHeight, baseDimensions.dpi);
        
        const link = document.createElement('a');
        const title = this.state.title || 'book-cover';
        link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_complete_cover.png`;
        link.href = exportCanvas.toDataURL('image/png');
        link.click();
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BookCoverGenerator();
});
