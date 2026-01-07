
import React, { useState } from 'react';
import { runSimulation } from './utils/pageReplachement';
import type { SimulationResult, AlgorithmType } from './utils/pageReplachement';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { ChartOptions, ChartData } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const App: React.FC = () => {
  const [frameCount, setFrameCount] = useState<number>(3);
  const [refString, setRefString] = useState<string>('7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2');
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('FIFO');
  
  const [visualResult, setVisualResult] = useState<SimulationResult | null>(null);
  const [chartData, setChartData] = useState<ChartData<'bar'> | null>(null);

  const generateRandom = (): void => {
    const seq = Array.from({ length: 15 }, () => Math.floor(Math.random() * 10)).join(', ');
    setRefString(seq);
  };

  const handleSimulate = (): void => {
    const fifo = runSimulation('FIFO', frameCount, refString);
    const lru = runSimulation('LRU', frameCount, refString);

    setChartData({
      labels: ['FIFO', 'LRU'],
      datasets: [{
        label: 'Fallos de Página',
        data: [fifo.pageFaults, lru.pageFaults],
        backgroundColor: ['#f87171', '#60a5fa'],
        borderRadius: 8,
      }]
    });

    setVisualResult(algorithm === 'FIFO' ? fifo : lru);
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-10 font-sans text-gray-900">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold text-indigo-700 mb-8">Traductor de Direcciones: Paginación</h1>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2">
            <div className="flex justify-between mb-2">
              <label className="text-sm font-bold text-gray-600">Secuencia de Referencia</label>
              <button onClick={generateRandom} className="text-sm text-indigo-600 font-medium hover:underline">🎲 Aleatorio</button>
            </div>
            <input 
              type="text" 
              value={refString} 
              onChange={(e) => setRefString(e.target.value)}
              className="w-full border-2 border-gray-100 p-2 rounded-lg focus:border-indigo-500 outline-none transition-all font-mono"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-2">Marcos</label>
            <input 
              type="number" 
              value={frameCount} 
              onChange={(e) => setFrameCount(Number(e.target.value))}
              className="w-full border-2 border-gray-100 p-2 rounded-lg focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-600 mb-2">Algoritmo Detallado</label>
            <select 
              value={algorithm} 
              onChange={(e) => setAlgorithm(e.target.value as AlgorithmType)}
              className="w-full border-2 border-gray-100 p-2 rounded-lg focus:border-indigo-500 outline-none bg-white"
            >
              <option value="FIFO">FIFO</option>
              <option value="LRU">LRU</option>
            </select>
          </div>

          <button 
            onClick={handleSimulate}
            className="md:col-span-4 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            Ejecutar Análisis Comparativo
          </button>
        </div>

        {visualResult && chartData && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold mb-4">Rendimiento</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-red-50 rounded-xl">
                    <p className="text-xs text-red-600 font-bold uppercase">Fallos</p>
                    <p className="text-2xl font-black text-red-700">{visualResult.pageFaults}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl">
                    <p className="text-xs text-green-600 font-bold uppercase">Tasa</p>
                    <p className="text-2xl font-black text-green-700">{visualResult.faultRate.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <Bar data={chartData} options={options} />
              </div>
            </div>

            <div className="lg:col-span-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <h2 className="text-lg font-bold mb-6">Traza de Memoria Física ({algorithm})</h2>
              <div className="overflow-x-auto pb-4">
                <div className="flex gap-4">
                  {visualResult.steps.map((s, i) => (
                    <div key={i} className="flex-shrink-0">
                      <div className="text-center font-mono font-bold mb-2 text-indigo-600">{s.currentRef}</div>
                      <div className={`border-2 rounded-xl p-2 w-16 space-y-2 ${s.status === 'HIT' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                        {Array.from({ length: frameCount }).map((_, fIdx) => (
                          <div key={fIdx} className={`h-10 rounded flex items-center justify-center font-bold text-sm
                            ${s.frames[fIdx] === s.currentRef ? (s.status === 'HIT' ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'bg-white border border-gray-100'}
                          `}>
                            {s.frames[fIdx] ?? '-'}
                          </div>
                        ))}
                      </div>
                      <div className={`text-[10px] text-center mt-2 font-black uppercase ${s.status === 'HIT' ? 'text-green-500' : 'text-red-500'}`}>{s.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;