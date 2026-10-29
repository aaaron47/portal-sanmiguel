package com.empresa.quejas.config;

import com.empresa.quejas.auth.LoginExitosoHandler;
import com.empresa.quejas.auth.LoginFallidoHandler;
import com.empresa.quejas.auth.LogoutAuditoriaHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           LoginExitosoHandler loginExitoso,
                                           LoginFallidoHandler loginFallido,
                                           LogoutAuditoriaHandler logoutAuditoria) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/login", "/css/**", "/js/**", "/favicon.ico", "/error").permitAll()
                // Auditoría y metadata de otros admins: solo supervisores
                .requestMatchers("/auditoria/**", "/metadata/admin/**").hasRole("SUPERVISOR")
                .anyRequest().authenticated())
            .formLogin(form -> form
                .loginPage("/login")
                .successHandler(loginExitoso)
                .failureHandler(loginFallido)
                .permitAll())
            .logout(logout -> logout
                .logoutUrl("/logout")
                .addLogoutHandler(logoutAuditoria)
                .logoutSuccessUrl("/login?salida")
                .deleteCookies("JSESSIONID")
                .permitAll());

        return http.build();
    }

    /**
     * La tabla administradores guarda las contraseñas con Argon2id ($argon2id$v=19$m=65536,t=3,p=4$...).
     * Al verificar, el encoder lee los parámetros del propio hash.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();
    }
}
