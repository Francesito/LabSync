'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  obtenerInventarioLiquidos,
  obtenerInventarioSolidos,
} from '../../lib/api';
import { useAuth } from '../../lib/auth';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
);

const ALLOWED_ROLES = [3, 4];

const STATUS_CONFIG = {
  urgente: {
    label: 'Compra urgente',
    color: 'bg-red-100 text-red-700 border border-red-200',
  },
  planificar: {
    label: 'Planificar reposición',
    color: 'bg-amber-100 text-amber-700 border border-amber-200',
  },
  ok: {
    label: 'En rango',
    color: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  },
};

const formatNumber = (value) => {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('es-MX', {
    maximumFractionDigits: value < 10 ? 2 : 1,
  }).format(value);
};

const formatDate = (date) =>
  date
    ? new Intl.DateTimeFormat('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date)
    : '—';

const buildProjection = (material, meses) => {
  const consumos = meses.map((mes) => Number(material?.consumos?.[mes] ?? 0));
  const totalConsumido = consumos.reduce((acc, value) => acc + value, 0);
  const mesesReferencia = meses.length || 1;
  const consumoPromedio = totalConsumido / mesesReferencia;
  const stockActual = Number(material?.existencia_final ?? 0);
  const coberturaMeses = consumoPromedio > 0 ? stockActual / consumoPromedio : null;

  let status = 'ok';
  if (coberturaMeses !== null) {
    if (coberturaMeses <= 1) {
      status = 'urgente';
    } else if (coberturaMeses <= 2.5) {
      status = 'planificar';
    }
  }

  let proximaCompra = null;
  if (coberturaMeses !== null) {
    const diasEstimados = Math.max(0, Math.round(coberturaMeses * 30));
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + diasEstimados);
    proximaCompra = fecha;
  }

  return {
    nombre: material?.nombre ?? '—',
    unidad: material?.unidad ?? '',
    stockActual,
    consumoPromedio,
    coberturaMeses,
    proximaCompra,
    status,
    consumos,
  };
};

const buildChartData = (meses, proyecciones, limite = 5) => {
  const top = [...proyecciones]
    .sort((a, b) => b.consumoPromedio - a.consumoPromedio)
    .slice(0, limite);

  return {
    labels: meses,
    datasets: top.map((material, idx) => ({
      label: material.nombre.replace(/_/g, ' '),
      data: material.consumos,
      tension: 0.35,
      fill: false,
      borderWidth: 2,
      pointRadius: 3,
      borderColor: `hsl(${(idx * 70) % 360} 80% 45%)`,
      backgroundColor: `hsl(${(idx * 70) % 360} 80% 60%)`,
      unidad: material.unidad,
    })),
  };
};

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.ok;
  return (
    <span
      className={`px-3 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1 ${config.color}`}
    >
      <span className="w-2 h-2 rounded-full bg-current" />
      {config.label}
    </span>
  );
};

export default function InventarioPage() {
  const { usuario } = useAuth();
  const [inventarioLiquidos, setInventarioLiquidos] = useState({ meses: [], datos: [] });
  const [inventarioSolidos, setInventarioSolidos] = useState({ meses: [], datos: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
   const lastFetchedUserIdRef = useRef(null);

  useEffect(() => {
    const userId = usuario?.id;
    const userRole = usuario?.rol_id;

        if (!userId || !ALLOWED_ROLES.includes(userRole)) {
      lastFetchedUserIdRef.current = null;
      return;
    }

    if (lastFetchedUserIdRef.current === userId) {
      return;
    }

    const controller = new AbortController();
    let isMounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [liq, sol] = await Promise.all([
          obtenerInventarioLiquidos({ signal: controller.signal }),
          obtenerInventarioSolidos({ signal: controller.signal }),
        ]);
        if (!isMounted) return;
        setInventarioLiquidos({
          meses: Array.isArray(liq?.meses) ? liq.meses : [],
          datos: Array.isArray(liq?.datos) ? liq.datos : [],
        });
        setInventarioSolidos({
          meses: Array.isArray(sol?.meses) ? sol.meses : [],
          datos: Array.isArray(sol?.datos) ? sol.datos : [],
        });
      } catch (err) {
          if (!isMounted || err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
          return;
        }
        setError('No fue posible cargar el inventario. Intenta nuevamente.');
        setInventarioLiquidos({ meses: [], datos: [] });
        setInventarioSolidos({ meses: [], datos: [] });
        lastFetchedUserIdRef.current = null;
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();
    lastFetchedUserIdRef.current = userId;
    
    return () => {
      isMounted = false;
            controller.abort();
      lastFetchedUserIdRef.current = null;
    };
  }, [usuario?.id, usuario?.rol_id]);

  const proyeccionesLiquidos = useMemo(() => {
    if (!inventarioLiquidos.meses.length) return [];
    return inventarioLiquidos.datos.map((material) =>
      buildProjection(material, inventarioLiquidos.meses),
    );
  }, [inventarioLiquidos]);

  const proyeccionesSolidos = useMemo(() => {
    if (!inventarioSolidos.meses.length) return [];
    return inventarioSolidos.datos.map((material) =>
      buildProjection(material, inventarioSolidos.meses),
    );
  }, [inventarioSolidos]);

  const resumen = useMemo(() => {
    const contar = (items) => ({
      total: items.length,
      planificar: items.filter((i) => i.status === 'planificar').length,
      urgente: items.filter((i) => i.status === 'urgente').length,
    });

    return {
      liquidos: contar(proyeccionesLiquidos),
      solidos: contar(proyeccionesSolidos),
    };
  }, [proyeccionesLiquidos, proyeccionesSolidos]);

    const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: {
          position: 'bottom',
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const unidad = context.dataset.unidad ? ` ${context.dataset.unidad}` : '';
              return `${context.dataset.label}: ${context.parsed.y}${unidad}`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    }),
    [],
  );

  const chartDataLiquidos = useMemo(() => {
    if (!inventarioLiquidos.meses.length || !proyeccionesLiquidos.length) {
      return null;
    }
    return buildChartData(inventarioLiquidos.meses, proyeccionesLiquidos);
  }, [inventarioLiquidos.meses, proyeccionesLiquidos]);

  const chartDataSolidos = useMemo(() => {
    if (!inventarioSolidos.meses.length || !proyeccionesSolidos.length) {
      return null;
    }
    return buildChartData(inventarioSolidos.meses, proyeccionesSolidos);
  }, [inventarioSolidos.meses, proyeccionesSolidos]);
  
  if (!usuario) {
    return (
      <div className="p-8 text-center text-white">
        Cargando información de usuario...
      </div>
    );
  }

  if (!ALLOWED_ROLES.includes(usuario.rol_id)) {
    return (
      <div className="p-8">
        <div className="max-w-xl mx-auto bg-white/80 backdrop-blur rounded-2xl shadow-lg p-8 text-center">
          <h1 className="text-2xl font-semibold text-red-600 mb-2">Acceso restringido</h1>
          <p className="text-gray-600">
            Esta sección está disponible únicamente para personal de almacén y administradores.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-blue-900">
                Proyección de Inventario
              </h1>
              <p className="text-gray-600 mt-1">
                Visualiza el consumo histórico y planea la reposición óptima de reactivos líquidos y sólidos.
              </p>
            </div>
            <div className="bg-blue-900 text-white px-4 py-2 rounded-xl shadow-lg">
              <p className="text-sm uppercase tracking-wider text-blue-200">Última actualización</p>
              <p className="text-lg font-semibold">
                {formatDate(new Date())}
              </p>
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white rounded-2xl shadow p-4 border border-blue-50">
            <p className="text-sm text-gray-500">Reactivos líquidos monitoreados</p>
            <p className="text-3xl font-semibold text-blue-900">
              {resumen.liquidos.total}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4 border border-blue-50">
            <p className="text-sm text-gray-500">Reactivos sólidos monitoreados</p>
            <p className="text-3xl font-semibold text-blue-900">
              {resumen.solidos.total}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4 border border-amber-50">
            <p className="text-sm text-amber-600">Reposiciones próximas</p>
            <p className="text-3xl font-semibold text-amber-600">
              {resumen.liquidos.planificar + resumen.solidos.planificar}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4 border border-red-50">
            <p className="text-sm text-red-600">Compras urgentes</p>
            <p className="text-3xl font-semibold text-red-600">
              {resumen.liquidos.urgente + resumen.solidos.urgente}
            </p>
          </div>
        </section>

        {isLoading ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
            Cargando inventario...
          </div>
        ) : (
          <>
            <section className="grid gap-6 lg:grid-cols-2 mb-10">
              <div className="bg-white rounded-2xl shadow p-6 border border-blue-50">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-blue-900">
                    Tendencia de consumo - Líquidos
                  </h2>
                  <StatusBadge status="planificar" />
                </div>
                {chartDataLiquidos ? (
                  <div className="relative h-64">
                    <Line data={chartDataLiquidos} options={chartOptions} />
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Sin datos disponibles.</p>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow p-6 border border-blue-50">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-blue-900">
                    Tendencia de consumo - Sólidos
                  </h2>
                  <StatusBadge status="ok" />
                </div>
                           {chartDataSolidos ? (
                  <div className="relative h-64">
                    <Line data={chartDataSolidos} options={chartOptions} />
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Sin datos disponibles.</p>
                )}
              </div>
            </section>

            <section className="space-y-6">
              <div className="bg-white rounded-2xl shadow border border-blue-50">
                <header className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-blue-900">
                      Proyección de compra - Reactivos líquidos
                    </h3>
                    <p className="text-sm text-gray-500">
                      Calculado con base en el consumo promedio del último periodo académico.
                    </p>
                  </div>
                  <StatusBadge status="planificar" />
                </header>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                          Reactivo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                          Stock actual
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                          Consumo promedio mensual
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                          Cobertura estimada
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                          Próxima compra
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {proyeccionesLiquidos.map((item) => (
                        <tr key={`liq-${item.nombre}`} className="hover:bg-blue-50/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-blue-900">
                              {item.nombre.replace(/_/g, ' ')}
                            </div>
                            <div className="text-xs text-gray-500 uppercase">{item.unidad}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {formatNumber(item.stockActual)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {item.consumoPromedio > 0
                              ? `${formatNumber(item.consumoPromedio)} ${item.unidad}/mes`
                              : 'Sin consumo'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {item.coberturaMeses !== null
                              ? `${formatNumber(item.coberturaMeses)} meses`
                              : '—'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {item.proximaCompra ? formatDate(item.proximaCompra) : '—'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            <StatusBadge status={item.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow border border-blue-50">
                <header className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-blue-900">
                      Proyección de compra - Reactivos sólidos
                    </h3>
                    <p className="text-sm text-gray-500">
                      Calculado con base en el consumo promedio del último periodo académico.
                    </p>
                  </div>
                  <StatusBadge status="ok" />
                </header>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                          Reactivo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                          Stock actual
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                          Consumo promedio mensual
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                          Cobertura estimada
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                          Próxima compra
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {proyeccionesSolidos.map((item) => (
                        <tr key={`sol-${item.nombre}`} className="hover:bg-blue-50/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-blue-900">
                              {item.nombre.replace(/_/g, ' ')}
                            </div>
                            <div className="text-xs text-gray-500 uppercase">{item.unidad}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {formatNumber(item.stockActual)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {item.consumoPromedio > 0
                              ? `${formatNumber(item.consumoPromedio)} ${item.unidad}/mes`
                              : 'Sin consumo'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {item.coberturaMeses !== null
                              ? `${formatNumber(item.coberturaMeses)} meses`
                              : '—'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {item.proximaCompra ? formatDate(item.proximaCompra) : '—'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            <StatusBadge status={item.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
