package com.munichweekly.backend.security;

import com.munichweekly.backend.PingController;
import com.munichweekly.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = PingController.class)
@Import(SecurityConfig.class)
class SecurityConfigOpenApiTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    void openApiSchemaEndpointsArePubliclyReachable() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().is(not(401)))
                .andExpect(status().is(not(403)));

        mockMvc.perform(get("/v3/api-docs.yaml"))
                .andExpect(status().is(not(401)))
                .andExpect(status().is(not(403)));
    }
}
