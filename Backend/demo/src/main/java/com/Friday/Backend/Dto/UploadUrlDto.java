package com.Friday.Backend.Dto;

public class UploadUrlDto {
    private String bucket;
    private String objectName;
    private String uploadUrl;

    public UploadUrlDto(String bucket, String objectName, String uploadUrl) {
        this.bucket = bucket;
        this.objectName = objectName;
        this.uploadUrl = uploadUrl;
    }

    public String getBucket() {
        return bucket;
    }

    public void setBucket(String bucket) {
        this.bucket = bucket;
    }

    public String getObjectName() {
        return objectName;
    }

    public void setObjectName(String objectName) {
        this.objectName = objectName;
    }

    public String getUploadUrl() {
        return uploadUrl;
    }

    public void setUploadUrl(String uploadUrl) {
        this.uploadUrl = uploadUrl;
    }
}