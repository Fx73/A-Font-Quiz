import { Injectable } from '@angular/core';
import { TriviaItemDTO } from '../shared/DTO/trivia-item.dto';
import { distance } from 'fastest-levenshtein';

@Injectable({
    providedIn: 'root'
})
export class WordBaseService {
    private readonly MIN_COMMON_LETTER_RATIO = 0.5

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

        let pool: string[] = this.chooseBaseFromCategory(question.category)
        for (let attempt = 0; attempt < 20; attempt++) {
            const candidate = pool[Math.floor(Math.random() * pool.length)];

            if (this.hasCommonLetters(candidate, answer))
                return candidate;
        }

        return pool[Math.floor(Math.random() * pool.length)];
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



    private hasCommonLetters(a: string, b: string): boolean {
        const setA = new Set(a);
        const setB = new Set(b);

        // Compter les lettres communes
        let commonCount = 0;
        for (const char of setA) {
            if (setB.has(char) && /[a-z]/.test(char)) {
                commonCount++;
            }
        }

        // Calcul du ratio
        const ratio = commonCount / setA.size;
        return ratio >= this.MIN_COMMON_LETTER_RATIO;
    }
}
