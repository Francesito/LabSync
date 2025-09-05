'use client';

import { useState, useEffect } from 'react';
import { obtenerResiduos, registrarResiduo, eliminarResiduos } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const LABS = [
  'Laboratorio de Química Básica',
  'Lab. de Química Analítica',
  'Lab. de Tecnología Ambiental',
  'Lab. de Fisicoquímica',
  'Lab. de Operaciones Unitarias',
  'Lab. de Análisis Instrumental',
  'Lab. de Microbiología'
];

const RESIDUE_TYPES = [
  { label: 'Corrosivo', value: 'corrosivo', icon: '🧪', color: 'text-red-600' },
  { label: 'Reactivo', value: 'reactivo', icon: '⚡', color: 'text-purple-600' },
  { label: 'Tóxico', value: 'toxico', icon: '☠️', color: 'text-green-600' },
  { label: 'Inflamable', value: 'inflamable', icon: '🔥', color: 'text-orange-600' },
  { label: 'Otros', value: 'otros', icon: '📦', color: 'text-gray-500' }
];


const getTipoLabel = (value) =>
  RESIDUE_TYPES.find((t) => t.value === value)?.label || value;

const getTipoIcon = (value) =>
  RESIDUE_TYPES.find((t) => t.value === value)?.icon || '📋';

const getTipoColor = (value) =>
  RESIDUE_TYPES.find((t) => t.value === value)?.color || 'text-gray-500';

const formatDate = (d) => {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

export default function ResiduosPage() {
  const [form, setForm] = useState({
    fecha: formatDate(new Date()),
    laboratorio: '',
    reactivo: '',
    tipo: '',
     otroTipo: '',
    cantidad: '',
    unidad: '',
  });

  const [entries, setEntries] = useState([]);
  const [selected, setSelected] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const { usuario } = useAuth();

  useEffect(() => {
    obtenerResiduos()
      .then((data) => {
        setEntries(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setEntries([]);
      });
  }, [usuario]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: value,
      ...(name === 'tipo' && value !== 'otros' ? { otroTipo: '' } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { fecha, laboratorio, reactivo, tipo, otroTipo, cantidad, unidad } = form;

    const tipoValue = tipo === 'otros' ? otroTipo.trim() : tipo;

    if (!fecha || !laboratorio || !reactivo || !tipoValue || !cantidad || !unidad) return;

    setIsLoading(true);
    try {
      const payload = {
        fecha,
        laboratorio,
        reactivo,
    tipo: tipoValue,
        cantidad: parseFloat(cantidad),
        unidad,
      };

      const saved = await registrarResiduo(payload);
      setEntries((prev) => [saved, ...prev]);
      setForm({
        fecha: formatDate(new Date()),
        laboratorio: '',
        reactivo: '',
        tipo: '',
         otroTipo: '',
        cantidad: '',
        unidad: '',
      });
    } catch (err) {
      console.error('Error al registrar residuo:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelected((sel) =>
      sel.includes(id) ? sel.filter((i) => i !== id) : [...sel, id]
    );
  };

  const handleDelete = async () => {
    if (selected.length === 0) return;
    try {
      await eliminarResiduos(selected);
      setEntries((prev) => prev.filter((e) => !selected.includes(e.id)));
      setSelected([]);
    } catch (err) {
      console.error('Error al eliminar residuos:', err);
    }
  };

  const filteredEntries = entries.filter((e) => {
    const date = formatDate(e.fecha);
    if (fromDate && date < fromDate) return false;
    if (toDate && date > toDate) return false;
    return true;
  });

  const handleDownload = () => {
    if (filteredEntries.length === 0) return;
    const headers = ['Fecha', 'Laboratorio', 'Reactivo', 'Tipo', 'Cantidad', 'Unidad'];
    const rows = filteredEntries.map(e => [
      formatDate(e.fecha),
      e.laboratorio,
      e.reactivo,
      getTipoLabel(e.tipo),
      e.cantidad,
      e.unidad
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'residuos.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    if (filteredEntries.length === 0) return;
    const doc = new jsPDF();
    const headers = ['Fecha', 'Laboratorio', 'Reactivo', 'Tipo', 'Cantidad', 'Unidad'];
    const rows = filteredEntries.map(e => [
      formatDate(e.fecha),
      e.laboratorio,
      e.reactivo,
      getTipoLabel(e.tipo),
      e.cantidad,
      e.unidad
    ]);
    autoTable(doc, {
      head: [headers],
      body: rows,
    });
    doc.save('residuos.pdf');
  };

  const allChecked =
    filteredEntries.length > 0 && filteredEntries.every((e) => selected.includes(e.id));

  if ([3, 4].includes(usuario?.rol_id)) return <p className="text-red-500 text-center text-lg">Acceso denegado</p>;

  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2 animate-slide-in">
          <span className="text-2xl">🧪</span>
          <h1 className="text-2xl sm:text-3xl font-semibold text-blue-800">
            Bitácora de Residuos
          </h1>
          <span className="text-2xl">🧪</span>
        </div>
        <div className="w-16 h-1 bg-green-500 mx-auto rounded-full"></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Historial */}
        <section className="flex-1">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-blue-700">Historial</h2>
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm">
                  {filteredEntries.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="border rounded px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-400"
                />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="border rounded px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-400"
                />
                <button
                  onClick={handleDownload}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 transition-all duration-200 hover:scale-105"
                  disabled={filteredEntries.length === 0}
                >
                  <span>📥</span>
                  CSV
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 transition-all duration-200 hover:scale-105"
                  disabled={filteredEntries.length === 0}
                >
                  <span>📄</span>
                  PDF
                </button>
                <button
                  onClick={handleDelete}
                  disabled={selected.length === 0}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 transition-all duration-200 hover:scale-105"
                >
                  <span>🗑️</span>
                  Eliminar
                  {selected.length > 0 && (
                    <span className="bg-red-700 px-2 py-1 rounded-full text-xs">
                      {selected.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {filteredEntries.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl mb-4 opacity-50">📭</span>
                <p className="text-gray-500">No hay registros.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="p-3">
                        <input
                          type="checkbox"
                          checked={allChecked}
                          onChange={(e) =>
                            setSelected(
                              e.target.checked
                                ? filteredEntries.map((en) => en.id)
                                : []
                            )
                          }
                          className="w-4 h-4 text-blue-500 rounded"
                        />
                      </th>
                      <th className="p-3 text-left font-medium text-gray-700">Fecha</th>
                      <th className="p-3 text-left font-medium text-gray-700">Laboratorio</th>
                      <th className="p-3 text-left font-medium text-gray-700">Reactivo</th>
                      <th className="p-3 text-left font-medium text-gray-700">Tipo</th>
                      <th className="p-3 text-right font-medium text-gray-700">Cantidad</th>
                      <th className="p-3 text-left font-medium text-gray-700">Unidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((entry, index) => (
                      <tr
                        key={entry.id}
                        className="border-b hover:bg-blue-50 transition-all duration-200 animate-slide-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selected.includes(entry.id)}
                            onChange={() => toggleSelect(entry.id)}
                            className="w-4 h-4 text-blue-500 rounded"
                          />
                        </td>
                        <td className="p-3">{formatDate(entry.fecha)}</td>
                        <td className="p-3 max-w-xs truncate" title={entry.laboratorio}>
                          {entry.laboratorio}
                        </td>
                        <td className="p-3 font-medium">{entry.reactivo}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span>{getTipoIcon(entry.tipo)}</span>
                            <span className={getTipoColor(entry.tipo)}>
                              {getTipoLabel(entry.tipo)}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-right font-mono">
                          {Number(entry.cantidad).toFixed(2)}
                        </td>
                        <td className="p-3">{entry.unidad}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Formulario */}
        <div className="lg:w-80">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-blue-700 mb-4 flex items-center gap-2">
              <span>➕</span> Nuevo Registro
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha *
                </label>
                <input
                  type="date"
                  name="fecha"
                  value={form.fecha}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Laboratorio *
                </label>
                <select
                  name="laboratorio"
                  value={form.laboratorio}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
                  required
                >
                  <option value="">-- Seleccionar laboratorio --</option>
                  {LABS.map((lab) => (
                    <option key={lab} value={lab}>
                      {lab}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reactivo *
                </label>
                <input
                  type="text"
                  name="reactivo"
                  value={form.reactivo}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
                  placeholder="Nombre del reactivo"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Residuo *
                </label>
                <select
                  name="tipo"
                  value={form.tipo}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
                  required
                >
                  <option value="">-- Seleccionar tipo --</option>
                  {RESIDUE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
                 {form.tipo === 'otros' && (
                  <input
                    type="text"
                    name="otroTipo"
                    value={form.otroTipo}
                    onChange={handleChange}
                    className="mt-2 w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
                    placeholder="Especificar tipo"
                    required
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    name="cantidad"
                    value={form.cantidad}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidad *
                  </label>
                  <select
                    name="unidad"
                    value={form.unidad}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
                    required
                  >
                    <option value="">-- Unidad --</option>
                    <option value="g">g (gramos)</option>
                    <option value="ml">mL (mililitros)</option>
                    <option value="u">u (unidades)</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:scale-105 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    Registrando...
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    Registrar
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Animaciones */}
      <style jsx>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
