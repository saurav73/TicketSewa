# Root Dockerfile for Hugging Face Spaces (Docker SDK).
# HF builds the image from the repo root and expects the app to listen on port 7860.
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY backend/pom.xml ./
RUN mvn -q dependency:go-offline
COPY backend/src src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/ticketsewa-1.0.0.jar app.jar
EXPOSE 7860
# PORT is provided as a Space variable (7860); JAVA_OPTS caps the heap.
ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS:-} -jar app.jar"]
