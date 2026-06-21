package com.munichweekly.backend.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.munichweekly.backend.controller.CsrfController;
import com.munichweekly.backend.model.User;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {
        CsrfController.class,
        SecurityConfigCsrfTest.PublicVoteController.class
})
@Import({
        SecurityConfig.class,
        SecurityConfigCsrfTest.CsrfTestControllers.class
})
class SecurityConfigCsrfTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private com.munichweekly.backend.repository.UserRepository userRepository;

    @TestConfiguration
    static class CsrfTestControllers {
        @Bean
        PublicVoteController publicVoteController() {
            return new PublicVoteController();
        }
    }

    @Test
    void cookieBackedVoteMutationWithoutCsrfTokenIsRejected() throws Exception {
        mockMvc.perform(post("/api/votes").param("submissionId", "1"))
                .andExpect(status().isForbidden());
    }

    @Test
    void cookieBackedCancelVoteMutationWithoutCsrfTokenIsRejected() throws Exception {
        mockMvc.perform(delete("/api/votes").param("submissionId", "1"))
                .andExpect(status().isForbidden());
    }

    @Test
    void csrfMatcherNormalizesPathParametersBeforeMatchingVoteMutations() {
        SecurityContextHolder.clearContext();
        try {
            assertThat(SecurityConfig.requiresCsrfProtection(new MockHttpServletRequest("POST", "/api/votes;source=gallery")))
                    .isTrue();
            assertThat(SecurityConfig.requiresCsrfProtection(new MockHttpServletRequest("DELETE", "/api/votes;source=gallery")))
                    .isTrue();

            MockHttpServletRequest requestWithContextPath =
                    new MockHttpServletRequest("POST", "/weekly/api/votes;source=gallery");
            requestWithContextPath.setContextPath("/weekly");
            assertThat(SecurityConfig.requiresCsrfProtection(requestWithContextPath)).isTrue();
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    @Test
    void authenticatedBearerVoteMutationWithoutCsrfTokenRemainsAllowed() throws Exception {
        stubAuthenticatedBearerToken();

        mockMvc.perform(post("/api/votes")
                        .param("submissionId", "1")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer user-token"))
                .andExpect(status().isOk());
    }

    @Test
    void authenticatedBearerCancelVoteMutationWithoutCsrfTokenRemainsAllowed() throws Exception {
        stubAuthenticatedBearerToken();

        mockMvc.perform(delete("/api/votes")
                        .param("submissionId", "1")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer user-token"))
                .andExpect(status().isOk());
    }

    @Test
    void invalidBearerVoteMutationWithoutCsrfTokenIsRejected() throws Exception {
        when(jwtUtil.extractUserId("bad-token")).thenThrow(new JwtException("bad token"));

        mockMvc.perform(post("/api/votes")
                        .param("submissionId", "1")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer bad-token"))
                .andExpect(status().isForbidden());
    }

    @Test
    void voteReadEndpointsRemainCsrfFree() throws Exception {
        mockMvc.perform(get("/api/votes/check").param("submissionId", "1"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/votes/check-batch").param("submissionIds", "1,2"))
                .andExpect(status().isOk());
    }

    @Test
    void unrelatedUnsafeApiRequestWithoutCsrfTokenRemainsAllowed() throws Exception {
        mockMvc.perform(post("/api/auth/csrf-free-test"))
                .andExpect(status().isOk());
    }

    @Test
    void csrfEndpointIssuesTokenThatAuthorizesCookieBackedVoteMutations() throws Exception {
        MvcResult csrfResult = mockMvc.perform(get("/api/csrf"))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("XSRF-TOKEN"))
                .andExpect(cookie().httpOnly("XSRF-TOKEN", true))
                .andExpect(jsonPath("$.headerName").value("X-XSRF-TOKEN"))
                .andExpect(jsonPath("$.parameterName").value("_csrf"))
                .andExpect(jsonPath("$.token").isString())
                .andReturn();

        Map<String, String> tokenResponse = objectMapper.readValue(
                csrfResult.getResponse().getContentAsByteArray(),
                new TypeReference<>() {
                }
        );
        Cookie csrfCookie = csrfResult.getResponse().getCookie("XSRF-TOKEN");

        assertThat(csrfCookie).isNotNull();

        mockMvc.perform(post("/api/votes")
                        .param("submissionId", "1")
                        .cookie(csrfCookie)
                        .header(tokenResponse.get("headerName"), tokenResponse.get("token")))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/votes")
                        .param("submissionId", "1")
                        .cookie(csrfCookie)
                        .header(tokenResponse.get("headerName"), tokenResponse.get("token")))
                .andExpect(status().isOk());
    }

    private void stubAuthenticatedBearerToken() {
        User user = mock(User.class);
        when(user.getId()).thenReturn(7L);
        when(user.getRole()).thenReturn("user");
        when(user.getIsBanned()).thenReturn(false);
        when(jwtUtil.extractUserId("user-token")).thenReturn(7L);
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
    }

    @RestController
    public static class PublicVoteController {
        @PostMapping("/api/votes")
        Map<String, Boolean> vote() {
            return Map.of("accepted", true);
        }

        @DeleteMapping("/api/votes")
        Map<String, Boolean> cancelVote() {
            return Map.of("accepted", true);
        }

        @GetMapping("/api/votes/check")
        Map<String, Boolean> checkVote() {
            return Map.of("voted", false);
        }

        @GetMapping("/api/votes/check-batch")
        Map<String, Object> checkVotesBatch() {
            return Map.of("statuses", Map.of(), "totalChecked", 0);
        }

        @PostMapping("/api/auth/csrf-free-test")
        Map<String, Boolean> unrelatedMutation() {
            return Map.of("accepted", true);
        }
    }

}
