
import { WPConfig, WPPost } from "../types";

export class WPService {
  private config: WPConfig;

  constructor(config: WPConfig) {
    this.config = config;
  }

  private get authHeader() {
    const credentials = btoa(`${this.config.username}:${this.config.appPassword}`);
    return { 'Authorization': `Basic ${credentials}` };
  }

  async fetchLatestPosts(count: number = 20): Promise<WPPost[]> {
    const url = `${this.config.siteUrl}/wp-json/wp/v2/posts?per_page=${count}&_fields=id,title,link,excerpt,content`;
    const res = await fetch(url, { headers: this.authHeader });
    if (!res.ok) throw new Error("Failed to fetch WordPress posts.");
    const data = await res.json();
    return data.map((post: any) => ({
      id: post.id,
      title: post.title.rendered,
      link: post.link,
      excerpt: post.excerpt.rendered,
      content: post.content.rendered
    }));
  }

  async updatePost(postId: number, content: string): Promise<boolean> {
    const url = `${this.config.siteUrl}/wp-json/wp/v2/posts/${postId}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...this.authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    });
    return res.ok;
  }
}
