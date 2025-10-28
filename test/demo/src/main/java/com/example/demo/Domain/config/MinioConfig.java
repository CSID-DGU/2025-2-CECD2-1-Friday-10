package com.example.demo.Domain.config;

import io.minio.MinioClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.beans.factory.annotation.Value;

@Configuration
public class MinioConfig {

    @Value("${minio.user-id}")
    private String minioId;

    @Value("${minio.user-password}")
    private String minioPassword;

    @Value("${minio.user-url}")
    private String minioUrl;

    @Bean
    public MinioClient minioClient() {
        return MinioClient.builder()
                .endpoint(minioUrl)
                .credentials(minioId, minioPassword)
                .build();
    }
}