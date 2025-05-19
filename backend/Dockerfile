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

RUN mkdir -p /app/docs
# Copy built JAR from previous build stage
COPY --from=builder /app/build/libs/*.jar app.jar

# Use environment variables for runtime config
ENV JAVA_OPTS=""

# Expose port 8080
EXPOSE 8080

# Start Spring Boot app
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]