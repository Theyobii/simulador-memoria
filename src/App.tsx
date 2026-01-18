// Program visualizes page replacement algorithm comparisons (FIFO vs LRU) with chart and trace.

import React, { useState } from 'react'
import { runSimulation, type SimulationResult, type AlgorithmType } from './utils/pageReplachement'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import type { ChartOptions, ChartData } from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

// Main React component rendering UI and handling simulation.
const App: React.FC = () => {
  const [frameCount, setFrameCount] = useState<number>(3)
  const [refString, setRefString] = useState<string>('7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2')
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('FIFO')

  const [visualResult, setVisualResult] = useState<SimulationResult | null>(null)
  const [chartData, setChartData] = useState<ChartData<'bar'> | null>(null)

  // Generate a random reference string for simulation.
  const generateRandom = (): void => {
    const seq = Array.from({ length: 15 }, () => Math.floor(Math.random() * 10)).join(', ')
    setRefString(seq)
  }

  // Run simulations for both algorithms and prepare chart data and selected result.
  const handleSimulate = (): void => {
    const fifo = runSimulation('FIFO', frameCount, refString)
    const lru = runSimulation('LRU', frameCount, refString)

    setChartData({
      labels: ['FIFO', 'LRU'],
      datasets: [
        {
          label: 'Fallos de Página',
          data: [fifo.pageFaults, lru.pageFaults],
          backgroundColor: ['#f87171', '#60a5fa'],
          borderRadius: 8,
        },
      ],
    })

    setVisualResult(algorithm === 'FIFO' ? fifo : lru)
  }

  // Chart configuration options.
  const options: ChartOptions<'bar'> = {
    responsive: true,
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans text-gray-900 md:p-10">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-extrabold text-indigo-700">
          Traductor de Direcciones: Paginación
        </h1>

        {/* Input controls for reference string, frame count, and algorithm selection. */}
        <div className="mb-8 grid grid-cols-1 gap-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="mb-2 flex justify-between">
              <label className="text-sm font-bold text-gray-600">Secuencia de Referencia</label>
              <button
                onClick={generateRandom}
                className="text-sm font-medium text-indigo-600 hover:underline"
              >
                🎲 Aleatorio
              </button>
            </div>
            <input
              type="text"
              value={refString}
              onChange={(e) => setRefString(e.target.value)}
              className="w-full rounded-lg border-2 border-gray-100 p-2 font-mono outline-none transition-all focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-600">Marcos</label>
            <input
              type="number"
              value={frameCount}
              onChange={(e) => setFrameCount(Number(e.target.value))}
              className="w-full rounded-lg border-2 border-gray-100 p-2 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-600">
              Algoritmo Detallado
            </label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value as AlgorithmType)}
              className="w-full rounded-lg border-2 border-gray-100 bg-white p-2 outline-none focus:border-indigo-500"
            >
              <option value="FIFO">FIFO</option>
              <option value="LRU">LRU</option>
            </select>
          </div>

          {/* Trigger simulation when clicked.  */}
          <button
            onClick={handleSimulate}
            className="rounded-xl bg-indigo-600 py-3 font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 md:col-span-4"
          >
            Ejecutar Análisis Comparativo
          </button>
        </div>

        {/* Render results and chart when simulation data is available. */}
        {visualResult && chartData && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-bold">Rendimiento</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-red-50 p-4">
                    <p className="text-xs font-bold uppercase text-red-600">Fallos</p>
                    <p className="text-2xl font-black text-red-700">{visualResult.pageFaults}</p>
                  </div>
                  <div className="rounded-xl bg-green-50 p-4">
                    <p className="text-xs font-bold uppercase text-green-600">Tasa</p>
                    <p className="text-2xl font-black text-green-700">
                      {visualResult.faultRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <Bar data={chartData} options={options} />
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-8">
              <h2 className="mb-6 text-lg font-bold">Traza de Memoria Física ({algorithm})</h2>
              <div className="overflow-x-auto pb-4">
                <div className="flex gap-4">
                  {/* Render each step of the selected algorithm's trace. */}
                  {visualResult.steps.map((s, i) => (
                    <div key={i} className="flex-shrink-0">
                      <div className="mb-2 text-center font-mono font-bold text-indigo-600">
                        {s.currentRef}
                      </div>
                      <div
                        className={`w-16 space-y-2 rounded-xl border-2 p-2 ${s.status === 'HIT' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
                      >
                        {/* Render each frame slot for the current step. */}
                        {Array.from({ length: frameCount }).map((_, fIdx) => (
                          <div
                            key={fIdx}
                            className={`flex h-10 items-center justify-center rounded text-sm font-bold ${s.frames[fIdx] === s.currentRef ? (s.status === 'HIT' ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'border border-gray-100 bg-white'} `}
                          >
                            {s.frames[fIdx] ?? '-'}
                          </div>
                        ))}
                      </div>
                      <div
                        className={`mt-2 text-center text-[10px] font-black uppercase ${s.status === 'HIT' ? 'text-green-500' : 'text-red-500'}`}
                      >
                        {s.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
