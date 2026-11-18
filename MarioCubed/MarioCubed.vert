// MarioCubed.vert
// Cubic voxel snap for a Mario-like block sphere:
// - uniform 3D quantization into flat voxel faces
// - per-column sine kept available for a height-only alternative
// - slight radial push on the snapped position

VARYING vec3 pos;

float snap1D(float v, float s) {
    return floor(v / s + 0.5) * s;
}

vec3 snap3D(vec3 p, vec3 cell) {
    return vec3(
        snap1D(p.x, cell.x),
        snap1D(p.y, cell.y),
        snap1D(p.z, cell.z)
    );
}

void MAIN()
{
    pos = VERTEX;

    // Voxel size (tune to taste)
    const vec3 cell = vec3(8,8,8);

    // Freezing the sine per column keeps voxel faces flat
    float colX = snap1D(pos.x, cell.x);
    float wave = sin(colX * 4.0 + uTime / 10.0) * 2.1;

    // Quantize only the height OR the final result.
    // (A) quantize only the height:
    // float y = snap1D(pos.y + wave, cell.y);
    vec3 displaced = vec3(pos.x, pos.y, pos.z);
    vec3 voxelPos  = snap3D(displaced, cell);

    // (B) quantize the final point in 3D (more "blocky" silhouette):
    // vec3 displaced = pos + vec3(0.0, wave, 0.0);
    // vec3 voxelPos  = snap3D(displaced, cell);

    POSITION = MODELVIEWPROJECTION_MATRIX * vec4(voxelPos, 1.08);
}
