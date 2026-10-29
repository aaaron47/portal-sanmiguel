package com.empresa.quejas.auth;

import com.empresa.quejas.metadata.MetadataService;
import com.empresa.quejas.metadata.RequestInfo;
import com.empresa.quejas.metadata.TipoEvento;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Registra cada intento fallido y bloquea la cuenta temporalmente tras varios intentos.
 */
@Component
public class LoginFallidoHandler extends SimpleUrlAuthenticationFailureHandler {

    private final AdminUserRepository adminRepository;
    private final MetadataService metadataService;
    private final int maxIntentos;
    private final int minutosBloqueo;

    public LoginFallidoHandler(AdminUserRepository adminRepository,
                               MetadataService metadataService,
                               @Value("${portal.login.max-intentos:5}") int maxIntentos,
                               @Value("${portal.login.minutos-bloqueo:15}") int minutosBloqueo) {
        this.adminRepository = adminRepository;
        this.metadataService = metadataService;
        this.maxIntentos = maxIntentos;
        this.minutosBloqueo = minutosBloqueo;
    }

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
                                        AuthenticationException exception) throws IOException, ServletException {
        String username = RequestInfo.recortar(request.getParameter("username"), 60);
        if (username == null || username.isBlank()) {
            username = "(vacío)";
        }
        RequestInfo info = RequestInfo.de(request);

        if (exception instanceof LockedException) {
            metadataService.registrar(TipoEvento.LOGIN_FALLIDO, username, info, "Intento sobre cuenta bloqueada");
            getRedirectStrategy().sendRedirect(request, response, "/login?bloqueado");
            return;
        }

        final String usuario = username;
        boolean bloqueada = adminRepository.findByUsername(usuario.toLowerCase()).map(admin -> {
            boolean bloq = admin.registrarIntentoFallido(maxIntentos, minutosBloqueo);
            adminRepository.save(admin);
            return bloq;
        }).orElse(false);

        metadataService.registrar(TipoEvento.LOGIN_FALLIDO, usuario, info, "Credenciales incorrectas");
        if (bloqueada) {
            metadataService.registrar(TipoEvento.CUENTA_BLOQUEADA, usuario, info,
                    "Bloqueada " + minutosBloqueo + " minutos tras " + maxIntentos + " intentos fallidos");
            getRedirectStrategy().sendRedirect(request, response, "/login?bloqueado");
            return;
        }
        getRedirectStrategy().sendRedirect(request, response, "/login?error");
    }
}
