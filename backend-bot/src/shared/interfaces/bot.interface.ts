export interface IBotService {
  /**
   * Executes the crawling and data collection process.
   */
  crawl(): Promise<void>;
}
