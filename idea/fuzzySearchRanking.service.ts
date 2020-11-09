import { Injectable } from '@angular/core';
import Fuse = require('fuse.js');

@Injectable()
export class IDEAFuzzySearchRankingService {
  /**
   * The default options for the fuzzy search algorithm through Fuse.
   */
  private FUSE_DEFAULT_OPTIONS = {
    // isCaseSensitive: false,
    includeScore: true,
    // shouldSort: false,
    // includeMatches: false,
    // findAllMatches: false,
    minMatchCharLength: 2,
    // location: 0,
    // threshold: 0.6,
    // distance: 100,
    // useExtendedSearch: false,
    // ignoreLocation: true,
    ignoreFieldNorm: true
    // keys: ['name', 'value']
  };
  /**
   * The results ranked below this thresold will be ignored.
   */
  public thresold = 0.7;

  constructor() {}

  /**
   * Run a fuzzy search on different set of values (attributes) of a list of elements (objects).
   * Note: all the values sets must refer to the same element for the same index.
   * Return the elements' original indexes sorted by rank.
   *
   * e.g. Ranked fuzzy search on Customers (on different attributes) by a search string.
   * ```
   *  Customer {
   *    name: string;
   *    address: string;
   *  }
   * const customers = Customer[...];
   * const rankedIndexes = IDEAFuzzySearchRankingService.do([
   *  { values: customers.map(c => c.name), searchString: 'guessed name of the customer' },
   *  { values: customers.map(c => c.address), searchString: 'an address' }
   * ]);
   * // customers[rankedIndexes[0]] will contain the customer most likely to match the search parameters
   * ```
   */
  public do(sets: Array<FuzzySearchInputSet>) {
    // init a structure to incrementally rank elements (by their indexes) based on the scores resulting from each set
    const rankedElements: { [index: string]: number } = {};
    // elaborate the sets separately, but increment the same rank
    sets.forEach(set => {
      // skip in case of empty values
      if (!set.searchString || !set.values.length) return;
      // init the fuzzy search algorithm
      const options = set.options || this.FUSE_DEFAULT_OPTIONS;
      options.includeScore = true; // it must be true
      const fuzzySearch = new Fuse.default(set.values, options);
      // break the search string in indivual terms to raise the chances of a good match
      set.searchString.split(' ').forEach(term => {
        // get the ranked results of the fuzzy search over the set's values
        const results = fuzzySearch.search(term);
        results.forEach(r => {
          // invert the score (so that the bigger the better)
          const score = 1 - r.score;
          // init or sum up the score
          if (!rankedElements[r.refIndex]) rankedElements[r.refIndex] = score;
          else rankedElements[r.refIndex] += score;
        });
      });
    });
    // return the array of indexes which are normalized, sorted by rank and filtered by the threshold
    let indexesRankedElements = Object.keys(rankedElements);
    let min: number, max: number;
    indexesRankedElements.forEach(x => {
      if (!min || rankedElements[x] < min) min = rankedElements[x];
      if (!max || rankedElements[x] > max) max = rankedElements[x];
    });
    indexesRankedElements.forEach(x => (rankedElements[x] = (rankedElements[x] - min) / (max - min)));
    indexesRankedElements = indexesRankedElements.sort((a, b) => rankedElements[b] - rankedElements[a]);
    return indexesRankedElements.filter(x => rankedElements[x] > this.thresold);
  }
}

export interface FuzzySearchInputSet {
  values: Array<string>;
  searchString: string;
  options?: Fuse.default.IFuseOptions<string>;
}
