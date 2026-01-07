// src/utils/pageReplacement.ts
export const runSimulation = (algorithm, framesCount, referenceString) => {
    const references = referenceString
        .split(',')
        .map((s) => parseInt(s.trim()))
        .filter((n) => !isNaN(n));
    let frames = [];
    let steps = [];
    let pageFaults = 0;
    let hits = 0;
    // Auxiliar para LRU (guarda el orden de uso)
    let lruTracker = [];
    references.forEach((pageNum, index) => {
        let isHit = false;
        let replacedPage = null;
        if (algorithm === 'FIFO') {
            if (frames.includes(pageNum)) {
                isHit = true;
            }
            else {
                if (frames.length < framesCount) {
                    frames.push(pageNum);
                }
                else {
                    replacedPage = frames.shift();
                    frames.push(pageNum);
                }
                pageFaults++;
            }
        }
        else {
            // Lógica LRU
            const existingIndex = frames.indexOf(pageNum);
            if (existingIndex !== -1) {
                isHit = true;
                // Actualizar prioridad en LRU tracker
                lruTracker = lruTracker.filter(p => p !== pageNum);
                lruTracker.push(pageNum);
            }
            else {
                if (frames.length < framesCount) {
                    frames.push(pageNum);
                    lruTracker.push(pageNum);
                }
                else {
                    const lruPage = lruTracker.shift();
                    replacedPage = lruPage;
                    const frameIndex = frames.indexOf(lruPage);
                    frames[frameIndex] = pageNum;
                    lruTracker.push(pageNum);
                }
                pageFaults++;
            }
        }
        if (isHit)
            hits++;
        steps.push({
            step: index + 1,
            currentRef: pageNum,
            frames: [...frames],
            status: isHit ? 'HIT' : 'MISS',
            replaced: replacedPage
        });
    });
    const total = references.length;
    return {
        steps,
        pageFaults,
        hits,
        faultRate: total === 0 ? 0 : (pageFaults / total) * 100,
        total
    };
};
