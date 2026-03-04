export interface TextureConfig {
    width: number;
    height: number;
    scale: number;
    jitter: number;
    color: [number, number, number];
    power: number;
    invert: boolean;
    edgeFade: number;
    distanceType: number; // 0 = Euclidean, 1 = Manhattan
    multiColor: boolean;
    blurRadius: number;
    blurPasses: number;
}

export const state: TextureConfig = {
    width: 512,
    height: 512,
    scale: 3.0,
    jitter: 1.0,
    color: [0.2, 0.6, 1.0], 
    power: 2.0,
    invert: true,
    edgeFade: 0.5,
    distanceType: 0,
    multiColor: false,
    blurRadius: 0,
    blurPasses: 1
};

export function hexToRgb(hex: string): [number, number, number] {
    const bigint = parseInt(hex.slice(1), 16);
    return [
        ((bigint >> 16) & 255) / 255.0,
        ((bigint >> 8) & 255) / 255.0,
        (bigint & 255) / 255.0
    ];
}