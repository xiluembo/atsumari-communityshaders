// PokopiaCubist.vert
// Stronger relief support: pass world position for derivative-based bump.
// No time-based wobble (reduces shimmer on random rotation).

VARYING vec3 vDirOS;
VARYING vec3 vDirRawOS;
VARYING vec3 vWorldPos;

float hash1(float x) { return fract(sin(x) * 43758.5453); }
float snap1(float x, float steps) { return floor(x * steps + 0.5) / steps; }

void MAIN()
{
    vec3 p = VERTEX;

    vec3 rawDir = normalize(p);

    // Static faceting in direction space
    float steps = 10.0;
    vec3 snappedDir = normalize(vec3(
        snap1(rawDir.x, steps),
        snap1(rawDir.y, steps),
        snap1(rawDir.z, steps)
    ));

    // Blend to avoid harsh popping under rotation
    vec3 dir = normalize(mix(rawDir, snappedDir, 0.85));

    // Tiny static per-facet bump
    float seed = dot(snappedDir, vec3(12.3, 45.6, 78.9));
    float bump = (hash1(seed) - 0.5) * 0.015;

    float r = length(p);
    vec3 displaced = dir * (r * (1.0 + bump));

    // Make pipeline use displaced geometry
    VERTEX = displaced;

    vDirOS = dir;
    vDirRawOS = rawDir;

    // World position for dFdx/dFdy bump
    vWorldPos = (MODEL_MATRIX * vec4(displaced, 1.0)).xyz;

    POSITION = MODELVIEWPROJECTION_MATRIX * vec4(displaced, 1.0);
}