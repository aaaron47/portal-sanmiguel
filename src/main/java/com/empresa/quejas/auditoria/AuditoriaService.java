package com.empresa.quejas.auditoria;

import com.empresa.quejas.auth.AdminDirectorio;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class AuditoriaService {

    private final EventoClickRepository repository;
    private final AdminDirectorio directorio;

    public AuditoriaService(EventoClickRepository repository, AdminDirectorio directorio) {
        this.repository = repository;
        this.directorio = directorio;
    }

    /**
     * Se guarda en segundo plano para que registrar clicks no haga más lenta la navegación
     * ni sume carga sincrónica a la BD compartida.
     * En producción, si el volumen es alto, conviene acumular y guardar por lotes.
     */
    @Async
    public void registrarAsync(TipoInteraccion tipo, String usuario, String ruta, String elemento, String texto,
                               String ip, String sesion) {
        directorio.referencia(usuario).ifPresent(admin ->
                repository.save(new EventoClick(tipo, admin, ruta, elemento, texto, ip, sesion)));
    }

    @Transactional(readOnly = true)
    public Page<EventoClick> buscar(String usuario, TipoInteraccion tipo, LocalDate fecha, int pagina) {
        Specification<EventoClick> spec = (root, query, cb) -> {
            List<Predicate> filtros = new ArrayList<>();
            if (usuario != null && !usuario.isBlank()) {
                filtros.add(cb.equal(root.get("administrador").get("username"), usuario));
            }
            if (tipo != null) {
                filtros.add(cb.equal(root.get("tipo"), tipo));
            }
            if (fecha != null) {
                filtros.add(cb.between(root.<LocalDateTime>get("fecha"),
                        fecha.atStartOfDay(), fecha.plusDays(1).atStartOfDay()));
            }
            return cb.and(filtros.toArray(new Predicate[0]));
        };
        return repository.findAll(spec, PageRequest.of(Math.max(pagina, 0), 25, Sort.by(Sort.Direction.DESC, "fecha")));
    }

    @Transactional(readOnly = true)
    public ResumenClicks resumenHoy() {
        LocalDateTime hoy = LocalDate.now().atStartOfDay();
        long[] porHora = new long[24];
        for (LocalDateTime f : repository.fechasDesde(TipoInteraccion.CLICK, hoy)) {
            porHora[f.getHour()]++;
        }
        long maximo = 1;
        for (long v : porHora) {
            maximo = Math.max(maximo, v);
        }
        return new ResumenClicks(
                repository.countByTipoAndFechaAfter(TipoInteraccion.CLICK, hoy),
                repository.countByTipoAndFechaAfter(TipoInteraccion.VISTA, hoy),
                repository.contarUsuariosActivos(hoy),
                repository.masUsados(TipoInteraccion.CLICK, hoy.minusDays(6), PageRequest.of(0, 6)),
                porHora,
                maximo);
    }

    @Transactional(readOnly = true)
    public long clicksHoy(String usuario) {
        return repository.countByAdministradorUsernameAndTipoAndFechaAfter(usuario, TipoInteraccion.CLICK, LocalDate.now().atStartOfDay());
    }

    public record ResumenClicks(long clicksHoy,
                                long vistasHoy,
                                long usuariosActivosHoy,
                                List<EventoClickRepository.ConteoElemento> masUsados,
                                long[] porHora,
                                long maximoPorHora) {

        /** Altura (0–100) de la barra de una hora en el gráfico de actividad. */
        public int altura(int hora) {
            return (int) Math.round(porHora[hora] * 100.0 / maximoPorHora);
        }
    }
}
