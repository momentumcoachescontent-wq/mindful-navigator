
export interface AudioTrack {
    id: string;
    title: string;
    description: string | null;
    category: 'meditation' | 'music' | 'guide' | 'sounds' | string;
    audio_url: string;
    image_url: string | null;
    duration: number | null;
    is_premium: boolean;
    is_featured?: boolean;
    source_table?: 'audio_content' | 'meditations';
    mediaType?: string;
    narrator?: string | null;
    created_at?: string;
}

export interface AudioState {
    currentTrack: AudioTrack | null;
    isPlaying: boolean;
    progress: number; // 0-100 or seconds? Let's use seconds for now, or percentage. HTML Audio uses seconds.
    duration: number; // seconds
    volume: number; // 0-1
    isExpanded: boolean; // For mobile full screen player
}
