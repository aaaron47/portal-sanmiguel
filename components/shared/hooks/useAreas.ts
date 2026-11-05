import { useEffect, useState } from 'react';
import { Area, areasController } from '@/controllers/areas.controller';

// Las áreas cambian poco: se piden una sola vez por carga de la página y se comparten entre pantallas.
let pedido: Promise<Area[]> | null = null;

function cargarAreas(): Promise<Area[]> {
  if (!pedido) {
    pedido = areasController.getAreas().catch((err) => {
      pedido = null; // permite reintentar en el próximo uso
      throw err;
    });
  }
  return pedido;
}

/** Áreas activas de la BD. Si fallan, `error` queda en true y las listas se muestran vacías. */
export function useAreas() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let montado = true;
    cargarAreas()
      .then((lista) => {
        if (montado) setAreas(lista);
      })
      .catch(() => {
        if (montado) setError(true);
      });
    return () => {
      montado = false;
    };
  }, []);

  return { areas, error };
}
