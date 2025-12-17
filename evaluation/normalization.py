import json

import numpy as np
from glob import glob
import os

from collections import defaultdict

JOINT_NAME_TO_INDEX = {
    # Head & Face
    "코": 0, "왼쪽 눈": 1, "오른쪽 눈": 2,
    "왼쪽 귀": 7, "오른쪽 귀": 8,
    "왼쪽 어깨": 11, "오른쪽 어깨": 12,

    # Arms
    "왼쪽 팔꿈치": 13, "오른쪽 팔꿈치": 14,
    "왼쪽 손목": 15, "오른쪽 손목": 16,

    # Hands
    "왼쪽 엄지 손가락": 17,
    "오른쪽 엄지 손가락": 18,
    "왼쪽 중지 손가락": 19,
    "오른쪽 중지 손가락": 20,

    # Hips & Trunk
    "왼쪽 엉덩이": 23, "오른쪽 엉덩이": 24,

    # Legs
    "왼쪽 무릎": 25, "오른쪽 무릎": 26,
    "왼쪽 발목": 27, "오른쪽 발목": 28,
    "왼쪽 뒷꿈치": 29, "오른쪽 뒷꿈치": 30,
    "왼쪽 엄지 발가락": 31, "오른쪽 엄지 발가락": 32,
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

    for k_name, v_coords in pose_data.items():
        if k_name in JOINT_NAME_TO_INDEX:
            index = JOINT_NAME_TO_INDEX[k_name]

            x = float(v_coords["x"])
            y = float(v_coords["y"])

            skeleton_array[index, 0] = x
            skeleton_array[index, 1] = y


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

        parts = file_path.split(os.sep)

        action_name = parts[-5]
        filename = parts[-1]

        name_parts = filename.split('-')
        attempt_id = '-'.join(name_parts[0:8])
        view_id = name_parts[-2]

        frame_type = name_parts[-1].split('.')[0]

        if frame_type in FRAME_TYPES:
            key = (action_name, attempt_id, view_id)

            if key not in grouped_data:
                grouped_data[key] = {}

            grouped_data[key][frame_type] = file_path


    for (action_name, attempt_id, view_id), paths in grouped_data.items():
        if all(ft in paths for ft in FRAME_TYPES):

            frame_data = []
            for ft in FRAME_TYPES:
                data = load_skeleton_from_json(paths[ft])
                frame_data.append(data)

            raw_sequence = np.stack(frame_data, axis=0)

            normalized_sequence = normalize(raw_sequence)

            X_sequences.append(normalized_sequence)
            Y_labels.append(label_map[action_name])

    return np.array(X_sequences), np.array(Y_labels), label_map
