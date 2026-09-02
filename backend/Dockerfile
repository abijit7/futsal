# Multi-stage build for the MeroFutsal API.
#
# The build stage carries Maven and the full JDK; the runtime stage keeps only a JRE and the
# fat jar, which keeps the shipped image small and drops the compiler and build cache from
# the attack surface.

# ---- build ----------------------------------------------------------------
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build

# Resolve dependencies as their own layer so that editing sources does not re-download the
# world on every rebuild.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
RUN mvn -B -DskipTests package

# ---- runtime --------------------------------------------------------------
FROM eclipse-temurin:17-jre AS runtime
WORKDIR /app

# Run as an unprivileged user. A compromised process should not own its own filesystem.
RUN groupadd --system --gid 1001 app \
 && useradd --system --uid 1001 --gid app --create-home app

COPY --from=build /build/target/futsal-booking-1.0.0.jar app.jar
RUN chown app:app app.jar
USER app

# App Service on Linux expects 8080; Container Apps injects its own PORT and
# application.properties already honours it via ${PORT:9090}.
ENV PORT=8080
EXPOSE 8080

# Container memory is usually far smaller than the host's, so let the JVM size its heap from
# the cgroup limit rather than the machine's total RAM.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75"

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
