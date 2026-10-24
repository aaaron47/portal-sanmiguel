package com.empresa.quejas.auth;

import com.empresa.quejas.metadata.MetadataService;
import com.empresa.quejas.metadata.RequestInfo;
import com.empresa.quejas.metadata.TipoEvento;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SavedRequestAwareAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Al iniciar sesión: actualiza la metadata del admin y deja registro del acceso.
 */
@Component
public class LoginExitosoHandler extends SavedRequestAwareAuthenticationSuccessHandler {

    private final AdminUserRepository adminRepository;
    private final MetadataService metadataService;

    public LoginExitosoHandler(AdminUserRepository adminRepository, MetadataService metadataService) {
        this.adminRepository = adminRepository;
        this.metadataService = metadataService;
        setDefaultTargetUrl("/");
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws ServletException, IOException {
        RequestInfo info = RequestInfo.de(request);
        adminRepository.findByUsername(authentication.getName()).ifPresent(admin -> {
            admin.registrarAccesoExitoso(info.ip());
            adminRepository.save(admin);
        });
        metadataService.registrar(TipoEvento.LOGIN_EXITOSO, authentication.getName(), info,
                "Acceso desde " + info.navegador() + " en " + info.sistemaOperativo());
        super.onAuthenticationSuccess(request, response, authentication);
    }
}
