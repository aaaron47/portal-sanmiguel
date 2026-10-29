package com.empresa.quejas.notificaciones;

import com.empresa.quejas.auth.AdminUser;

/**
 * Lo necesario para avisar al contribuyente de una respuesta. Llega ya armado desde el módulo de tickets.
 * El id del seguimiento es el de la fila de reclamo_seguimientos que contiene el mensaje.
 */
public record DatosRespuesta(String ticketId,
                             String ticketCodigo,
                             String ticketAsunto,
                             String clienteNombre,
                             String clienteEmail,
                             String seguimientoId,
                             String mensaje,
                             AdminUser autor) {
}
