package com.empresa.quejas.metadata;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.List;

public interface LogMetadataRepository extends JpaRepository<LogMetadata, Long>, JpaSpecificationExecutor<LogMetadata> {

    List<LogMetadata> findTop12ByUsuarioOrderByFechaDesc(String usuario);

    long countByUsuarioAndTipo(String usuario, TipoEvento tipo);

    long countByUsuarioAndTipoAndFechaAfter(String usuario, TipoEvento tipo, LocalDateTime desde);

    long countByTipoAndFechaAfter(TipoEvento tipo, LocalDateTime desde);

    List<LogMetadata> findTop5ByUsuarioAndTipoOrderByFechaDesc(String usuario, TipoEvento tipo);
}
