package com.empresa.quejas.auditoria;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface EventoClickRepository extends JpaRepository<EventoClick, Long>, JpaSpecificationExecutor<EventoClick> {

    long countByTipoAndFechaAfter(TipoInteraccion tipo, LocalDateTime desde);

    long countByUsuarioAndTipoAndFechaAfter(String usuario, TipoInteraccion tipo, LocalDateTime desde);

    @Query("select count(distinct e.usuario) from EventoClick e where e.fecha >= :desde")
    long contarUsuariosActivos(@Param("desde") LocalDateTime desde);

    @Query("""
            select e.elemento as elemento, e.texto as texto, count(e) as total
            from EventoClick e
            where e.tipo = :tipo and e.fecha >= :desde
            group by e.elemento, e.texto
            order by count(e) desc
            """)
    List<ConteoElemento> masUsados(@Param("tipo") TipoInteraccion tipo,
                                   @Param("desde") LocalDateTime desde,
                                   Pageable limite);

    @Query("select e.fecha from EventoClick e where e.tipo = :tipo and e.fecha >= :desde")
    List<LocalDateTime> fechasDesde(@Param("tipo") TipoInteraccion tipo, @Param("desde") LocalDateTime desde);

    interface ConteoElemento {
        String getElemento();

        String getTexto();

        Long getTotal();
    }
}
