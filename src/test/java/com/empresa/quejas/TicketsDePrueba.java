package com.empresa.quejas;

import com.empresa.quejas.auth.AdminUser;
import com.empresa.quejas.tickets.Canal;
import com.empresa.quejas.tickets.Contribuyente;
import com.empresa.quejas.tickets.Prioridad;
import com.empresa.quejas.tickets.Ticket;
import com.empresa.quejas.tickets.TicketRepository;
import com.empresa.quejas.tickets.TipoReclamo;
import jakarta.persistence.EntityManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Crea reclamos propios de cada prueba (con su contribuyente) sobre los datos de ejemplo de H2,
 * para no depender de cuáles reclamos generó DatosDemo.
 */
public final class TicketsDePrueba {

    private static final AtomicInteger SECUENCIA = new AtomicInteger();

    private TicketsDePrueba() {
    }

    /**
     * @param email correo del contribuyente (puede ser null)
     * @param tomadoPor usuario que ya lo tomó (queda por contestar), o null para dejarlo pendiente
     */
    public static Ticket crear(TransactionTemplate transaccion, EntityManager em, TicketRepository repository,
                               String email, String tomadoPor) {
        return transaccion.execute(estado -> {
            int n = SECUENCIA.incrementAndGet();
            TipoReclamo tipo = em.createQuery("select t from TipoReclamo t order by t.codigo", TipoReclamo.class)
                    .setMaxResults(1).getSingleResult();
            Contribuyente contribuyente = new Contribuyente(UUID.randomUUID().toString(), "PRUEBA-" + n,
                    "Contribuyente de prueba " + n, "4000" + String.format("%04d", n), email, "900000000");
            em.persist(contribuyente);
            Ticket ticket = new Ticket("REC-TEST-" + String.format("%06d", n), contribuyente, tipo, Canal.WEB,
                    "Cargo que no reconozco", "Descripción de prueba.", "Que revisen el cargo.", Prioridad.MEDIA,
                    LocalDateTime.now().minusHours(2));
            if (tomadoPor != null) {
                AdminUser admin = em.createQuery("select a from AdminUser a where a.username = :u", AdminUser.class)
                        .setParameter("u", tomadoPor).getSingleResult();
                ticket.tomar(admin, LocalDateTime.now().minusHours(1));
            }
            return repository.save(ticket);
        });
    }
}
