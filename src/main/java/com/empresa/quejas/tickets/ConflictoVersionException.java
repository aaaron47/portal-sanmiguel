package com.empresa.quejas.tickets;

/**
 * El ticket cambió (por otro admin, la app móvil u otro sistema) desde que se abrió la pantalla.
 */
public class ConflictoVersionException extends RuntimeException {

    public ConflictoVersionException(String codigo) {
        super("El ticket " + codigo + " fue modificado por otro usuario o sistema. Revisa los cambios y vuelve a intentarlo.");
    }
}
