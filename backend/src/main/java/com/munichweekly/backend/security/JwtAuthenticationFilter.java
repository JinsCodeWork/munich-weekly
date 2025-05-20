package com.munichweekly.backend.security;

import com.munichweekly.backend.model.User;
import com.munichweekly.backend.repository.UserRepository;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.lang.NonNull;
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
                    System.out.println("Auth success for user: " + user.getId() + " with role: " + user.getRole());
                } else {
                    if (user == null) {
                        System.out.println("Auth failed: User with ID " + userId + " not found in database");
                    } else if (Boolean.TRUE.equals(user.getIsBanned())) {
                        System.out.println("Auth failed: User with ID " + userId + " is banned");
                    }
                }

            } catch (JwtException e) {
                // Invalid token, do nothing (user will be treated as anonymous)
                System.out.println("Auth failed: Invalid JWT token - " + e.getMessage());
            }
        }

        // Proceed with the next filter in the chain
        filterChain.doFilter(request, response);
    }
}