package com.empresa.quejas.notificaciones;

/**
 * Lo necesario para avisar al cliente de una respuesta. Llega ya armado desde el módulo de tickets,
 * así este módulo no depende de cómo estén modeladas las tablas de tickets.
 */
public record DatosRespuesta(Long ticketId,
                             String ticketCodigo,
                             String ticketAsunto,
                             String clienteNombre,
                             String clienteEmail,
                             Long respuestaId,
                             String mensaje,
                             String autor) {
}
