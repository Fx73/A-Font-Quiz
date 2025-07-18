import { Injectable } from '@angular/core';
import { TriviaItemDTO } from '../shared/DTO/trivia-item.dto';
import { distance } from 'fastest-levenshtein';

@Injectable({
    providedIn: 'root'
})
export class WordBaseService {
    private readonly MIN_COMMON_LETTER_RATIO = 0.5
    private readonly MAX_CLOSEST_DISTANCE = 4


    private brandWords: string[] = [];
    private filmWords: string[] = [];
    private gameWords: string[] = [];

    constructor() {
        this.loadBase('assets/Data/BrandList.txt').then(value => this.brandWords = value);
        this.loadBase('assets/Data/FilmList.txt').then(value => this.filmWords = value);
        this.loadBase('assets/Data/GameList.txt').then(value => this.gameWords = value);
    }

    private async loadBase(path: string): Promise<string[]> {
        const response = await fetch(path);
        const text = await response.text();
        return text.split('\n').map(line => line.trim().toLowerCase()).filter(line => line.length > 0);
    }


    async pickWordForQuestion(question: TriviaItemDTO): Promise<string> {
        const answer = question.answer.toLowerCase();
        let pool: string[] = this.chooseBaseFromCategory(question.category);

        let bestCandidate = '';
        let bestRatio = 0;

        for (let attempt = 0; attempt < 20; attempt++) {
            if (pool.length === 0) break; // fallback protection

            const index = Math.floor(Math.random() * pool.length);
            const candidate = pool[index];
            const lowerCandidate = candidate.toLowerCase();

            const ratio = this.commonLetterRatio(answer, lowerCandidate);

            if (ratio > bestRatio) {
                if (ratio >= this.MIN_COMMON_LETTER_RATIO) {
                    const dist = distance(lowerCandidate, answer);
                    if (dist > this.MAX_CLOSEST_DISTANCE) {
                        const casedCandidate = this.matchCase(question.answer, candidate)
                        return casedCandidate;
                    }
                } else {
                    bestCandidate = candidate;
                    bestRatio = ratio;
                }
            }


        }

        // Fallback: return best candidate found
        const casedCandidate = this.matchCase(question.answer, bestCandidate)
        return casedCandidate;
    }


    private chooseBaseFromCategory(category: string | undefined): string[] {
        if (category) {
            const keywordMap: Record<string, string[]> = {
                brands: ['brand', 'logo', 'company', 'store', 'corporation', 'product'],
                films: ['film', 'movie', 'cinema', 'series', 'tv', 'anime', 'episode'],
                games: ['game', 'videogame', 'console', 'arcade', 'rpg', 'fps', 'platformer']
            };

            const cat = category.toLowerCase();

            // 🔍 Test exact match
            for (const [theme, keywords] of Object.entries(keywordMap)) {
                if (keywords.includes(cat)) {
                    switch (theme) {
                        case 'brands': return this.brandWords;
                        case 'films': return this.filmWords;
                        case 'games': return this.gameWords;
                    }
                }
            }

            // 🧠 Fallback with Levenshtein distance
            let bestMatch: { theme: string, distance: number } = { theme: '', distance: Infinity };
            for (const [theme, keywords] of Object.entries(keywordMap)) {
                for (const keyword of keywords) {
                    const dist = distance(cat, keyword);
                    if (dist < bestMatch.distance) {
                        bestMatch = { theme, distance: dist };
                    }
                }
            }

            if (bestMatch.distance <= 3) {
                switch (bestMatch.theme) {
                    case 'brands': return this.brandWords;
                    case 'films': return this.filmWords;
                    case 'games': return this.gameWords;
                }
            }
        }

        // 🤷‍♂️ Fallback randomised
        const pools = [this.brandWords, this.filmWords, this.gameWords];
        return pools[Math.floor(Math.random() * pools.length)];
    }



    private commonLetterRatio(origin: string, test: string): number {
        const originSet = new Set(origin);
        const testSet = new Set(test);


        let commonCount = 0;
        for (const char of originSet) {
            if (testSet.has(char)) {
                commonCount++;
            }
        }

        const ratio = commonCount / originSet.size;
        return ratio
    }


    private matchCase(origin: string, target: string): string {
        const originWords = origin.split(' ');
        const targetWords = target.split(' ');

        let pattern = originWords.map((word, index) => ({
            index,
            len: word.length,
            case: this.detectCasing(word),
        }));

        // Reduce pattern size if too long
        while (pattern.length > targetWords.length) {
            pattern.sort((a, b) => a.len - b.len); // shortest first
            pattern.shift(); // remove smallest
        }

        // Expand pattern if too short
        while (pattern.length < targetWords.length) {
            pattern.sort((a, b) => b.len - a.len); // longest first
            const clone = { ...pattern[0], len: Math.floor(pattern[0].len / 2) };
            pattern[0].len = Math.floor(pattern[0].len / 2);
            pattern.push(clone);
        }

        // Apply casing pattern to target
        pattern.sort((a, b) => a.index - b.index);
        const result = targetWords.map((word, i) => this.applyCasing(word, pattern[i].case));
        return result.join(' ');
    }

    private detectCasing(word: string): casing {
        const isUpper = word === word.toUpperCase();
        const isLower = word === word.toLowerCase();
        const first = word[0] === word[0].toUpperCase();
        const last = word[word.length - 1] === word[word.length - 1].toUpperCase();

        if (isUpper) return casing.upper;
        if (isLower) return casing.lower;
        if (first && last) return casing.firstlast;
        if (first) return casing.first;
        if (last) return casing.last;
        return casing.lower;
    }

    private applyCasing(word: string, style: casing): string {
        switch (style) {
            case casing.upper: return word.toUpperCase();
            case casing.lower: return word.toLowerCase();
            case casing.first:
                return word[0].toUpperCase() + word.slice(1).toLowerCase();
            case casing.last:
                return word.slice(0, -1).toLowerCase() + word.slice(-1).toUpperCase();
            case casing.firstlast:
                return word[0].toUpperCase() +
                    word.slice(1, -1).toLowerCase() +
                    word.slice(-1).toUpperCase();
            default: return word;
        }
    }

}
enum casing {
    lower,
    upper,
    first,
    last,
    firstlast
}


