package com.munichweekly.backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.TestPropertySource;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:openapi;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.show-sql=false",
        "storage.mode=LOCAL",
        "cloudflare.r2.access-key=",
        "cloudflare.r2.secret-key=",
        "cloudflare.r2.endpoint=",
        "spring.docker.compose.enabled=false"
})
class OpenApiSchemaIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void openApiDocsEndpointReturnsGeneratedSchema() {
        @SuppressWarnings("unchecked")
        Map<String, Object> response = restTemplate.getForObject(
                "http://localhost:" + port + "/v3/api-docs",
                Map.class
        );

        assertThat(response).isNotNull();
        assertThat(response.get("openapi")).asString().startsWith("3.");
        assertThat(response).containsEntry("info", Map.of(
                "title", "Munich Weekly API",
                "description", "Generated from the Spring Boot controllers and DTOs.",
                "version", "0.0.1"
        ));
        assertThat(response.get("paths")).isInstanceOf(Map.class);

        @SuppressWarnings("unchecked")
        Map<String, Object> paths = (Map<String, Object>) response.get("paths");
        assertThat(paths)
                .containsKey("/api/auth/login/email")
                .containsKey("/api/gallery/admin/issues/{issueId}/items")
                .containsKey("/api/gallery/admin/issues/{issueId}/custom-images");
    }
}
