package com.munichweekly.backend.dto;

/**
 * DTO for exposing the CSRF token header contract to browser clients.
 */
public class CsrfTokenResponseDTO {
    private String headerName;
    private String parameterName;
    private String token;

    public CsrfTokenResponseDTO() {
    }

    public CsrfTokenResponseDTO(String headerName, String parameterName, String token) {
        this.headerName = headerName;
        this.parameterName = parameterName;
        this.token = token;
    }

    public String getHeaderName() {
        return headerName;
    }

    public void setHeaderName(String headerName) {
        this.headerName = headerName;
    }

    public String getParameterName() {
        return parameterName;
    }

    public void setParameterName(String parameterName) {
        this.parameterName = parameterName;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
