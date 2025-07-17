import { Timestamp } from 'firebase/firestore';

export class Lobby {
    host: string | null = null
    category: string[] = []
    questionCount: number = 10
    isTimed: boolean = true
    timerDuration = 60
    answerStrictness = 0
    createdAt: Date = new Date()
    state: GameState = GameState.InLobby;
    questionList: string[] = []
    questionStartAt?: Timestamp;
    systemMessage?: string;
    allowPreview: boolean = true;

    wordList: string[] = []
    constructor() {
    }
}

export enum GameState {
    InLobby,
    GameQuestion,
    GameAnswer,
    InVictoryRoom
}

