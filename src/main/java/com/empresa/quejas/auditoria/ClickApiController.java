package com.empresa.quejas.auditoria;

import com.empresa.quejas.metadata.RequestInfo;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * Recibe los eventos que envía tracker.js. Requiere sesión iniciada y token CSRF.
 */
@RestController
public class ClickApiController {

    private final AuditoriaService auditoriaService;

    public ClickApiController(AuditoriaService auditoriaService) {
        this.auditoriaService = auditoriaService;
    }

    @PostMapping("/api/auditoria/clicks")
    public ResponseEntity<Void> registrar(@RequestBody ClickDto dto, Authentication auth, HttpServletRequest request) {
        if (dto == null || dto.ruta() == null || dto.ruta().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        // Los datos del request se leen aquí, antes de pasar al hilo asíncrono.
        RequestInfo info = RequestInfo.de(request);
        TipoInteraccion tipo = "VISTA".equalsIgnoreCase(dto.tipo()) ? TipoInteraccion.VISTA : TipoInteraccion.CLICK;

        auditoriaService.registrarAsync(
                tipo,
                auth.getName(),
                RequestInfo.recortar(dto.ruta(), 300),
                RequestInfo.recortar(dto.elemento(), 120),
                RequestInfo.recortar(dto.texto(), 150),
                info.ip(),
                info.sesion());
        return ResponseEntity.accepted().build();
    }
}
