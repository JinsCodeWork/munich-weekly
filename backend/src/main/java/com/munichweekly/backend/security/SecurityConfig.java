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
                        // Static resources
                        .requestMatchers("/uploads/**").permitAll()
                        
                        // Authentication endpoints
                        .requestMatchers("/api/auth/**").permitAll()  // Login etc. allowed
                        
                        // Public issue list endpoint FIRST (most specific path)
                        .requestMatchers(HttpMethod.GET, "/api/issues").permitAll()                 // GET /api/issues (list all)
                        
                        // Issue management endpoints - Admin only (using ** for path variables)
                        .requestMatchers(HttpMethod.GET, "/api/issues/**").hasAuthority("admin")    // GET /api/issues/{id}
                        .requestMatchers(HttpMethod.POST, "/api/issues").hasAuthority("admin")     // POST /api/issues
                        .requestMatchers(HttpMethod.PUT, "/api/issues/**").hasAuthority("admin")   // PUT /api/issues/{id}
                        .requestMatchers(HttpMethod.DELETE, "/api/issues/**").hasAuthority("admin") // DELETE /api/issues/{id} (future)
                        
                        // Voting endpoints - Public
                        .requestMatchers(HttpMethod.GET, "/api/votes/check").permitAll()    // Check vote status
                        .requestMatchers(HttpMethod.POST, "/api/votes").permitAll()        // Cast vote
                        .requestMatchers(HttpMethod.DELETE, "/api/votes").permitAll()      // Remove vote
                        
                        // Submission endpoints - Public read
                        .requestMatchers(HttpMethod.GET, "/api/submissions").permitAll()   // Public GET for submissions
                        .requestMatchers("/api/submissions").permitAll()                   // Other submission endpoints
                        
                        // User endpoints
                        .requestMatchers(HttpMethod.GET, "/api/users/me").hasAnyAuthority("user", "admin")
                        .requestMatchers(HttpMethod.PATCH, "/api/users/me").hasAnyAuthority("user", "admin")
                        .requestMatchers(HttpMethod.DELETE, "/api/users/me").hasAnyAuthority("user", "admin")
                        
                        //special endpoints for upload heroimage. Don t delete this.
                        .requestMatchers("/uploads/**").permitAll()

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