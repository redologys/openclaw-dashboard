
// Mock client for ClawdHub Marketplace
export interface MarketplaceSkill {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  rating: number;
  installCount: number;
}

const MOCK_SKILLS: MarketplaceSkill[] = [
  {
    id: "web-scraper",
    name: "Web Scraper Pro",
    description: "Advanced web scraping with proxy rotation and headless browser support.",
    author: "data-wizard",
    version: "1.2.0",
    rating: 4.8,
    installCount: 1542
  },
  {
    id: "postgres-tools",
    name: "Postgres Utilities",
    description: "Connect, query, and manage PostgreSQL databases directly.",
    author: "sql-master",
    version: "2.0.1",
    rating: 4.9,
    installCount: 3200
  },
  {
    id: "slack-notifier",
    name: "Slack Integration",
    description: "Send notifications and interact with Slack channels.",
    author: "slack-bot",
    version: "1.0.5",
    rating: 4.5,
    installCount: 890
  }
];

export class ClawdHubClient {
  private baseUrl: string;

  constructor(baseUrl: string = "https://api.clawdhub.com") {
    this.baseUrl = baseUrl;
    void this.baseUrl; // Suppress unused
  }

  async searchSkills(query: string): Promise<MarketplaceSkill[]> {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!query) return MOCK_SKILLS;
    
    const lowerQuery = query.toLowerCase();
    return MOCK_SKILLS.filter(skill => 
      skill.name.toLowerCase().includes(lowerQuery) || 
      skill.description.toLowerCase().includes(lowerQuery)
    );
  }

  async getSkillDetails(id: string): Promise<MarketplaceSkill | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_SKILLS.find(s => s.id === id) || null;
  }
}
