package com.Friday.Backend.Dto;

import jakarta.validation.constraints.NotNull;

public class ScoreUploadDto {

    @NotNull(message = "점수는 필수 입력 항목입니다.")
    private String score;

    public String getScore() {
        return score;
    }

    public void SetScore(String score) {
        this.score = score;
    }
}
