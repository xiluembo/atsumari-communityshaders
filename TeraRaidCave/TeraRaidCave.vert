// TeraRaidCave.vert
// Dark crystalline sphere for a Tera Raid cave look.
// Stable in object space, so the pattern rotates naturally with the sphere.

VARYING vec3 vDirOS;
VARYING vec3 vDirRawOS;
VARYING vec3 vWorldPos;

float hash1(float x) { return fract(sin(x) * 43758.5453); }
float snap1(float x, float steps) { return floor(x * steps + 0.5) / steps; }

void MAIN()
{
    vec3 p = VERTEX;

    vec3 rawDir = normalize(p);

    // Crystal-like faceting
    float steps = 12.0;
    vec3 snappedDir = normalize(vec3(
        snap1(rawDir.x, steps),
        snap1(rawDir.y, steps),
        snap1(rawDir.z, steps)
    ));

    // Keep spherical silhouette while still feeling faceted
    vec3 dir = normalize(mix(rawDir, snappedDir, 0.74));

    // Tiny static per-facet irregularity
    float seed = dot(snappedDir, vec3(15.7, 52.9, 81.3));
    float bump = (hash1(seed) - 0.5) * 0.022;

    float r = length(p);
    vec3 displaced = dir * (r * (1.0 + bump));

    VERTEX = displaced;

    vDirOS = dir;
    vDirRawOS = rawDir;
    vWorldPos = (MODEL_MATRIX * vec4(displaced, 1.0)).xyz;

    POSITION = MODELVIEWPROJECTION_MATRIX * vec4(displaced, 1.0);
}
