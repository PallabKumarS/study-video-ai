export interface CardItem {
	title: string;
	subtitle: string;
	accent: string;
}

export interface LensDiagramData {
	lens_type: "convex" | "concave";
	show_parallel_ray?: boolean;
	show_center_ray?: boolean;
	show_focal_ray?: boolean;
	object_label?: string;
	axis_label?: string;
	focal_label?: string;
}

export interface AnimationDetails {
	dimension: "3d" | "2d";
	camera_movement?: string;
	lighting?: string;
	environment?: string;
	focal_elements?: string[];
}

export interface VideoSegment {
	segment_index: number;
	tag: string;
	title: string;
	narration: string;
	bottom_caption: string;
	layout_type: "cards" | "diagram" | "3d_scene" | "hybrid_composite";
	badge_text: string;
	dimension?: "3d" | "2d";
	visual_prompt?: string;
	animation_details?: AnimationDetails;
	card_items?: CardItem[];
	diagram_type?: "none" | "lens_ray" | "3d_spatial";
	diagram_data?: LensDiagramData;
}

export interface VideoPlan {
	topic: string;
	category: string;
	language: string;
	aspect_ratio: string;
	estimated_total_seconds: number;
	segments: VideoSegment[];
	used_model?: string;
	original_prompt?: string;
}

export interface SegmentRecord {
	segment_index: number;
	tag: string;
	title: string;
	duration: number;
	video_url: string;
	thumbnail_url: string;
	narration: string;
	bottom_caption: string;
	dimension?: "3d" | "2d";
	visual_prompt?: string;
}

export interface VideoMetadata {
	job_id: string;
	topic: string;
	category: string;
	language: string;
	resolution: string;
	aspect_ratio: string;
	model_used: string;
	total_duration: number;
	total_segments: number;
	master_video_url: string;
	master_thumbnail_url: string;
	video_file_name?: string;
	original_prompt?: string;
	voice_used?: string;
	theme_used?: string;
	segments: SegmentRecord[];
	created_at: number;
	updated_at?: number;
}

export interface ThemeConfig {
	name: string;
	bgColor: string;
	glow1: string;
	glow2: string;
	barColor: string;
	pillBg: string;
	pillBorder: string;
	pillDot: string;
	gridType: "dots" | "lines" | "crosses";
	gridColor: string;
	cardBg: string;
	cardBorder: string;
	captionBg: string;
	captionBorder: string;
}

export interface ModelAdvisorProfile {
	id: string;
	name: string;
	tag: string;
	speed: string;
	token_economy: string;
	accuracy_rating: string;
	tier: string;
	recommended: boolean;
	badge: string;
	description: string;
}

export interface KeyStatus {
	key_hash: string;
	masked_key: string;
	is_active: boolean;
	valid: boolean;
	status: string;
	service_tier: string;
	tier_type?: "pro" | "free" | "payg";
	models_count: number;
	daily_limit_rpd: number;
	remaining_estimated_rpd: number;
	daily_limit_requests: number;
	remaining_daily_requests: number;
	rate_limit_rpm: number;
	token_limit_tpm: string;
	tier_explanation: string;
	today_requests: number;
	today_videos: number;
	latency_ms: number;
	last_checked: string;
}
