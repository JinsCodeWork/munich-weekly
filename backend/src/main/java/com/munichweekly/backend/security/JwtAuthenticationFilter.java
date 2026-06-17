package com.munichweekly.backend.security;

import com.munichweekly.backend.model.User;
import com.munichweekly.backend.repository.UserRepository;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jspecify.annotations.NonNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Filter that intercepts requests, extracts JWT token from header,
 * and sets authenticated user into Spring SecurityContext.
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtUtil jwtUtil, UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        // ✅ 1. Skip JWT check for public auth endpoints
        if (path.startsWith("/api/auth/")) {
            filterChain.doFilter(request, response);
            return;
        }

        // ✅ 2. Try to extract token from Authorization header
        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7); // Skip "Bearer "

            try {
                Long userId = jwtUtil.extractUserId(token);
                User user = userRepository.findById(userId).orElse(null);

                if (user != null && Boolean.FALSE.equals(user.getIsBanned())) {
                    // Put the user into the security context
                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(
                                    user,
                                    null,
                                    List.of(new SimpleGrantedAuthority(user.getRole()))
                            );

                    SecurityContextHolder.getContext().setAuthentication(auth);
                    log.debug("Auth success for user: {} with role: {}", user.getId(), user.getRole());
                } else {
                    if (user == null) {
                        log.debug("Auth failed: User with ID {} not found in database", userId);
                    } else if (Boolean.TRUE.equals(user.getIsBanned())) {
                        log.debug("Auth failed: User with ID {} is banned", userId);
                    }
                }

            } catch (JwtException e) {
                log.debug("Auth failed: Invalid JWT token - {}", e.getMessage());
            }
        }

        // ✅ 3. Always continue with the chain
        filterChain.doFilter(request, response);
    }
}
