package com.munichweekly.backend;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.TestPropertySource;

import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:openapi-drift;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1",
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
        "uploads.directory=${java.io.tmpdir}/munich-weekly-openapi-drift-test",
        "spring.docker.compose.enabled=false"
})
class OpenApiSchemaDriftTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void committedOpenApiSchemaMatchesGeneratedSchema() throws Exception {
        Path committedSchemaPath = Path.of(System.getProperty("user.dir"))
                .resolve("../docs/api.json")
                .normalize();

        JsonNode committedSchema = objectMapper.readTree(committedSchemaPath.toFile());
        ResponseEntity<String> generatedResponse = restTemplate.getForEntity(
                "http://localhost:" + port + "/v3/api-docs",
                String.class
        );
        assertThat(generatedResponse.getStatusCode().is2xxSuccessful()).isTrue();

        JsonNode generatedSchema = objectMapper.readTree(generatedResponse.getBody());

        assertThat(generatedSchema)
                .as("Regenerate docs/api.json with scripts/generate-openapi.sh after backend API changes")
                .isEqualTo(committedSchema);
    }
}
