// app/residuos/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { obtenerResiduos, registrarResiduo } from '../../lib/api';

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

const getTipoLabel = (value) => RESIDUE_TYPES.find(t => t.value === value)?.label || value;
const formatDate = (d) => new Date(d).toISOString().split('T')[0];

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

  useEffect(() => {
  obtenerResiduos().then(setEntries).catch(() => setEntries([]));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

 const handleSubmit = async (e) => {
    e.preventDefault();
 const { fecha, laboratorio, reactivo, tipo, cantidad, unidad } = form;
    if (!fecha || !laboratorio || !reactivo || !tipo || !cantidad || !unidad) return;

    try {
      const saved = await registrarResiduo({
        fecha,
        laboratorio,
        reactivo,
        tipo,
        cantidad: parseFloat(cantidad),
        unidad,
      });
      setEntries(prev => [saved, ...prev]);
      setForm({
        fecha: new Date().toISOString().split('T')[0],
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Bitácora de Residuos Peligrosos
      </h1>

      <form
        onSubmit={handleSubmit}
        className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow"
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
            <label className="block text-sm font-medium mb-1">Laboratorio *</label>
            <select
              name="laboratorio"
              value={form.laboratorio}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
              required
            >
              <option value="">-- Seleccionar --</option>
              {LABS.map(lab => (
                <option key={lab} value={lab}>{lab}</option>
              ))}
            </select>
          </div>

           {/* Reactivo */}
          <div>
            <label className="block text-sm font-medium mb-1">Reactivo *</label>
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
            <label className="block text-sm font-medium mb-1">Tipo de Residuo *</label>
            <select
              name="tipo"
              value={form.tipo}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
              required
            >
              <option value="">-- Seleccionar --</option>
              {RESIDUE_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
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

      <section className="mt-10 max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Historial de Registros</h2>
        {entries.length === 0 ? (
          <p className="text-gray-600">No hay residuos registrados aún.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-lg shadow">
              <thead className="bg-gray-100">
                <tr>
                 <th className="px-4 py-2 text-left">Fecha</th>
                  <th className="px-4 py-2 text-left">Laboratorio</th>
                  <th className="px-4 py-2 text-left">Reactivo</th>
                  <th className="px-4 py-2 text-left">Tipo</th>
                  <th className="px-4 py-2 text-right">Cantidad</th>
                  <th className="px-4 py-2 text-left">Unidad</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <tr key={entry.id} className="border-b hover:bg-gray-50">
                   <td className="px-4 py-2">{entry.fecha}</td>
                    <td className="px-4 py-2">{entry.laboratorio}</td>
                    <td className="px-4 py-2">{entry.reactivo}</td>
                    <td className="px-4 py-2">{getTipoLabel(entry.tipo)}</td>
                    <td className="px-4 py-2 text-right">{entry.cantidad.toFixed(2)}</td>
                    <td className="px-4 py-2">{entry.unidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
