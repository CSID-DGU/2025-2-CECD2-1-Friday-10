package com.example.demo.Domain.Service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
//import software.amazon.awssdk.services.s3.model.ServerSideEncryption;

import java.time.Duration;

@Service
public class S3Service {

    private final S3Presigner presigner;

    @Value("${aws.kms.key-arn}")
    private String kmsKeyArn;

    public S3Service(S3Presigner presigner) {
        this.presigner = presigner;
    }

    public String getUploadUrl(String bucket, String objectName) {
        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(objectName)
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(10))
                .putObjectRequest(putObjectRequest)
                .build();

        return presigner.presignPutObject(presignRequest).url().toString();
    }

    public String getDownloadUrl(String bucket, String objectName) {
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucket)
                .key(objectName)
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(10))
                .getObjectRequest(getObjectRequest)
                .build();

        return presigner.presignGetObject(presignRequest).url().toString();
    }
}