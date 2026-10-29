package com.empresa.quejas.tickets;

/**
 * Valores de reclamos.estado en la BD (los fija una restricción CHECK: no se pueden inventar otros).
 * Cada uno pertenece a un {@link EstadoTicket}, que es el grupo que ve el admin en la bandeja.
 */
public enum EstadoReclamo {
    REGISTRADO("Registrado"),
    EN_REVISION("En revisión"),
    OBSERVADO("Observado"),
    FUNDADO("Fundado"),
    FUNDADO_EN_PARTE("Fundado en parte"),
    INFUNDADO("Infundado"),
    IMPROCEDENTE("Improcedente"),
    ARCHIVADO("Archivado");

    private final String etiqueta;

    EstadoReclamo(String etiqueta) {
        this.etiqueta = etiqueta;
    }

    public String getEtiqueta() { return etiqueta; }

    /**
     * Grupo de la bandeja al que pertenece. Se busca en {@link EstadoTicket}, que es quien define qué estados
     * agrupa (así los dos enums no se necesitan al inicializarse).
     */
    public EstadoTicket getGrupo() {
        for (EstadoTicket grupo : EstadoTicket.values()) {
            if (grupo.getEstadosReclamo().contains(this)) {
                return grupo;
            }
        }
        throw new IllegalStateException("El estado " + this + " no pertenece a ningún grupo de la bandeja");
    }

    /** Estados finales con respuesta: exigen respuesta y fecha de resolución. */
    public boolean esResolucion() {
        return getGrupo() == EstadoTicket.RESPONDIDO;
    }

    /** Estados que el admin puede elegir al resolver un reclamo. */
    public static EstadoReclamo[] resoluciones() {
        return new EstadoReclamo[]{FUNDADO, FUNDADO_EN_PARTE, INFUNDADO, IMPROCEDENTE};
    }
}
