package com.empresa.quejas.metadata;

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

    private final LogMetadataRepository repository;

    public MetadataService(LogMetadataRepository repository) {
        this.repository = repository;
    }

    /**
     * Transacción propia: el registro de auditoría se guarda aunque la acción que lo origina falle
     * (por ejemplo, un conflicto de versión).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrar(TipoEvento tipo, String usuario, RequestInfo info, String detalle) {
        repository.save(new LogMetadata(tipo, usuario, info, RequestInfo.recortar(detalle, 400)));
    }

    @Transactional(readOnly = true)
    public Page<LogMetadata> buscar(TipoEvento tipo, String usuario, LocalDate fecha, int pagina) {
        Specification<LogMetadata> spec = (root, query, cb) -> {
            List<Predicate> filtros = new ArrayList<>();
            if (tipo != null) {
                filtros.add(cb.equal(root.get("tipo"), tipo));
            }
            if (usuario != null && !usuario.isBlank()) {
                filtros.add(cb.equal(root.get("usuario"), usuario));
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
        return repository.countByTipoAndFechaAfter(TipoEvento.LOGIN_FALLIDO, LocalDate.now().atStartOfDay());
    }

    @Transactional(readOnly = true)
    public long accesosHoy() {
        return repository.countByTipoAndFechaAfter(TipoEvento.LOGIN_EXITOSO, LocalDate.now().atStartOfDay());
    }

    @Transactional(readOnly = true)
    public List<LogMetadata> actividadReciente(String usuario) {
        return repository.findTop12ByUsuarioOrderByFechaDesc(usuario);
    }

    @Transactional(readOnly = true)
    public List<LogMetadata> ultimosAccesos(String usuario) {
        return repository.findTop5ByUsuarioAndTipoOrderByFechaDesc(usuario, TipoEvento.LOGIN_EXITOSO);
    }

    @Transactional(readOnly = true)
    public long contar(String usuario, TipoEvento tipo) {
        return repository.countByUsuarioAndTipo(usuario, tipo);
    }

    @Transactional(readOnly = true)
    public long contarDesde(String usuario, TipoEvento tipo, LocalDateTime desde) {
        return repository.countByUsuarioAndTipoAndFechaAfter(usuario, tipo, desde);
    }
}
