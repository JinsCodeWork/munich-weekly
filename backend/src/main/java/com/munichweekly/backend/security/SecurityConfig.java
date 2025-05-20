package com.munichweekly.backend.security;

import com.munichweekly.backend.repository.UserRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;

/**
 * Security configuration that sets up JWT authentication for all protected endpoints.
 */
@EnableMethodSecurity
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public SecurityConfig(JwtUtil jwtUtil, UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                .csrf(AbstractHttpConfigurer::disable) // Disable CSRF for API use
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(new CustomAuthenticationEntryPoint())
                        .accessDeniedHandler(new CustomAccessDeniedHandler())
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.GET, "/api/issues").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/submissions").permitAll() // Assuming public GET for submissions
                        .requestMatchers(HttpMethod.GET, "/api/votes/check").permitAll() // <<< ADD THIS
                        .requestMatchers(HttpMethod.POST, "/api/votes").permitAll()     // <<< ADD THIS
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/issues").permitAll()
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers("/api/submissions").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()  // Login etc. allowed
                        .requestMatchers(HttpMethod.GET, "/api/users/me").hasAnyAuthority("user", "admin")
                        .requestMatchers(HttpMethod.PATCH, "/api/users/me").hasAnyAuthority("user", "admin")
                        .requestMatchers(HttpMethod.DELETE, "/api/users/me").hasAnyAuthority("user", "admin")
                        .anyRequest().authenticated()                // Everything else requires login
                )
                .addFilterBefore(
                        new JwtAuthenticationFilter(jwtUtil, userRepository),
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
    }
}