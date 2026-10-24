package com.empresa.quejas.tickets;

public enum EstadoTicket {
    PENDIENTE("Pendientes", "Pendiente", "pendiente"),
    EN_ATENCION("Por contestar", "Por contestar", "atencion"),
    RESPONDIDO("Respondidos", "Respondido", "respondido"),
    ARCHIVADO("Archivados", "Archivado", "archivado");

    private final String plural;
    private final String etiqueta;
    private final String clase;

    EstadoTicket(String plural, String etiqueta, String clase) {
        this.plural = plural;
        this.etiqueta = etiqueta;
        this.clase = clase;
    }

    public String getPlural() { return plural; }
    public String getEtiqueta() { return etiqueta; }
    public String getClase() { return clase; }

    /** Estados que se gestionan desde la bandeja (los archivados van al historial). */
    public static EstadoTicket[] bandeja() {
        return new EstadoTicket[]{PENDIENTE, EN_ATENCION, RESPONDIDO};
    }
}
