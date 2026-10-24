package com.empresa.quejas.metadata;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

/**
 * Datos del cliente extraídos de la petición HTTP: IP, navegador, sistema operativo y sesión.
 */
public record RequestInfo(String ip, String userAgent, String navegador, String sistemaOperativo, String sesion) {

    public static RequestInfo de(HttpServletRequest request) {
        String ip = obtenerIp(request);
        String ua = recortar(request.getHeader("User-Agent"), 300);
        HttpSession session = request.getSession(false);
        String sesion = session != null ? recortar(session.getId(), 8) : null;
        return new RequestInfo(ip, ua, detectarNavegador(ua), detectarSistema(ua), sesion);
    }

    /** Si la app está detrás de un balanceador o proxy, la IP real llega en X-Forwarded-For. */
    private static String obtenerIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return recortar(forwarded.split(",")[0].trim(), 60);
        }
        return request.getRemoteAddr();
    }

    public static String detectarNavegador(String ua) {
        if (ua == null) return "Desconocido";
        if (ua.contains("Edg/")) return "Edge";
        if (ua.contains("OPR/") || ua.contains("Opera")) return "Opera";
        if (ua.contains("Firefox/")) return "Firefox";
        if (ua.contains("Chrome/")) return "Chrome";
        if (ua.contains("Safari/")) return "Safari";
        if (ua.contains("curl/")) return "curl";
        return "Otro";
    }

    public static String detectarSistema(String ua) {
        if (ua == null) return "Desconocido";
        if (ua.contains("Windows")) return "Windows";
        if (ua.contains("Android")) return "Android";
        if (ua.contains("iPhone") || ua.contains("iPad")) return "iOS";
        if (ua.contains("Mac OS")) return "macOS";
        if (ua.contains("Linux")) return "Linux";
        return "Otro";
    }

    public static String recortar(String valor, int max) {
        if (valor == null) return null;
        return valor.length() <= max ? valor : valor.substring(0, max);
    }
}
