package com.munichweekly.backend.controller;

import com.munichweekly.backend.dto.BindRequestDTO;
import com.munichweekly.backend.dto.UserAuthProviderLoginRequestDTO;
import com.munichweekly.backend.service.AuthRateLimitService;
import com.munichweekly.backend.service.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthProviderDisabledControllerTest {

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void providerLoginIsDisabledBeforeTrustingClientProviderIdentity() {
        UserService userService = mock(UserService.class);
        AuthController controller = new AuthController(userService, mock(AuthRateLimitService.class));

        assertThatThrownBy(controller::loginWithProvider)
                .isInstanceOfSatisfying(ResponseStatusException.class, ex -> {
                    assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_IMPLEMENTED);
                    assertThat(ex.getReason()).isEqualTo("Third-party authentication is not enabled.");
                });

        verify(userService, never()).loginWithThirdParty(any(UserAuthProviderLoginRequestDTO.class));
    }

    @Test
    void providerBindIsDisabledBeforeTrustingClientProviderIdentity() {
        UserService userService = mock(UserService.class);
        AuthController controller = new AuthController(userService, mock(AuthRateLimitService.class));

        assertThatThrownBy(controller::bindProvider)
                .isInstanceOfSatisfying(ResponseStatusException.class, ex -> {
                    assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_IMPLEMENTED);
                    assertThat(ex.getReason()).isEqualTo("Third-party authentication is not enabled.");
                });

        verify(userService, never()).bindThirdPartyAccount(any(), any(BindRequestDTO.class));
    }

    @Test
    void providerLoginIsDisabledEvenWithMissingBody() throws Exception {
        MockMvc mockMvc = mockMvc();

        mockMvc.perform(post("/api/auth/login/provider"))
                .andExpect(status().isNotImplemented());
    }

    @Test
    void providerBindIsDisabledEvenWithMalformedBody() throws Exception {
        MockMvc mockMvc = mockMvc();

        mockMvc.perform(post("/api/auth/bind")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{"))
                .andExpect(status().isNotImplemented());
    }

    private static MockMvc mockMvc() {
        return MockMvcBuilders.standaloneSetup(new AuthController(
                mock(UserService.class),
                mock(AuthRateLimitService.class)
        )).build();
    }

    private static UserAuthProviderLoginRequestDTO providerLoginRequest() {
        UserAuthProviderLoginRequestDTO dto = new UserAuthProviderLoginRequestDTO();
        dto.setProvider("google");
        dto.setProviderUserId("attacker-controlled-subject");
        dto.setDisplayName("Client Controlled Name");
        dto.setAvatarUrl("https://example.com/avatar.png");
        return dto;
    }

    private static BindRequestDTO bindRequest() {
        BindRequestDTO dto = new BindRequestDTO();
        dto.setProvider("google");
        dto.setProviderUserId("attacker-controlled-subject");
        dto.setDisplayName("Client Controlled Name");
        dto.setAvatarUrl("https://example.com/avatar.png");
        return dto;
    }
}
