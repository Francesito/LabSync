// frontend/components/EstadisticasChart.jsx
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function EstadisticasChart({ datos, className }) {
  const data = {
    labels: datos.labels || [],
    datasets: [
      {
        label: 'Préstamos por Mes',
        data: datos.valores || [],
        backgroundColor: '#2563eb',
      },
    ],
  };

return (
    <div className={className}>
      <Bar data={data} options={{ responsive: true, maintainAspectRatio: false }} />
    </div>
  );
}
