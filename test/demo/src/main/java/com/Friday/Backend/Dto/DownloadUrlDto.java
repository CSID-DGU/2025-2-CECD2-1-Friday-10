package com.Friday.Backend.Dto;

public class DownloadUrlDto {
    private String bucket;
    private String videoName;
    private String downloadUrl;

    public DownloadUrlDto(
        String bucket,
        String videoName,
        String downloadUrl
    ) {
        this.bucket = bucket;
        this.videoName = videoName;
        this.downloadUrl = downloadUrl;
    }

    public String getBucket() {
        return bucket;
    }

    public void setBucket(String bucket) {
        this.bucket = bucket;
    }

    public String getVideotName() {
        return videoName;
    }

    public void setVideoName(String videoName) {
        this.videoName = videoName;
    }

    public String getDownloadUrl() {
        return downloadUrl;
    }

    public void setDownloadUrl(String downloadUrl) {
        this.downloadUrl = downloadUrl;
    }
}
