import type { VideoSegment } from "../types";

export interface FrameContext {
	time: number;
	duration: number;
	progress: number;
	frameIndex: number;
	totalFrames: number;
	width: number;
	height: number;
	theme: string;
	overallProgStart: number;
	overallProgEnd: number;
}

export interface RenderAnimatedVideoParams {
	segment: VideoSegment;
	audioPath: string;
	outputMp4Path: string;
	topic: string;
	aspectRatio?: string;
	resolution?: string;
	theme?: string;
	overallProgStart?: number;
	overallProgEnd?: number;
	fps?: number;
}
