# Use a minimal JDK runtime image
FROM eclipse-temurin:21-jdk as builder

# Set work directory inside container
WORKDIR /app

# Copy Gradle wrapper and build files
COPY gradlew build.gradle settings.gradle ./
COPY gradle gradle
COPY src src

# Pre-build dependencies to cache layers (optional optimization)
RUN ./gradlew clean build -x test --no-daemon

# Use a smaller base image for final runtime
FROM eclipse-temurin:21-jdk-jammy

WORKDIR /app

# SECURITY FIX 2025-12-16: Create non-root user to run the application
RUN groupadd --system --gid 1001 appgroup && \
    useradd --system --uid 1001 --gid appgroup --shell /bin/bash --home-dir /app appuser && \
    mkdir -p /app/docs /uploads && \
    chown -R appuser:appgroup /app /uploads

# Copy built JAR from previous build stage
COPY --from=builder --chown=appuser:appgroup /app/build/libs/*.jar app.jar

# Use environment variables for runtime config
ENV JAVA_OPTS=""

# Switch to non-root user
USER appuser

# Expose port 8080
EXPOSE 8080

# Start Spring Boot app
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]