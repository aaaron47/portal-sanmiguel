package com.empresa.quejas.metadata;

import com.empresa.quejas.auth.AdminDirectorio;
import com.empresa.quejas.auth.AdminUser;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class MetadataService {

    /** auditoria.entidad_id es obligatorio: así se marca un evento de un usuario que no existe. */
    private static final String SIN_ENTIDAD = "desconocido";

    private final LogMetadataRepository repository;
    private final AdminDirectorio directorio;

    public MetadataService(LogMetadataRepository repository, AdminDirectorio directorio) {
        this.repository = repository;
        this.directorio = directorio;
    }

    /** Evento sobre el propio administrador (accesos, cierre de sesión, correos). */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrar(TipoEvento tipo, String usuario, RequestInfo info, String detalle) {
        guardar(tipo, usuario, info, detalle, "administradores", null);
    }

    /**
     * Evento sobre otra entidad (por ejemplo un reclamo).
     * Transacción propia: el registro se guarda aunque la acción que lo origina falle (un conflicto de versión).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrar(TipoEvento tipo, String usuario, RequestInfo info, String detalle, String entidad,
                          String entidadId) {
        guardar(tipo, usuario, info, detalle, entidad, entidadId);
    }

    private void guardar(TipoEvento tipo, String usuario, RequestInfo info, String detalle, String entidad,
                         String entidadId) {
        AdminUser admin = directorio.referencia(usuario).orElse(null);
        String id = entidadId != null ? entidadId : directorio.idDe(usuario).orElse(SIN_ENTIDAD);
        repository.save(new LogMetadata(tipo, admin, usuario, info, RequestInfo.recortar(detalle, 400), entidad, id));
    }

    @Transactional(readOnly = true)
    public Page<LogMetadata> buscar(TipoEvento tipo, String usuario, LocalDate fecha, int pagina) {
        Specification<LogMetadata> spec = (root, query, cb) -> {
            List<Predicate> filtros = new ArrayList<>();
            filtros.add(cb.equal(root.get("origen"), LogMetadata.ORIGEN_WEB));
            filtros.add(tipo != null
                    ? cb.equal(root.get("accion"), tipo.name())
                    : root.get("accion").in(TipoEvento.nombres()));
            if (usuario != null && !usuario.isBlank()) {
                filtros.add(cb.equal(root.get("administrador").get("username"), usuario));
            }
            if (fecha != null) {
                filtros.add(cb.between(root.<LocalDateTime>get("fecha"), fecha.atStartOfDay(), fecha.plusDays(1).atStartOfDay()));
            }
            return cb.and(filtros.toArray(new Predicate[0]));
        };
        return repository.findAll(spec, PageRequest.of(Math.max(pagina, 0), 20, Sort.by(Sort.Direction.DESC, "fecha")));
    }

    @Transactional(readOnly = true)
    public long fallidosHoy() {
        return repository.countByAccionAndFechaAfter(TipoEvento.LOGIN_FALLIDO.name(), LocalDate.now().atStartOfDay());
    }

    @Transactional(readOnly = true)
    public long accesosHoy() {
        return repository.countByAccionAndFechaAfter(TipoEvento.LOGIN_EXITOSO.name(), LocalDate.now().atStartOfDay());
    }

    @Transactional(readOnly = true)
    public List<LogMetadata> actividadReciente(String usuario) {
        return repository.findTop12ByAdministradorUsernameAndAccionInOrderByFechaDesc(usuario, TipoEvento.nombres());
    }

    @Transactional(readOnly = true)
    public List<LogMetadata> ultimosAccesos(String usuario) {
        return repository.findTop5ByAdministradorUsernameAndAccionOrderByFechaDesc(usuario, TipoEvento.LOGIN_EXITOSO.name());
    }

    @Transactional(readOnly = true)
    public long contar(String usuario, TipoEvento tipo) {
        return repository.countByAdministradorUsernameAndAccion(usuario, tipo.name());
    }

    @Transactional(readOnly = true)
    public long contarDesde(String usuario, TipoEvento tipo, LocalDateTime desde) {
        return repository.countByAdministradorUsernameAndAccionAndFechaAfter(usuario, tipo.name(), desde);
    }
}
