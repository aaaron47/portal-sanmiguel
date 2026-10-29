package com.empresa.quejas.tickets;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Número de la resolución que cierra un reclamo (reclamos.numero_resolucion), tomado de la secuencia
 * seq_resolucion de la BD con el formato que ya usan los reclamos existentes: RES-RCL-2026-000003.
 * La consulta de la secuencia la arma el dialecto, así sirve igual para Oracle y para H2.
 */
@Component
public class NumeracionResoluciones {

    @PersistenceContext
    private EntityManager entityManager;

    public String siguiente(LocalDateTime ahora) {
        String sql = entityManager.getEntityManagerFactory().unwrap(SessionFactoryImplementor.class)
                .getJdbcServices().getDialect().getSequenceSupport().getSequenceNextValString("seq_resolucion");
        long numero = ((Number) entityManager.createNativeQuery(sql).getSingleResult()).longValue();
        return String.format("RES-RCL-%d-%06d", ahora.getYear(), numero);
    }
}
