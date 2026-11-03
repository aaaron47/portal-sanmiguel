'use client';

import React, { useState } from 'react';
import { X, HelpCircle, ChevronDown, ChevronUp, Search } from 'lucide-react';

interface FaqModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FaqItem {
  id: string;
  categoria: string;
  pregunta: string;
  respuesta: string;
}

const FAQS: FaqItem[] = [
  {
    id: '1',
    categoria: 'Atención de Reclamos',
    pregunta: '¿Cómo funciona el flujo de atención de un reclamo vecinal?',
    respuesta: 'El vecino registra su reclamo a través de los canales digitales. El expediente ingresa a la bandeja del funcionario de área asignada, quien puede responder directamente y elevar a "por aprobar" o derivar a otra gerencia técnica si corresponde según la Directiva Ágil.',
  },
  {
    id: 'cna-flujo',
    categoria: 'Control Tributario',
    pregunta: '¿Cuál es el flujo oficial de la Constancia de No Adeudo Tributario?',
    respuesta: 'El procedimiento regulado bajo la Ley N° 27269 de Firmas y Certificados Digitales y el TUPA Institucional comprende 4 pasos: 1. Solicitud Vecinal (ingreso con DNI/RUC y código de predio para trámites notariales o registrales); 2. Fiscalización Automática (cruce de cuentas corrientes sin cuotas impagas en Impuesto Predial ni Arbitrios); 3. Firma Digital PAdES (estampado con certificado RENIEC, sellado de tiempo y código CVD único por la Subgerencia de Recaudación); y 4. Emisión con QR (PDF oficial verificable durante 30 días calendario).',
  },
  {
    id: 'mcp-capacidades',
    categoria: 'Reportería Inteligente',
    pregunta: '¿Cuáles son las capacidades del Conector MCP (Model Context Protocol)?',
    respuesta: 'El asistente MCP se conecta con el modelo local municipal y ofrece 3 capacidades clave: 1. Generación de Reportes Oficiales (R1 a R11 de morosos, PRICOS y efectividad); 2. Consultas SQL Parametrizadas (transforma preguntas en lenguaje natural en sentencias analíticas seguras y optimizadas); y 3. Renderizado y Sincronización en Apache Superset con métricas e indicadores en vivo.',
  },
  {
    id: '3',
    categoria: 'Constancias Digitales',
    pregunta: '¿Cómo se evalúan las Constancias de Recepción Ciudadana?',
    respuesta: 'Cuando un vecino solicita constancia formal, el funcionario revisa los requisitos y emite un dictamen ("aprobada" u "observada"). Esto asegura trazabilidad legal para el ciudadano con su código hash y fecha de confirmación.',
  },
  {
    id: '4',
    categoria: 'Supervisión y Control',
    pregunta: '¿Cuál es la diferencia entre el rol de Supervisor y Control Municipal?',
    respuesta: 'El Supervisor tiene potestad operativa transversal: aprueba resoluciones definitivas y puede reasignar funcionarios en caso de sobrecarga. El Control Municipal (OCI) tiene un perfil analítico de solo lectura para auditar tiempos de respuesta, efectividad y cumplimiento de plazos legales.',
  },
  {
    id: '5',
    categoria: 'Telemetría y Privacidad',
    pregunta: '¿Qué telemetría registra la app móvil y cómo se cumple la Ley 29733?',
    respuesta: 'El módulo de Control TI monitorea métricas anónimas de rendimiento, pantallas más visitadas y versiones de SO de la app móvil. No se almacena información de identificación personal (PII) sin consentimiento explícito, respetando el Onboarding de Privacidad.',
  },
  {
    id: '6',
    categoria: 'Seguridad',
    pregunta: '¿Cómo se auditan los cambios de usuarios y accesos?',
    respuesta: 'Toda acción de creación, cambio de rol o bloqueo de cuentas es registrada en la bitácora de auditoría con marca de tiempo, dirección IP, usuario ejecutor y resumen de la operación.',
  },
];

export const FaqModal: React.FC<FaqModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('1');

  if (!isOpen) return null;

  const faqsFiltradas = FAQS.filter(
    (f) =>
      f.pregunta.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.respuesta.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '680px', maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del Modal */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--sky-100)',
              color: 'var(--sky-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <HelpCircle size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Preguntas Frecuentes y Ayuda
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Guía rápida sobre el funcionamiento del Portal Municipal San Miguel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            aria-label="Cerrar preguntas frecuentes"
          >
            <X size={20} />
          </button>
        </div>

        {/* Buscador de preguntas */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card-subtle)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar en preguntas frecuentes..."
              style={{
                width: '100%',
                padding: '0.55rem 1rem 0.55rem 2.25rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Lista de FAQs */}
        <div className="modal-body" style={{ padding: '1.25rem 1.5rem', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {faqsFiltradas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No se encontraron preguntas que coincidan con la búsqueda.
              </div>
            ) : (
              faqsFiltradas.map((faq) => {
                const isExpanded = expandedId === faq.id;
                return (
                  <div
                    key={faq.id}
                    style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      background: 'var(--bg-card)',
                      overflow: 'hidden',
                      transition: 'border-color var(--transition-fast)',
                    }}
                  >
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                      style={{
                        width: '100%',
                        padding: '0.875rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        gap: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--sky-600)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {faq.categoria}
                        </span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          {faq.pregunta}
                        </span>
                      </div>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </span>
                    </button>
                    {isExpanded && (
                      <div
                        style={{
                          padding: '0 1rem 1rem 1rem',
                          fontSize: '0.85rem',
                          color: 'var(--text-muted)',
                          lineHeight: 1.55,
                          borderTop: '1px solid var(--border-color)',
                          paddingTop: '0.75rem',
                        }}
                      >
                        {faq.respuesta}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
