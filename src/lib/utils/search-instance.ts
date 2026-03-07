import { AggregatingSearchService } from '@/lib/search';
import { LocalModelSourceProvider } from '@/lib/providers';

let searchService: AggregatingSearchService | null = null;

export function getSearchService(): AggregatingSearchService {
  if (!searchService) {
    const localProvider = new LocalModelSourceProvider();
    searchService = new AggregatingSearchService([localProvider]);
  }
  return searchService;
}
