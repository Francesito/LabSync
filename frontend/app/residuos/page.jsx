// app/residuos/page.jsx
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
  { label: 'Químico', value: 'quimico' },
  { label: 'Biológico', value: 'biologico' },
  { label: 'Radiactivo', value: 'radiactivo' },
  { label: 'Común', value: 'comun' }
];

const getTipoLabel = (value) =>
  RESIDUE_TYPES.find((t) => t.value === value)?.label || value;

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
    cantidad: '',
    unidad: '',
  });

  const [entries, setEntries] = useState([]);
  const [selected, setSelected] = useState([]);
  const [historial, setHistorial] = useState([]);
   const [search, setSearch] = useState('');
  const { usuario } = useAuth();

  useEffect(() => {
    obtenerResiduos()
      .then((data) => {
        if (usuario?.rol === 'almacen' || usuario?.rol === 'administrador') {
          const grouped = {};
          (Array.isArray(data) ? data : []).forEach((e) => {
            const key = `${e.nombre || ''}-${e.grupo || ''}`;
            if (!grouped[key]) {
              grouped[key] = { nombre: e.nombre || '', grupo: e.grupo || '', registros: [] };
            }
            grouped[key].registros.push(e);
          });
          setHistorial(Object.values(grouped));
        } else {
          setEntries(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (usuario?.rol === 'almacen' || usuario?.rol === 'administrador') setHistorial([]);
        else setEntries([]);
      });
  }, [usuario]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { fecha, laboratorio, reactivo, tipo, cantidad, unidad } = form;

    if (!fecha || !laboratorio || !reactivo || !tipo || !cantidad || !unidad) return;

    try {
      const payload = {
        fecha,
        laboratorio,
        reactivo,
        tipo,
        cantidad: parseFloat(cantidad),
        unidad,
      };

      const saved = await registrarResiduo(payload);
      // Asegura que 'saved' tenga un 'id' único
      setEntries((prev) => [saved, ...prev]);
      setForm({
        fecha: formatDate(new Date()),
        laboratorio: '',
        reactivo: '',
        tipo: '',
        cantidad: '',
        unidad: '',
      });
    } catch (err) {
      console.error('Error al registrar residuo:', err);
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

  const handleDownload = async () => {
    if (entries.length === 0) return;
    if (!window.confirm('Al descargar el CSV se eliminarán todos los registros. ¿Deseas continuar?')) return;
    const headers = ['Fecha', 'Laboratorio', 'Reactivo', 'Tipo', 'Cantidad', 'Unidad'];
    const rows = entries.map(e => [
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
    try {
      await eliminarResiduos(entries.map(e => e.id));
      setEntries([]);
      setSelected([]);
    } catch (err) {
      console.error('Error al eliminar residuos:', err);
    }
  };

  const handleDownloadPDF = () => {
    if (entries.length === 0) return;
    const doc = new jsPDF();
    const headers = ['Fecha', 'Laboratorio', 'Reactivo', 'Tipo', 'Cantidad', 'Unidad'];
    const rows = entries.map(e => [
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
  
  const downloadHistorial = (registros, nombre) => {
    if (!registros || registros.length === 0) return;
    const headers = ['Fecha', 'Laboratorio', 'Reactivo', 'Tipo', 'Cantidad', 'Unidad'];
    const rows = registros.map(r => [
      formatDate(r.fecha),
      r.laboratorio,
      r.reactivo,
      getTipoLabel(r.tipo),
      r.cantidad,
      r.unidad
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `residuos_${nombre || 'alumno'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadHistorialPDF = (registros, nombre) => {
    if (!registros || registros.length === 0) return;
    const doc = new jsPDF();
    const headers = ['Fecha', 'Laboratorio', 'Reactivo', 'Tipo', 'Cantidad', 'Unidad'];
    const rows = registros.map(r => [
      formatDate(r.fecha),
      r.laboratorio,
      r.reactivo,
      getTipoLabel(r.tipo),
      r.cantidad,
      r.unidad
    ]);
    autoTable(doc, {
      head: [headers],
      body: rows,
    });
    doc.save(`residuos_${nombre || 'alumno'}.pdf`);
  };
  
  const allChecked = selected.length === entries.length && entries.length > 0;

  const filteredHistorial = historial.filter((h) => {
    const term = search.toLowerCase();
    return (
      (h.nombre || '').toLowerCase().includes(term) ||
      (h.grupo || '').toLowerCase().includes(term)
    );
  });
  
  if (usuario?.rol === 'almacen' || usuario?.rol === 'administrador') {
    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold mb-6 text-center">Historial de Residuos</h1>
       <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar por nombre o grupo"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 border px-3 py-2 rounded"
          />
        </div>
        {filteredHistorial.length === 0 ? (
          <p className="text-gray-600">No hay registros.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-lg shadow">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Nombre</th>
                  <th className="px-4 py-2 text-left">Grupo</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
               {filteredHistorial.map((h, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{h.nombre}</td>
                    <td className="px-4 py-2">{h.grupo}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => downloadHistorial(h.registros, h.nombre)}
                          className="bg-blue-600 text-white px-3 py-1 rounded"
                        >
                          CSV
                        </button>
                        <button
                          onClick={() => downloadHistorialPDF(h.registros, h.nombre)}
                          className="bg-green-600 text-white px-3 py-1 rounded"
                        >
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Bitácora de Residuos Peligrosos
      </h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Historial */}
        <section className="flex-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Historial de Registros</h2>
        <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="bg-green-600 text-white px-4 py-2 rounded"
                disabled={entries.length === 0}
              >
                Descargar CSV
              </button>
           <button
                onClick={handleDownloadPDF}
                className="bg-blue-600 text-white px-4 py-2 rounded"
                disabled={entries.length === 0}
              >
                PDF
              </button>
              <button
                onClick={handleDelete}
                disabled={selected.length === 0}
                className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                Eliminar seleccionados
              </button>
            </div>
          </div>

          {entries.length === 0 ? (
            <p className="text-gray-600">No hay residuos registrados aún.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg shadow">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={(e) =>
                          setSelected(
                            e.target.checked ? entries.map((en) => en.id) : []
                          )
                        }
                      />
                    </th>
                    <th className="px-4 py-2 text-left">Fecha</th>
                    <th className="px-4 py-2 text-left">Laboratorio</th>
                    <th className="px-4 py-2 text-left">Reactivo</th>
                    <th className="px-4 py-2 text-left">Tipo</th>
                    <th className="px-4 py-2 text-right">Cantidad</th>
                    <th className="px-4 py-2 text-left">Unidad</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={selected.includes(entry.id)}
                          onChange={() => toggleSelect(entry.id)}
                        />
                      </td>
                      <td className="px-4 py-2">{formatDate(entry.fecha)}</td>
                      <td className="px-4 py-2">{entry.laboratorio}</td>
                      <td className="px-4 py-2">{entry.reactivo}</td>
                      <td className="px-4 py-2">{getTipoLabel(entry.tipo)}</td>
                      <td className="px-4 py-2 text-right">
                        {Number(entry.cantidad).toFixed(2)}
                      </td>
                      <td className="px-4 py-2">{entry.unidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="md:w-1/3 bg-white p-6 rounded-lg shadow"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fecha */}
            <div>
              <label className="block text-sm font-medium mb-1">Fecha *</label>
              <input
                type="date"
                name="fecha"
                value={form.fecha}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
                required
              />
            </div>

            {/* Laboratorio */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Laboratorio *
              </label>
              <select
                name="laboratorio"
                value={form.laboratorio}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
                required
              >
                <option value="">-- Seleccionar --</option>
                {LABS.map((lab) => (
                  <option key={lab} value={lab}>
                    {lab}
                  </option>
                ))}
              </select>
            </div>

            {/* Reactivo */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Reactivo *
              </label>
              <input
                type="text"
                name="reactivo"
                value={form.reactivo}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
                required
              />
            </div>

            {/* Tipo de residuo */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Tipo de Residuo *
              </label>
              <select
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
                required
              >
                <option value="">-- Seleccionar --</option>
                {RESIDUE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Cantidad */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Cantidad Generada *
              </label>
              <input
                type="number"
                name="cantidad"
                value={form.cantidad}
                onChange={handleChange}
                step="0.01"
                className="w-full border px-3 py-2 rounded"
                placeholder="0.00"
                required
              />
            </div>

            {/* Unidad */}
            <div>
              <label className="block text-sm font-medium mb-1">Unidad *</label>
              <select
                name="unidad"
                value={form.unidad}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
                required
              >
                <option value="">-- Seleccionar --</option>
                <option value="g">g</option>
                <option value="ml">mL</option>
                <option value="u">u</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="mt-6 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Registrar Residuo
          </button>
        </form>
      </div>
    </div>
  );
}
