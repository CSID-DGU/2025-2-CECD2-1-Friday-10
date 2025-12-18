package com.Friday.Backend.Dto;

import com.fasterxml.jackson.databind.JsonNode;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class SkeletonUploadDto {
    
    @NotBlank(message = "videoName은 필수 항목입니다.")
    private String videoName;
    
    @NotNull(message = "joints 데이터는 필수입니다.")
    private JsonNode joints;

    @NotBlank(message = "fileExtension은 필수 항목입니다.")
    private String fileExtension;

    public String getVideoName() {
        return videoName;
    }

    public void setVideoName(String videoName) {
        this.videoName = videoName;
    }

    public JsonNode getJoints() {
        return joints;
    }

    public void setJoints(JsonNode joints) {
        this.joints = joints;
    }

    public String getFileExtension(){
        return fileExtension;
    }

    public void setFileExtionsion(String fileExtension) {
        this.fileExtension = fileExtension;
    }
}