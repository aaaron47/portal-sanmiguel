#!/usr/bin/env node

/**
 * Script de Saneamiento de Gráficos de Apache Superset (Causa raíz: isColumnReference en BASE_AXIS)
 * 
 * Diagnóstico Pablo PUCP:
 * Superset 6.1.0 compara el query_context guardado en BD con el que envía el navegador del guest token.
 * Si falta "isColumnReference": true en las columnas columnType === "BASE_AXIS",
 * Superset asume manipulación y deniega la consulta con HTTP 403 Forbidden.
 * 
 * Uso:
 *   node scripts/patch-superset-charts.mjs --dry-run
 *   node scripts/patch-superset-charts.mjs --apply
 *   node scripts/patch-superset-charts.mjs --apply --charts 75,76,77,78,80
 */

import fs from 'node:fs';
import path from 'node:path';

// Cargar variables de entorno desde .env o .env.local si existen
function cargarEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

cargarEnv();

const SUPERSET_URL = (process.env.NEXT_PUBLIC_SUPERSET_URL || '').replace(/\/$/, '');
const USERNAME = process.env.SUPERSET_ADMIN_USERNAME || 'eduardo';
const PASSWORD = process.env.SUPERSET_ADMIN_PASSWORD || 'eduardo';

const args = process.argv.slice(2);
const isApply = args.includes('--apply');
const isDryRun = !isApply || args.includes('--dry-run');

// Gráficos por defecto del Dashboard 12 (Pablo ya corrigió el 81 con Explore Save Overwrite)
let targetCharts = [75, 76, 77, 78, 80];
const chartsArgIdx = args.findIndex((a) => a === '--charts');
if (chartsArgIdx !== -1 && args[chartsArgIdx + 1]) {
  targetCharts = args[chartsArgIdx + 1].split(',').map((id) => Number.parseInt(id.trim(), 10)).filter(Boolean);
}

console.log('\n======================================================');
console.log(' SANEAMIENTO DE CHARTS DE APACHE SUPERSET (Opción A) ');
console.log('======================================================');
console.log(`URL Superset:   ${SUPERSET_URL}`);
console.log(`Usuario Admin:  ${USERNAME}`);
console.log(`Modo:           ${isApply ? 'APLICAR CAMBIOS (--apply)' : 'SIMULACIÓN SEGURA (--dry-run)'}`);
console.log(`Charts destino: [${targetCharts.join(', ')}]`);
console.log('======================================================\n');

if (!SUPERSET_URL || !USERNAME || !PASSWORD) {
  console.error('Error: Faltan variables de entorno NEXT_PUBLIC_SUPERSET_URL, SUPERSET_ADMIN_USERNAME o SUPERSET_ADMIN_PASSWORD.');
  process.exit(1);
}

async function loginSuperset() {
  console.log('1. Autenticando como admin en Superset...');
  const loginRes = await fetch(`${SUPERSET_URL}/api/v1/security/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: USERNAME,
      password: PASSWORD,
      provider: 'db',
      refresh: true,
    }),
  });

  if (!loginRes.ok) {
    throw new Error(`Fallo de login (${loginRes.status}): ${await loginRes.text()}`);
  }

  const { access_token } = await loginRes.json();

  console.log('2. Obteniendo CSRF Token y Cookies de sesión...');
  const csrfRes = await fetch(`${SUPERSET_URL}/api/v1/security/csrf_token/`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!csrfRes.ok) {
    throw new Error(`Fallo CSRF (${csrfRes.status}): ${await csrfRes.text()}`);
  }

  const { result: csrfToken } = await csrfRes.json();
  const cookies = csrfRes.headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .join('; ');

  return { accessToken: access_token, csrfToken, cookies };
}

async function inspeccionarChart(chartId, session) {
  const res = await fetch(`${SUPERSET_URL}/api/v1/chart/${chartId}`, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'X-CSRFToken': session.csrfToken,
      Cookie: session.cookies,
    },
  });

  if (!res.ok) {
    throw new Error(`No se pudo leer el chart ${chartId} (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  return data.result;
}

async function actualizarChart(chartId, payload, session) {
  const res = await fetch(`${SUPERSET_URL}/api/v1/chart/${chartId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
      'X-CSRFToken': session.csrfToken,
      Referer: SUPERSET_URL,
      Cookie: session.cookies,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error en PUT /api/v1/chart/${chartId} (${res.status}): ${errText}`);
  }

  return await res.json();
}

async function main() {
  try {
    const session = await loginSuperset();
    console.log('Sesión establecida correctamente con Superset.\n');

    // Inspeccionar chart 81 (Molde / Golden Template corregido por Pablo)
    try {
      console.log('--- Verificando Gráfico 81 (Molde / Plantilla de Referencia) ---');
      const chart81 = await inspeccionarChart(81, session);
      console.log(`Nombre: "${chart81.slice_name}", Tipo: ${chart81.viz_type}`);
      if (chart81.query_context) {
        const qc81 = typeof chart81.query_context === 'string' ? JSON.parse(chart81.query_context) : chart81.query_context;
        const baseAxis81 = qc81?.queries?.[0]?.columns?.find((c) => c.columnType === 'BASE_AXIS');
        if (baseAxis81) {
          console.log(`  Eje X (BASE_AXIS) en 81:`, JSON.stringify(baseAxis81));
          console.log(`  -> isColumnReference presente: ${baseAxis81.isColumnReference === true ? 'SÍ (Correcto)' : 'NO'}`);
        }
      }
      console.log('-----------------------------------------------------------------\n');
    } catch (e) {
      console.warn(`Aviso: No se pudo verificar el chart 81 (${e.message}). Continuando con el lote...`);
    }

    let modificados = 0;
    let omitidos = 0;

    for (const id of targetCharts) {
      console.log(`Procesando Chart ${id}...`);
      try {
        const chart = await inspeccionarChart(id, session);
        let qcRaw = chart.query_context;

        if (!qcRaw) {
          console.warn(`  [ALERTA] Chart ${id} no tiene query_context. Requiere regeneración completa.`);
          omitidos++;
          continue;
        }

        const qc = typeof qcRaw === 'string' ? JSON.parse(qcRaw) : qcRaw;
        let huboCambio = false;

        if (Array.isArray(qc?.queries)) {
          for (const q of qc.queries) {
            if (Array.isArray(q.columns)) {
              for (const col of q.columns) {
                // Inyectar isColumnReference: true en columnas de eje X o BASE_AXIS
                if (col.columnType === 'BASE_AXIS' && col.isColumnReference !== true) {
                  col.isColumnReference = true;
                  huboCambio = true;
                  console.log(`  -> Añadido "isColumnReference": true en columna "${col.label || col.sqlExpression}"`);
                }
              }
            }
          }
        }

        // Asegurar que los owners sean una lista de IDs de usuarios
        const currentOwnerIds = Array.isArray(chart.owners)
          ? chart.owners.map((o) => (typeof o === 'object' ? o.id : o))
          : [];

        if (huboCambio) {
          const payloadUpdate = {
            query_context: JSON.stringify(qc),
            owners: currentOwnerIds,
          };

          if (isApply) {
            await actualizarChart(id, payloadUpdate, session);
            console.log(`  [OK] Chart ${id} actualizado exitosamente en Superset.`);
          } else {
            console.log(`  [SIMULACIÓN] Chart ${id} sería actualizado con isColumnReference: true.`);
          }
          modificados++;
        } else {
          console.log(`  [SIN CAMBIOS] Chart ${id} ya contiene isColumnReference: true o no usa BASE_AXIS.`);
          omitidos++;
        }
      } catch (err) {
        console.error(`  [ERROR] Falló procesamiento de Chart ${id}: ${err.message}`);
      }
      console.log('');
    }

    console.log('======================================================');
    console.log(`Resumen: ${modificados} charts ${isApply ? 'actualizados' : 'detectados para cambio'}, ${omitidos} sin cambios.`);
    if (isDryRun && modificados > 0) {
      console.log('Para aplicar los cambios reales en Superset, ejecuta:');
      console.log(`  node scripts/patch-superset-charts.mjs --apply`);
    }
    console.log('======================================================\n');
  } catch (error) {
    console.error('Error general:', error.message);
    process.exit(1);
  }
}

main();

