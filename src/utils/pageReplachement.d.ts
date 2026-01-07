export type AlgorithmType = 'FIFO' | 'LRU';
export interface SimulationStep {
    step: number;
    currentRef: number;
    frames: (number | undefined)[];
    status: 'HIT' | 'MISS';
    replaced: number | null;
}
export interface SimulationResult {
    steps: SimulationStep[];
    pageFaults: number;
    hits: number;
    faultRate: number;
    total: number;
}
export declare const runSimulation: (algorithm: AlgorithmType, framesCount: number, referenceString: string) => SimulationResult;
