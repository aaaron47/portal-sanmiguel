package com.empresa.quejas.auditoria;

import com.empresa.quejas.auth.AdminUserRepository;
import com.empresa.quejas.metadata.MetadataService;
import com.empresa.quejas.metadata.TipoEvento;
import com.empresa.quejas.web.Filtros;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDate;

/**
 * Pantallas de auditoría (solo supervisores, ver SecurityConfig).
 */
@Controller
public class AuditoriaController {

    private final AuditoriaService auditoriaService;
    private final MetadataService metadataService;
    private final AdminUserRepository adminRepository;

    public AuditoriaController(AuditoriaService auditoriaService, MetadataService metadataService,
                               AdminUserRepository adminRepository) {
        this.auditoriaService = auditoriaService;
        this.metadataService = metadataService;
        this.adminRepository = adminRepository;
    }

    @GetMapping("/auditoria/clicks")
    public String clicks(@RequestParam(name = "usuario", required = false) String usuario,
                         @RequestParam(name = "tipo", required = false) TipoInteraccion tipo,
                         @RequestParam(name = "fecha", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
                         @RequestParam(name = "page", defaultValue = "0") int page,
                         Model model) {
        model.addAttribute("resumen", auditoriaService.resumenHoy());
        model.addAttribute("pagina", auditoriaService.buscar(usuario, tipo, fecha, page));
        model.addAttribute("admins", adminRepository.findAllByOrderByNombreCompletoAsc());
        model.addAttribute("tipos", TipoInteraccion.values());
        model.addAttribute("usuario", usuario);
        model.addAttribute("tipo", tipo);
        model.addAttribute("fecha", fecha);
        model.addAttribute("urlBase", "/auditoria/clicks");
        model.addAttribute("filtros", Filtros.query("usuario", usuario, "tipo", tipo, "fecha", fecha));
        return "auditoria/clicks";
    }

    @GetMapping("/auditoria/logs")
    public String logs(@RequestParam(name = "usuario", required = false) String usuario,
                       @RequestParam(name = "tipo", required = false) TipoEvento tipo,
                       @RequestParam(name = "fecha", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
                       @RequestParam(name = "page", defaultValue = "0") int page,
                       Model model) {
        model.addAttribute("pagina", metadataService.buscar(tipo, usuario, fecha, page));
        model.addAttribute("accesosHoy", metadataService.accesosHoy());
        model.addAttribute("fallidosHoy", metadataService.fallidosHoy());
        model.addAttribute("admins", adminRepository.findAllByOrderByNombreCompletoAsc());
        model.addAttribute("tipos", TipoEvento.values());
        model.addAttribute("usuario", usuario);
        model.addAttribute("tipo", tipo);
        model.addAttribute("fecha", fecha);
        model.addAttribute("urlBase", "/auditoria/logs");
        model.addAttribute("filtros", Filtros.query("usuario", usuario, "tipo", tipo, "fecha", fecha));
        return "auditoria/logs";
    }
}
