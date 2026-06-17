package com.munichweekly.backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.TestRestTemplate;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureTestRestTemplate;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.TestPropertySource;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureTestRestTemplate
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
        "jwt.secret=test-jwt-secret-32-bytes-minimum!!",
        "uploads.directory=${java.io.tmpdir}/munich-weekly-openapi-integration-test",
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

    @Test
    void authAndIssueOperationsExposeCuratedOpenApiMetadata() {
        @SuppressWarnings("unchecked")
        Map<String, Object> response = restTemplate.getForObject(
                "http://localhost:" + port + "/v3/api-docs",
                Map.class
        );

        assertThat(response).isNotNull();

        @SuppressWarnings("unchecked")
        Map<String, Object> paths = (Map<String, Object>) response.get("paths");

        assertOperationMetadata(paths, "/api/auth/login/email", "post",
                "Authentication", "Login with email and password");
        assertOperationResponsesInclude(operation(paths, "/api/auth/login/email", "post"), "429");
        assertOperationMetadata(paths, "/api/auth/forgot-password", "post",
                "Authentication", "Request password reset");
        assertOperationResponsesInclude(operation(paths, "/api/auth/forgot-password", "post"), "429");
        assertOperationMetadata(paths, "/api/auth/register", "post",
                "Authentication", "Register a new user");
        assertOperationMetadata(paths, "/api/auth/login/provider", "post",
                "Authentication", "Login with provider");
        assertOperationResponsesInclude(operation(paths, "/api/auth/login/provider", "post"), "501");
        assertOperationMetadata(paths, "/api/auth/bind", "post",
                "Authentication", "Bind a third-party provider");
        assertOperationResponsesInclude(operation(paths, "/api/auth/bind", "post"), "501");
        assertRequiresBearerAuth(operation(paths, "/api/auth/bind", "post"));

        assertOperationMetadata(paths, "/api/issues", "get",
                "Issues", "List issues");
        assertOperationMetadata(paths, "/api/issues", "post",
                "Issues", "Create issue");
        assertRequiresBearerAuth(operation(paths, "/api/issues", "post"));
        assertOperationMetadata(paths, "/api/issues/{id}", "delete",
                "Issues", "Delete issue");
        assertRequiresBearerAuth(operation(paths, "/api/issues/{id}", "delete"));
        assertOperationMetadata(paths, "/api/votes/check-batch", "get",
                "Votes", "Batch check vote status");
        assertOperationResponsesInclude(operation(paths, "/api/votes/check-batch", "get"), "400");

        @SuppressWarnings("unchecked")
        Map<String, Object> deleteResponses = (Map<String, Object>) operation(paths, "/api/issues/{id}", "delete").get("responses");
        assertThat(deleteResponses).containsKey("204");
    }

    private static void assertOperationMetadata(
            Map<String, Object> paths,
            String path,
            String method,
            String tag,
            String summary
    ) {
        Map<String, Object> operation = operation(paths, path, method);

        assertThat(operation.get("tags")).isEqualTo(List.of(tag));
        assertThat(operation.get("summary")).isEqualTo(summary);
    }

    private static void assertRequiresBearerAuth(Map<String, Object> operation) {
        assertThat(operation.get("security")).isEqualTo(List.of(Map.of("bearerAuth", List.of())));
    }

    @SuppressWarnings("unchecked")
    private static void assertOperationResponsesInclude(Map<String, Object> operation, String responseCode) {
        Map<String, Object> responses = (Map<String, Object>) operation.get("responses");
        assertThat(responses).containsKey(responseCode);
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> operation(Map<String, Object> paths, String path, String method) {
        Map<String, Object> pathItem = (Map<String, Object>) paths.get(path);
        assertThat(pathItem).as("OpenAPI path %s", path).isNotNull();

        Map<String, Object> operation = (Map<String, Object>) pathItem.get(method);
        assertThat(operation).as("OpenAPI operation %s %s", method.toUpperCase(), path).isNotNull();
        return operation;
    }
}
