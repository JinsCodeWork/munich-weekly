package com.munichweekly.backend.controller;

import com.munichweekly.backend.dto.CsrfTokenResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for browser CSRF token bootstrapping.
 */
@RestController
@RequestMapping("/api")
@Tag(name = "Security", description = "Browser security token helpers")
public class CsrfController {

    @Operation(
            summary = "Get CSRF token",
            description = "Issues a CSRF token for browser clients that call cookie-backed mutation endpoints."
    )
    @ApiResponse(responseCode = "200", description = "CSRF token issued")
    @GetMapping("/csrf")
    public CsrfTokenResponseDTO getCsrfToken(@Parameter(hidden = true) CsrfToken csrfToken) {
        return new CsrfTokenResponseDTO(
                csrfToken.getHeaderName(),
                csrfToken.getParameterName(),
                csrfToken.getToken()
        );
    }
}
