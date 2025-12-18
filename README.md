📄 [English Version](README_EN.md)

# 웹 기반 태권도 동작 시각화 및 분석 플랫폼
## 동작 스켈레톤의 웹 표시

2025 동국대학교 종합설계 Friday (2025.03 - 2025.12)

본 프로젝트는 영상으로부터 태권도 품새 동작을 3D 스켈레톤 및 캐릭터 애니메이션으로 시각화 하고 해당 스켈레톤 데이터를 활용하여 태권도 동작을 평가하는 플랫폼이다.

<p align="center">
  <img src="images/TrainingPage.png" width="700"/>
</p>
<p align="center">
  Demo Video:  
  https://youtu.be/PpYY7dqxQ4Q
</p>

## Project Overview

본 시스템은 **Client**와 **Server**로 구성된다.


- **Client**: 웹 브라우저 환경에서 3D 스켈레톤 시각화, 영상 재생, 녹화 및 평가 결과 표시
- **Server**: 사용자 인증, 영상 및 스켈레톤 데이터 관리, 평가 점수 저장

동작 평가 모델은 Keras를 통해 구성하였으며, TensorFlow.js를 통해 Web Client 환경에서 구동된다.
- **Inference**: 태권도 품새 동작 구분, 정확도 출력
- 모델 학습에는 다음 데이터를 이용하였다. [AI-Hub 고양시 태권도 데이터](https://aihub.or.kr/aihubdata/data/view.do?dataSetSn=71259)


## System Architecture

```
Client (Web Browser)
├── React + TypeScript
├── BlazePose GHUM (MediaPipe)
├── Three.js (3D Skeleton & Character Animation)
├── TensorFlow.js (Inference)
└── REST API
↓
Backend Server (AWS EC2)
├── Spring Boot (Java 21)
├── JWT 인증
├── MySQL (AWS RDS)
└── AWS S3 (Video 및 Skeleton Data 저장)
```



## Key Features
### Client
- Three.js 기반 3D 스켈레톤 시각화
- 영상 재생 및 스켈레톤 동기화 렌더링
- 동작 녹화 및 재생
- Evaluation Panel을 통한 점수 확인
- Presigned URL을 이용한 영상 업로드/다운로드

### Server
- JWT 기반 사용자 인증 및 권한 관리
- 영상 및 스켈레톤 메타데이터 관리
- 스켈레톤 데이터 업로드 및 조회
- 동작 평가 점수 저장 및 조회
- AWS S3 Presigned URL 생성

### Inference
- LSTM 기반 동작 분류
- Input: 시간 순서의 3D Landmark Frames
- Output: 품새 동작 클래스 및 정확도 점수

## Tech Stack
### Client
- React
- TypeScript
- Three.js
- [Three-vrm](https://github.com/pixiv/three-vrm)
- MediaPipe
- TensorFlow.js
- HTML5 / CSS3

### Server
- Java
- Spring Boot
- MySQL (AWS RDS)
- AWS EC2 / S3
- JWT Authentication

### Inference
- Python
- TensorFlow
- Keras
- TensorFlow.js
