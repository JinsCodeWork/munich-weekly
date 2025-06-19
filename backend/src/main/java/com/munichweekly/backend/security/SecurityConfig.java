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
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;

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
    public WebSecurityCustomizer webSecurityCustomizer() {
        return (web) -> web.ignoring()
                .requestMatchers("/api/layout/**")
                .requestMatchers("/api/layout/masonry")
                .requestMatchers("/api/layout/health")
                .requestMatchers("/api/layout/debug")
                .requestMatchers("/uploads/**");
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
                        // Static resources - FIRST
                        .requestMatchers("/uploads/**").permitAll()
                        
                        // Authentication endpoints
                        .requestMatchers("/api/auth/**").permitAll()  // Login etc. allowed
                        
                        // **CRITICAL: Gallery endpoints MUST COME FIRST** (Most specific paths)
                        // Gallery Issues - Public API (EXACT MATCH - NO WILDCARDS CONFLICT)
                        .requestMatchers(HttpMethod.GET, "/api/gallery/issues").permitAll()                // Public gallery issues list
                        .requestMatchers(HttpMethod.GET, "/api/gallery/issues/stats").permitAll()          // Public gallery issue stats
                        .requestMatchers(HttpMethod.GET, "/api/gallery/issues/**").permitAll()             // Public gallery issue details and submissions
                        
                        // Gallery Admin - EXACT PATH MATCHING (as per lessons-learned.md)
                        // Gallery Issue Configuration Management (New Issue ID-based endpoints)
                        .requestMatchers(HttpMethod.GET, "/api/gallery/admin/configs").hasAuthority("admin")              // Get all configs
                        .requestMatchers(HttpMethod.POST, "/api/gallery/admin/configs").hasAuthority("admin")             // Create config
                        .requestMatchers(HttpMethod.PUT, "/api/gallery/admin/issues/*").hasAuthority("admin")             // Update config by issue ID
                        .requestMatchers(HttpMethod.DELETE, "/api/gallery/admin/issues/*").hasAuthority("admin")          // Delete config by issue ID
                        .requestMatchers(HttpMethod.GET, "/api/gallery/admin/issues/*").hasAuthority("admin")             // Get config by issue ID
                        .requestMatchers(HttpMethod.PUT, "/api/gallery/admin/issues/*/order").hasAuthority("admin")       // Update submission order
                        .requestMatchers(HttpMethod.GET, "/api/gallery/admin/issues/*/selected").hasAuthority("admin")    // Get available submissions
                        .requestMatchers(HttpMethod.GET, "/api/gallery/admin/issues/available").hasAuthority("admin")     // Get available issues
                        .requestMatchers(HttpMethod.POST, "/api/gallery/admin/issues/*/cover").hasAuthority("admin")      // Upload cover image by issue ID
                        .requestMatchers(HttpMethod.POST, "/api/gallery/admin/configs/*/cover").hasAuthority("admin")     // Upload cover image (legacy)
                        
                        // Gallery Featured - Legacy API
                        .requestMatchers(HttpMethod.GET, "/api/gallery/featured").permitAll()              // Public featured submissions
                        .requestMatchers(HttpMethod.GET, "/api/gallery/stats").permitAll()                 // Public gallery stats
                        .requestMatchers(HttpMethod.GET, "/api/gallery/featured/config").hasAuthority("admin")    // Admin get active config
                        .requestMatchers(HttpMethod.GET, "/api/gallery/featured/configs").hasAuthority("admin")   // Admin get all configs
                        .requestMatchers(HttpMethod.POST, "/api/gallery/featured/config").hasAuthority("admin")   // Admin save config
                        .requestMatchers(HttpMethod.DELETE, "/api/gallery/featured/config/*").hasAuthority("admin") // Admin delete config
                        .requestMatchers(HttpMethod.GET, "/api/gallery/submissions/*/preview").hasAuthority("admin")       // Admin submission preview
                        .requestMatchers(HttpMethod.GET, "/api/gallery/submissions/*/featured-status").hasAuthority("admin") // Admin featured status check
                        
                        // Voting endpoints - Public
                        .requestMatchers(HttpMethod.GET, "/api/votes/check").permitAll()         // Check single vote status
                        .requestMatchers(HttpMethod.GET, "/api/votes/check-batch").permitAll()   // Check batch vote status (performance optimization)
                        .requestMatchers(HttpMethod.POST, "/api/votes").permitAll()             // Cast vote
                        .requestMatchers(HttpMethod.DELETE, "/api/votes").permitAll()           // Remove vote
                        
                        // Public issue list endpoint (most specific path)
                        .requestMatchers(HttpMethod.GET, "/api/issues").permitAll()                 // GET /api/issues (list all)
                        
                        // Submission endpoints - Public read
                        .requestMatchers(HttpMethod.GET, "/api/submissions").permitAll()   // Public GET for submissions
                        .requestMatchers("/api/submissions").permitAll()                   // Other submission endpoints

                        // Issue management endpoints - Admin only (using ** for path variables)
                        .requestMatchers(HttpMethod.GET, "/api/issues/**").hasAuthority("admin")    // GET /api/issues/{id}
                        .requestMatchers(HttpMethod.POST, "/api/issues").hasAuthority("admin")     // POST /api/issues
                        .requestMatchers(HttpMethod.PUT, "/api/issues/**").hasAuthority("admin")   // PUT /api/issues/{id}
                        .requestMatchers(HttpMethod.DELETE, "/api/issues/**").hasAuthority("admin") // DELETE /api/issues/{id} (future)
                        
                        // **NEW: Data migration endpoints - Admin only**
                        .requestMatchers("/api/admin/migration/**").hasAuthority("admin")          // All migration operations
                        
                        // **NEW: Promotion endpoints** (Most specific first)
                        .requestMatchers(HttpMethod.GET, "/api/promotion/config").permitAll()               // Public promotion config
                        .requestMatchers(HttpMethod.GET, "/api/promotion/page/**").permitAll()             // Public promotion pages
                        .requestMatchers("/api/promotion/admin/**").hasAuthority("admin")                  // Admin promotion endpoints
                        .requestMatchers("/api/promotion/**").permitAll()                                  // Other promotion endpoints
                        
                        // User endpoints
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