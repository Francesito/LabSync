'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

const buildProjection = (material, periodos) => {
  const consumos = periodos.map((periodo) => Number(material?.consumos?.[periodo] ?? 0));
  const totalConsumido = consumos.reduce((acc, value) => acc + value, 0);
  const semanasReferencia = periodos.length || 1;
  const consumoSemanalPromedio = totalConsumido / semanasReferencia;
  const stockActual = Number(material?.existencia_final ?? 0);
  const coberturaSemanas = consumoSemanalPromedio > 0 ? stockActual / consumoSemanalPromedio : null;

  let status = 'ok';
    if (coberturaSemanas !== null) {
    if (coberturaSemanas <= 1) {
      status = 'urgente';
     } else if (coberturaSemanas <= 4) {
      status = 'planificar';
    }
  }

  let proximaCompra = null;
  if (coberturaSemanas !== null) {
    const diasEstimados = Math.max(0, Math.round(coberturaSemanas * 7));
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + diasEstimados);
    proximaCompra = fecha;
  }

  return {
    nombre: material?.nombre ?? '—',
    unidad: material?.unidad ?? '',
    stockActual,
   consumoSemanalPromedio,
    coberturaSemanas,
    proximaCompra,
    status,
    consumos,
     totalConsumido,
  };
};

const buildChartData = (periodos, proyecciones, limite = 5) => {
  const top = [...proyecciones]
   .sort((a, b) => b.consumoSemanalPromedio - a.consumoSemanalPromedio)
    .slice(0, limite);

  return {
     labels: periodos,
    datasets: top.map((material, idx) => ({
      label: material.nombre.replace(/_/g, ' '),
      data: periodos.map((periodo) => Number(material?.consumos?.[periodo] ?? 0)),
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
  const [inventarioLiquidos, setInventarioLiquidos] = useState({ periodos: [], datos: [] });
  const [inventarioSolidos, setInventarioSolidos] = useState({ periodos: [], datos: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastFetchedUserIdRef = useRef(null);
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const [consumoFiltro, setConsumoFiltro] = useState('todos');
  const [showAlerts, setShowAlerts] = useState(false);

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
            periodos: Array.isArray(liq?.semanas)
            ? liq.semanas
            : Array.isArray(liq?.meses)
              ? liq.meses
              : [],
          datos: Array.isArray(liq?.datos) ? liq.datos : [],
        });
        setInventarioSolidos({
       periodos: Array.isArray(sol?.semanas)
            ? sol.semanas
            : Array.isArray(sol?.meses)
              ? sol.meses
              : [],
          datos: Array.isArray(sol?.datos) ? sol.datos : [],
        });
      } catch (err) {
          if (!isMounted || err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
          return;
        }
        setError('No fue posible cargar el inventario. Intenta nuevamente.');
         setInventarioLiquidos({ periodos: [], datos: [] });
        setInventarioSolidos({ periodos: [], datos: [] });
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
      if (!inventarioLiquidos.periodos.length) return [];
    return inventarioLiquidos.datos.map((material) =>
     buildProjection(material, inventarioLiquidos.periodos),
    );
  }, [inventarioLiquidos]);

  const proyeccionesSolidos = useMemo(() => {
  if (!inventarioSolidos.periodos.length) return [];
    return inventarioSolidos.datos.map((material) =>
     buildProjection(material, inventarioSolidos.periodos),
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

    const alertMaterials = useMemo(() => {
    const prioridad = { urgente: 0, planificar: 1, ok: 2 };
    return [...proyeccionesLiquidos, ...proyeccionesSolidos]
      .filter((item) => item.status === 'urgente' || item.status === 'planificar')
      .sort((a, b) => {
        if (prioridad[a.status] !== prioridad[b.status]) {
          return prioridad[a.status] - prioridad[b.status];
        }
        const coberturaA = a.coberturaSemanas ?? Number.POSITIVE_INFINITY;
        const coberturaB = b.coberturaSemanas ?? Number.POSITIVE_INFINITY;
        return coberturaA - coberturaB;
      })
      .slice(0, 6);
  }, [proyeccionesLiquidos, proyeccionesSolidos]);

  useEffect(() => {
    if (!alertMaterials.length) {
      setShowAlerts(false);
      return undefined;
    }
    setShowAlerts(true);
    const timer = setTimeout(() => setShowAlerts(false), 10000);
    return () => clearTimeout(timer);
  }, [alertMaterials]);

  const filterByConsumo = useCallback((consumo, filtro) => {
    if (filtro === 'todos') return true;
    if (filtro === 'sin') return consumo === 0;
    if (filtro === 'bajo') return consumo > 0 && consumo < 50;
    if (filtro === 'medio') return consumo >= 50 && consumo < 200;
    if (filtro === 'alto') return consumo >= 200;
    return true;
  }, []);

  const applyFilters = useCallback(
    (items) =>
      items.filter((item) => {
        const matchesEstado = estadoFiltro === 'todos' || item.status === estadoFiltro;
        const matchesConsumo = filterByConsumo(item.consumoSemanalPromedio, consumoFiltro);
        return matchesEstado && matchesConsumo;
      }),
    [estadoFiltro, consumoFiltro, filterByConsumo],
  );

  const filteredProyeccionesLiquidos = useMemo(
    () => applyFilters(proyeccionesLiquidos),
    [applyFilters, proyeccionesLiquidos],
  );

  const filteredProyeccionesSolidos = useMemo(
    () => applyFilters(proyeccionesSolidos),
    [applyFilters, proyeccionesSolidos],
  );
  
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
              const unidad = context.dataset.unidad ? ` ${context.dataset.unidad}/sem` : '';
              return `${context.dataset.label}: ${formatNumber(context.parsed.y)}${unidad}`;
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
      if (!inventarioLiquidos.periodos.length || !proyeccionesLiquidos.length) {
      return null;
    }
  return buildChartData(inventarioLiquidos.periodos, proyeccionesLiquidos);
  }, [inventarioLiquidos.periodos, proyeccionesLiquidos]);

  const chartDataSolidos = useMemo(() => {
    if (!inventarioSolidos.periodos.length || !proyeccionesSolidos.length) {
      return null;
    }
   return buildChartData(inventarioSolidos.periodos, proyeccionesSolidos);
  }, [inventarioSolidos.periodos, proyeccionesSolidos]);
  
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

         {alertMaterials.length > 0 && (
          <div
            className={`transition-all duration-700 overflow-hidden ${
              showAlerts
                ? 'opacity-100 max-h-96 mb-6 pointer-events-auto'
                : 'opacity-0 max-h-0 mb-0 pointer-events-none'
            }`}
          >
            <div className="rounded-2xl border-l-4 border-red-400 bg-red-50/90 p-4 shadow">
              <h2 className="text-lg font-semibold text-red-700">
                Reactivos con consumo acelerado
              </h2>
              <p className="text-sm text-red-600/80 mb-3">
                Monitorea estos reactivos; la proyección semanal indica que requieren reposición
                prioritaria.
              </p>
              <ul className="space-y-2 text-sm text-red-800">
                {alertMaterials.map((item) => (
                  <li
                    key={`${item.nombre}-${item.unidad}-${item.status}`}
                    className="flex flex-col gap-1 rounded-lg bg-white/80 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-red-700">
                        {item.nombre.replace(/_/g, ' ')}
                        <span className="ml-2 text-xs font-medium uppercase tracking-wide text-red-500">
                          {STATUS_CONFIG[item.status]?.label ?? ''}
                        </span>
                      </p>
                      <p className="text-xs text-red-600">
                        Consumo semanal promedio: {formatNumber(item.consumoSemanalPromedio)}{' '}
                        {item.unidad}/sem · Cobertura estimada:{' '}
                        {item.coberturaSemanas !== null
                          ? `${formatNumber(item.coberturaSemanas)} semanas`
                          : 'Sin datos'}
                      </p>
                    </div>
                    {item.proximaCompra && (
                      <span className="text-xs font-medium text-red-500">
                        Próxima compra sugerida: {formatDate(item.proximaCompra)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
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
                   Calculado con base en el consumo semanal promedio registrado en las últimas 12 semanas.
                    </p>
                  </div>
                 <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="filtro-estado"
                        className="text-xs font-semibold uppercase tracking-wide text-blue-900"
                      >
                        Estado
                      </label>
                      <select
                        id="filtro-estado"
                        value={estadoFiltro}
                        onChange={(event) => setEstadoFiltro(event.target.value)}
                        className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-blue-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        <option value="todos">Todos</option>
                        <option value="urgente">Urgente</option>
                        <option value="planificar">Planificar</option>
                        <option value="ok">En rango</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="filtro-consumo"
                        className="text-xs font-semibold uppercase tracking-wide text-blue-900"
                      >
                        Consumo semanal
                      </label>
                      <select
                        id="filtro-consumo"
                        value={consumoFiltro}
                        onChange={(event) => setConsumoFiltro(event.target.value)}
                        className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-blue-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        <option value="todos">Todos</option>
                        <option value="sin">Sin consumo</option>
                        <option value="bajo">Bajo (&lt; 50)</option>
                        <option value="medio">Moderado (50 - 199)</option>
                        <option value="alto">Alto (≥ 200)</option>
                      </select>
                    </div>
                    <StatusBadge status="planificar" />
                  </div>
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
                       Consumo promedio semanal
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                           Cobertura estimada (semanas)
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
                      {filteredProyeccionesLiquidos.length ? (
                        filteredProyeccionesLiquidos.map((item) => (
                          <tr
                            key={`liq-${item.nombre}-${item.unidad}`}
                            className="hover:bg-blue-50/50"
                          >
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
                              {item.consumoSemanalPromedio > 0
                                ? `${formatNumber(item.consumoSemanalPromedio)} ${item.unidad}/sem`
                                : 'Sin consumo'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {item.coberturaSemanas !== null
                                ? `${formatNumber(item.coberturaSemanas)} semanas`
                                : '—'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {item.proximaCompra ? formatDate(item.proximaCompra) : '—'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              <StatusBadge status={item.status} />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            className="px-6 py-4 text-sm text-center text-gray-500"
                            colSpan={6}
                          >
                            No se encontraron reactivos con los filtros seleccionados.
                          </td>
                        </tr>
                       )}
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
                     Calculado con base en el consumo semanal promedio registrado en las últimas 12 semanas.
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
                         Consumo promedio semanal
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                          Cobertura estimada (semanas)
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
                      {filteredProyeccionesSolidos.length ? (
                        filteredProyeccionesSolidos.map((item) => (
                          <tr
                            key={`sol-${item.nombre}-${item.unidad}`}
                            className="hover:bg-blue-50/50"
                          >
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
                              {item.consumoSemanalPromedio > 0
                                ? `${formatNumber(item.consumoSemanalPromedio)} ${item.unidad}/sem`
                                : 'Sin consumo'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {item.coberturaSemanas !== null
                                ? `${formatNumber(item.coberturaSemanas)} semanas`
                                : '—'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {item.proximaCompra ? formatDate(item.proximaCompra) : '—'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              <StatusBadge status={item.status} />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            className="px-6 py-4 text-sm text-center text-gray-500"
                            colSpan={6}
                          >
                            No se encontraron reactivos con los filtros seleccionados.
                          </td>
                        </tr>
                      )}
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
