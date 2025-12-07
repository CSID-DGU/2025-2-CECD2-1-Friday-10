import json

import numpy as np
from glob import glob
import os

from collections import defaultdict

# -----------------------------------------------------
# Mediapipe 33 관절 인덱스에 따른 한국어 관절 이름 매핑 테이블
# JSON에 있는 관절 이름만 포함하며, 없는 관절은 None으로 처리됨
# -----------------------------------------------------
JOINT_NAME_TO_INDEX = {
    # Head & Face
    "코": 0, "왼쪽 눈": 1, "오른쪽 눈": 2,
    # "왼쪽 귀": 7, "오른쪽 귀": 8, # JSON에 있는 관절

    # Shoulders (index 5, 6, 9, 10은 눈/귀 사이의 중간점 등으로 JSON에 없음)
    "왼쪽 귀": 7, "오른쪽 귀": 8,
    "왼쪽 어깨": 11, "오른쪽 어깨": 12,

    # Arms
    "왼쪽 팔꿈치": 13, "오른쪽 팔꿈치": 14,
    "왼쪽 손목": 15, "오른쪽 손목": 16,

    # Hands (Mediapipe는 손가락 끝까지 포함. JSON 데이터와 매핑)
    "왼쪽 엄지 손가락": 17,  # 엄지 끝
    "오른쪽 엄지 손가락": 18,  # 엄지 끝
    "왼쪽 중지 손가락": 19,  # 중지 끝
    "오른쪽 중지 손가락": 20,  # 중지 끝
    # (21, 22는 새끼손가락 끝 등으로, JSON 데이터에 없음)

    # Hips & Trunk
    "왼쪽 엉덩이": 23, "오른쪽 엉덩이": 24,  # 엉덩이

    # Legs
    "왼쪽 무릎": 25, "오른쪽 무릎": 26,
    "왼쪽 발목": 27, "오른쪽 발목": 28,
    "왼쪽 뒷꿈치": 29, "오른쪽 뒷꿈치": 30,  # 발꿈치
    "왼쪽 엄지 발가락": 31, "오른쪽 엄지 발가락": 32,  # 엄지발가락 끝
    # "왼쪽 새끼 발가락" 및 "오른쪽 새끼 발가락"은 Mediapipe 인덱스 31, 32 다음으로 매핑될 수 있지만,
    # Mediapipe 표준 33개 인덱스를 초과하지 않도록 주의. (31/32에 엄지 발가락만 매핑하고 나머지는 제외)
    # JSON에 있는 '왼쪽 새끼 발가락', '오른쪽 새끼 발가락'은 33개 인덱스 밖이므로 제외하거나, 인덱스 31, 32와 가까운 다른 곳에 매핑해야 함

    # JSON에 있지만 Mediapipe 33에 포함 안되는 항목 (또는 다른 인덱스에 해당)
    # 여기서는 JSON에 명시된 '가운데 엉덩이'를 P_ref 계산 시 사용했으므로, 배열에는 0으로 남겨둡니다.
    # '목'은 인덱스 1 (코) 근처의 중간점으로 추정할 수 있으나, 표준을 위해 제외합니다.
}

def normalize(raw_skeleton):
    normalized_skeleton = []
    for frame in raw_skeleton:
        P_ref = (frame[23] + frame[24]) / 2
        P_prime = frame - P_ref
        L = np.linalg.norm(frame[11] - frame[12])
        if L > 1e-6:
            P_double_prime = P_prime / L
        else:
            P_double_prime = P_prime  # 정규화하지 않음

        normalized_skeleton.append(P_double_prime)
    return np.array(normalized_skeleton)

def load_skeleton_from_json(json_file):
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    pose_data = data["labelingInfo"][0]["pose"]["location"]

    skeleton_array = np.zeros((33, 2), dtype=np.float32)

    # JSON 데이터를 순회하며 매핑 및 저장
    for k_name, v_coords in pose_data.items():

        # 1. 한국어 이름이 매핑 테이블에 있는지 확인
        if k_name in JOINT_NAME_TO_INDEX:
            index = JOINT_NAME_TO_INDEX[k_name]

            # 2. 좌표를 float으로 변환
            x = float(v_coords["x"])
            y = float(v_coords["y"])

            # 3. 해당 인덱스에 저장
            skeleton_array[index, 0] = x
            skeleton_array[index, 1] = y

        # (주의: JSON에 '가운데 엉덩이'가 있지만, 이는 정규화 시 P_ref 계산에 사용될 뿐,
        # Mediapipe 표준 인덱스에는 명시적으로 존재하지 않으므로 배열에 직접 저장하지 않습니다.)

    return skeleton_array

def load_and_preprocess_sequence_data(data_root):
    X_sequences = []
    Y_labels = []

    label_map = {
        '기본준비': 0,
        '앞굽이하고 아래막고 지르기': 1,
        '앞굽이하고 아래막기': 2,
        '앞굽이하고 지르기': 3,
        '앞서고 아래막기': 4,
        '앞서고 안막기': 5,
        '앞서고 얼굴막기': 6,
        '앞서고 지르기': 7,
        '앞차고 앞서고 지르기': 8
    }

    FRAME_TYPES = ['S01', 'M01', 'E01']

    grouped_data = {}


    json_files = glob(os.path.join(data_root, '**', '*.json'), recursive=True)

    for file_path in json_files:

        # 파일 경로에서 정보 추출 (경로를 역순으로 파싱)
        parts = file_path.split(os.sep)

        # 동작명은 태극1장 다음 폴더명 (예: '기본준비')
        action_name = parts[-5]  # 태극 1장 폴더명에서 5번째 상위 폴더

        filename = parts[-1]  # 파일명 (P-001-001-A035-M-B2006-S-20211109-05-01-M01.json)

        # 파일명에서 정보 추출
        name_parts = filename.split('-')

        # 시도 ID: P-001-...-05 부분
        attempt_id = '-'.join(name_parts[0:8])

        # 시점 번호: 01, 02, ..., 08
        view_id = name_parts[-2]

        # 프레임 타입: M01.json -> M01
        frame_type = name_parts[-1].split('.')[0]

        if frame_type in FRAME_TYPES:
            key = (action_name, attempt_id, view_id)

            if key not in grouped_data:
                grouped_data[key] = {}

            grouped_data[key][frame_type] = file_path

    # ------------------
    # 2. 시퀀스 구성 및 정규화
    # ------------------

    for (action_name, attempt_id, view_id), paths in grouped_data.items():
        # M01(Start), M02(Middle), M03(End) 세 프레임 경로가 모두 있는지 확인
        if all(ft in paths for ft in FRAME_TYPES):

            # 각 프레임의 데이터를 로드합니다.
            frame_data = []
            for ft in FRAME_TYPES:
                # 사용자가 제공한 load_skeleton_from_json 함수 사용
                data = load_skeleton_from_json(paths[ft])
                frame_data.append(data)

            # (3, 33, 2) 형태의 시퀀스 생성
            raw_sequence = np.stack(frame_data, axis=0)

            # 정규화 수행
            normalized_sequence = normalize(raw_sequence)

            # 데이터와 레이블 저장
            X_sequences.append(normalized_sequence)
            Y_labels.append(label_map[action_name])

    return np.array(X_sequences), np.array(Y_labels), label_map
