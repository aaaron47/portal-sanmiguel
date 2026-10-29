package com.empresa.quejas.metadata;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface LogMetadataRepository extends JpaRepository<LogMetadata, String>, JpaSpecificationExecutor<LogMetadata> {

    List<LogMetadata> findTop12ByAdministradorUsernameAndAccionInOrderByFechaDesc(String usuario, Collection<String> acciones);

    long countByAdministradorUsernameAndAccion(String usuario, String accion);

    long countByAdministradorUsernameAndAccionAndFechaAfter(String usuario, String accion, LocalDateTime desde);

    long countByAccionAndFechaAfter(String accion, LocalDateTime desde);

    List<LogMetadata> findTop5ByAdministradorUsernameAndAccionOrderByFechaDesc(String usuario, String accion);
}
