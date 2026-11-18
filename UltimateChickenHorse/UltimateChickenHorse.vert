// UltimateChickenHorse.vert
// Handcrafted chunky sphere for an externally rotating mesh:
// - soft faceting blended back toward the original sphere
// - small stable wobble and per-direction jitter
// - radial displacement clamped to keep a chunky silhouette
// - world position exported for fragment shading

VARYING vec3 vDirOS;
VARYING vec3 vWorldPos;

float hash11(float x)
{
    return fract(sin(x) * 43758.5453);
}

float snap1(float x, float steps)
{
    return floor(x * steps + 0.5) / steps;
}

void MAIN()
{
    vec3 p = VERTEX;
    float r = length(p);

    vec3 rawDir = normalize(p);

    // Slight chunky / handmade faceting
    float steps = 10.0;
    vec3 snappedDir = normalize(vec3(
        snap1(rawDir.x, steps),
        snap1(rawDir.y, steps),
        snap1(rawDir.z, steps)
    ));

    vec3 dir = normalize(mix(rawDir, snappedDir, 0.35));

    // Small stable playful unevenness
    float wobble =
        sin(rawDir.x * 7.0 + rawDir.y * 3.0) *
        sin(rawDir.y * 6.0 + rawDir.z * 4.0) *
        sin(rawDir.z * 8.0 + rawDir.x * 2.0);

    float seed = dot(rawDir, vec3(12.7, 41.2, 79.5));
    float jitter = (hash11(seed) - 0.5) * 0.012;

    float radial = 1.0 + wobble * 0.016 + jitter;
    radial = max(0.94, radial);

    vec3 displaced = dir * r * radial;

    VERTEX = displaced;
    vDirOS = normalize(displaced);
    vWorldPos = (MODEL_MATRIX * vec4(displaced, 1.0)).xyz;

    POSITION = MODELVIEWPROJECTION_MATRIX * vec4(displaced, 1.0);
}
