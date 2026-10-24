package com.empresa.quejas.web;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Arma el "&clave=valor" de los filtros activos para que la paginación los conserve.
 */
public final class Filtros {

    private Filtros() {
    }

    /** Recibe pares clave, valor, clave, valor... y omite los valores vacíos. */
    public static String query(Object... pares) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i + 1 < pares.length; i += 2) {
            Object valor = pares[i + 1];
            if (valor == null) continue;
            String texto = valor instanceof Enum<?> e ? e.name() : valor.toString();
            if (texto.isBlank() || "false".equals(texto)) continue;
            sb.append('&').append(pares[i]).append('=').append(URLEncoder.encode(texto, StandardCharsets.UTF_8));
        }
        return sb.toString();
    }
}
