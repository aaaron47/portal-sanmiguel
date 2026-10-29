package com.empresa.quejas.auth;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Traduce el usuario de la sesión (login) al id de la tabla administradores, que es lo que guardan
 * la auditoría, los clicks y los seguimientos. El id de un administrador no cambia, por eso se guarda
 * en memoria: evita una consulta extra por cada click o registro de auditoría.
 */
@Component
public class AdminDirectorio {

    private final AdminUserRepository repository;
    private final Map<String, String> ids = new ConcurrentHashMap<>();

    public AdminDirectorio(AdminUserRepository repository) {
        this.repository = repository;
    }

    public Optional<String> idDe(String usuario) {
        if (usuario == null) {
            return Optional.empty();
        }
        String id = ids.get(usuario);
        if (id == null) {
            id = repository.findByUsername(usuario).map(AdminUser::getId).orElse(null);
            if (id != null) {
                ids.put(usuario, id);
            }
        }
        return Optional.ofNullable(id);
    }

    /** Referencia al administrador sin consultar la BD (para guardarla como llave foránea). */
    public Optional<AdminUser> referencia(String usuario) {
        return idDe(usuario).map(repository::getReferenceById);
    }
}
