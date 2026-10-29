package com.empresa.quejas.tickets;

import java.util.Arrays;
import java.util.List;

/**
 * Grupo de estados con el que el admin ve y filtra los tickets. Agrupa los valores de
 * reclamos.estado ({@link EstadoReclamo}): "Resueltos" reúne los cuatro estados finales.
 * El nombre RESPONDIDO se mantiene por las rutas y enlaces existentes (?estado=RESPONDIDO).
 */
public enum EstadoTicket {
    PENDIENTE("Pendientes", "Pendiente", "pendiente", EstadoReclamo.REGISTRADO),
    EN_ATENCION("Por contestar", "Por contestar", "atencion", EstadoReclamo.EN_REVISION),
    OBSERVADO("Observados", "Observado", "observado", EstadoReclamo.OBSERVADO),
    RESPONDIDO("Resueltos", "Resuelto", "respondido", EstadoReclamo.FUNDADO, EstadoReclamo.FUNDADO_EN_PARTE,
            EstadoReclamo.INFUNDADO, EstadoReclamo.IMPROCEDENTE),
    ARCHIVADO("Archivados", "Archivado", "archivado", EstadoReclamo.ARCHIVADO);

    private final String plural;
    private final String etiqueta;
    private final String clase;
    private final List<EstadoReclamo> estadosReclamo;

    EstadoTicket(String plural, String etiqueta, String clase, EstadoReclamo... estadosReclamo) {
        this.plural = plural;
        this.etiqueta = etiqueta;
        this.clase = clase;
        this.estadosReclamo = List.of(estadosReclamo);
    }

    public String getPlural() { return plural; }
    public String getEtiqueta() { return etiqueta; }
    public String getClase() { return clase; }

    /** Valores de la BD que forman este grupo. */
    public List<EstadoReclamo> getEstadosReclamo() { return estadosReclamo; }

    /** Estados que se gestionan desde la bandeja (los archivados van al historial). */
    public static EstadoTicket[] bandeja() {
        return new EstadoTicket[]{PENDIENTE, EN_ATENCION, OBSERVADO, RESPONDIDO};
    }

    /** Reclamos que cuentan para el plazo de atención: aún no hay respuesta final ni se espera al contribuyente. */
    public static List<EstadoReclamo> conPlazoCorriendo() {
        return Arrays.asList(EstadoReclamo.REGISTRADO, EstadoReclamo.EN_REVISION);
    }
}
