// src/evaluation/TaekwonClassifier.ts

import * as tf from '@tensorflow/tfjs';

import { type NormalizedLandmark } from '@mediapipe/tasks-vision';

const JOINT_INDEX = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOUDLER: 12,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
};

const MODEL_URL = '/model/tsjs_model_output_v2/model.json'

interface PredictionResult {
  action: string;
  probability: number;
}

export class TaekwonClassifier {
  private model: tf.LayersModel | null = null;
  private readonly modelUrl: string;
  private readonly classNames: string[];

  private sequenceBuffer: number[][][] = [];
  private readonly SEQUENCE_LENGTH = 3;

  constructor(modelUrl: string, classNames: string[]) {
    this.modelUrl = modelUrl;
    this.classNames = classNames;
  }

  public async loadModel(): Promise<void> {
    try {
      this.model = await tf.loadLayersModel(this.modelUrl);
      console.log("TensorFlow.js model loaded successfully.")
    } catch (error) {
      console.error("Failed to load model: ", error);
      throw new Error("Failed to load the classification model");
    }
  }

  private normalizeSkeleton(landmarks: NormalizedLandmark[]): number[][] {
    const normalized: number[][] = [];

    const P_ref_x = (landmarks[23].x + landmarks[24].x) / 2;
    const P_ref_y = (landmarks[23].y + landmarks[24].y) / 2;

    const P_prime: number[][] = [];
    for(let i = 0; i < landmarks.length; i++) {
      P_prime.push([
        landmarks[i].x - P_ref_x,
        landmarks[i].y - P_ref_y
      ]);
    }

    const shoulderDistX = landmarks[11].x - landmarks[12].x;
    const shoulderDistY = landmarks[11].y - landmarks[12].y;
    const L = Math.sqrt(shoulderDistX * shoulderDistX + shoulderDistY * shoulderDistY);

    if(L > 1e-6) {
      for(let i = 0; i < P_prime.length; i++) {
        normalized.push([
          P_prime[i][0] / L,
          P_prime[i][1] / L
        ]);
      }
    } else {
      normalized.push(...P_prime);
    }

    return normalized;

  }

  public async processFrame(rawFrame: NormalizedLandmark[]): Promise<PredictionResult | null> {
    if(!this.model) {
      throw new Error("Model is not loaded, Call loadModel() first!!");
    }

    const normalized = this.normalizeSkeleton(rawFrame);

    // update buffer
    this.sequenceBuffer.push(normalized);
    if(this.sequenceBuffer.length > this.SEQUENCE_LENGTH) {
      this.sequenceBuffer.shift();
    }

    if(this.sequenceBuffer.length < this.SEQUENCE_LENGTH) {
      return null;
    }

    return this.runPrediction();

  }

  private async runPrediction(): Promise<PredictionResult> {
    // (3, 33, 2) --> (1, 3, 66)
    const flattened = this.sequenceBuffer.map(frame => frame.flat());

    const inputTensor = tf.tensor(flattened, [1, this.SEQUENCE_LENGTH, 66], 'float32');

    const prediction = this.model!.predict(inputTensor) as tf.Tensor;

    const predictionArray = prediction.dataSync();
    tf.dispose(inputTensor);
    tf.dispose(prediction);

    const maxProb = Math.max(...predictionArray);
    const predictedClassIndex = predictionArray.indexOf(maxProb);

    return {
      action: this.classNames[predictedClassIndex],
      probability: maxProb,
    };
  }
}