package com.empresa.quejas.auth;

import com.empresa.quejas.metadata.MetadataService;
import com.empresa.quejas.metadata.RequestInfo;
import com.empresa.quejas.metadata.TipoEvento;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.LogoutHandler;
import org.springframework.stereotype.Component;

/**
 * Se ejecuta antes de invalidar la sesión, así todavía conocemos al usuario.
 */
@Component
public class LogoutAuditoriaHandler implements LogoutHandler {

    private final MetadataService metadataService;

    public LogoutAuditoriaHandler(MetadataService metadataService) {
        this.metadataService = metadataService;
    }

    @Override
    public void logout(HttpServletRequest request, HttpServletResponse response, Authentication authentication) {
        if (authentication != null) {
            metadataService.registrar(TipoEvento.LOGOUT, authentication.getName(), RequestInfo.de(request),
                    "Cierre de sesión manual");
        }
    }
}
