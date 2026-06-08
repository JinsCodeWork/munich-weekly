package com.munichweekly.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:context-loads;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1",
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
        "uploads.directory=${java.io.tmpdir}/munich-weekly-context-loads-test",
        "spring.docker.compose.enabled=false"
})
class BackendApplicationTests {

    @Test
    void contextLoads() {
    }

}
