import fs from 'fs';
import path from 'path';

interface IndustryKeywords {
  [industry: string]: string[];
}

export class KeywordsManager {
  private keywordsPath: string;
  private keywords: IndustryKeywords = {};

  constructor() {
    this.keywordsPath = path.join(process.cwd(), 'src', 'lib', 'training', 'industry-keywords.json');
    this.loadKeywords();
  }

  private loadKeywords(): void {
    try {
      if (fs.existsSync(this.keywordsPath)) {
        const content = fs.readFileSync(this.keywordsPath, 'utf8');
        this.keywords = JSON.parse(content);
      }
    } catch (error) {
      console.warn('Failed to load keywords:', error);
      this.keywords = {};
    }
  }

  private saveKeywords(): void {
    try {
      const dir = path.dirname(this.keywordsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.keywordsPath, JSON.stringify(this.keywords, null, 2));
    } catch (error) {
      console.error('Failed to save keywords:', error);
    }
  }

  getKeywords(industry: string): string[] {
    return this.keywords[industry] || [];
  }

  addKeywords(industry: string, newKeywords: string[]): void {
    if (!this.keywords[industry]) {
      this.keywords[industry] = [];
    }
    
    // Füge nur neue Keywords hinzu (keine Duplikate)
    for (const keyword of newKeywords) {
      if (!this.keywords[industry].includes(keyword)) {
        this.keywords[industry].push(keyword);
      }
    }
    
    this.saveKeywords();
  }

  removeKeywords(industry: string, keywordsToRemove: string[]): void {
    if (!this.keywords[industry]) {
      return;
    }
    
    this.keywords[industry] = this.keywords[industry].filter(
      keyword => !keywordsToRemove.includes(keyword)
    );
    
    this.saveKeywords();
  }

  getAllIndustries(): string[] {
    return Object.keys(this.keywords);
  }

  getKeywordCount(industry: string): number {
    return this.getKeywords(industry).length;
  }

  // Generiert lowerText.includes Code für eine Branche
  generateIndustryCode(industry: string): string {
    const keywords = this.getKeywords(industry);
    if (keywords.length === 0) {
      return '';
    }
    
    const keywordChecks = keywords.map(kw => `lowerText.includes('${kw}')`);
    return keywordChecks.join(' ||\n      ');
  }

  // Backup erstellen
  createBackup(): void {
    try {
      const backupPath = `${this.keywordsPath}.backup.${Date.now()}`;
      fs.copyFileSync(this.keywordsPath, backupPath);
      console.log(`Keywords backup created: ${backupPath}`);
    } catch (error) {
      console.error('Failed to create backup:', error);
    }
  }
}
