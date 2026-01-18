// Simulates page replacement algorithms (FIFO and LRU) for a given reference string.

// Defines supported replacement algorithm identifiers.
export type AlgorithmType = 'FIFO' | 'LRU'

export interface SimulationStep {
  // Describes a single simulation step's data.
  step: number
  currentRef: number
  frames: (number | undefined)[]
  status: 'HIT' | 'MISS'
  replaced: number | null
}

export interface SimulationResult {
  // Aggregates overall simulation results.
  steps: SimulationStep[]
  pageFaults: number
  hits: number
  faultRate: number
  total: number
}

// Executes the selected algorithm and records each step.
export const runSimulation = (
  algorithm: AlgorithmType,
  framesCount: number,
  referenceString: string
): SimulationResult => {
  // Convert comma-separated string to array of page numbers.
  const references = referenceString
    .split(',')
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n))

  // Holds current pages in memory frames.
  const frames: (number | undefined)[] = []
  // Collects step-by-step simulation data.
  const steps: SimulationStep[] = []
  let pageFaults = 0
  let hits = 0

  // Tracks page usage order for LRU algorithm.
  let lruTracker: number[] = []

  // Process each page reference in order.
  references.forEach((pageNum, index) => {
    let isHit = false
    let replacedPage: number | null = null

    if (algorithm === 'FIFO') {
      // Check for hit in FIFO.
      if (frames.includes(pageNum)) {
        isHit = true
      } else {
        // Add page to free frame.
        if (frames.length < framesCount) {
          frames.push(pageNum)
        } else {
          // Replace oldest page (FIFO) when frames full.
          replacedPage = frames.shift() as number
          frames.push(pageNum)
        }
        pageFaults++
      }
    } else {
      // Handle hit and update LRU order.
      const existingIndex = frames.indexOf(pageNum)
      if (existingIndex !== -1) {
        isHit = true
        lruTracker = lruTracker.filter((p) => p !== pageNum)
        lruTracker.push(pageNum)
      } else {
        // Insert new page, possibly evict least recently used.
        if (frames.length < framesCount) {
          frames.push(pageNum)
          lruTracker.push(pageNum)
        } else {
          // Identify least recently used page.
          const lruPage = lruTracker.shift() as number
          replacedPage = lruPage
          const frameIndex = frames.indexOf(lruPage)
          frames[frameIndex] = pageNum
          lruTracker.push(pageNum)
        }
        pageFaults++
      }
    }

    if (isHit) hits++

    // Record current simulation state.
    steps.push({
      step: index + 1,
      currentRef: pageNum,
      frames: [...frames],
      status: isHit ? 'HIT' : 'MISS',
      replaced: replacedPage,
    })
  })

  const total = references.length
  return {
    steps,
    pageFaults,
    hits,
    faultRate: total === 0 ? 0 : (pageFaults / total) * 100,
    total,
  }
}
