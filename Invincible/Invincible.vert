// Invincible.vert
// Battle-worn sphere deformation for an externally rotating mesh:
// - large directional impact dents
// - smaller chips, ridges, and stable per-direction jitter
// - radial displacement clamped so the silhouette stays spherical
// - world position exported for fragment shading

VARYING vec3 vDirOS;
VARYING vec3 vWorldPos;

float hash11(float x)
{
    return fract(sin(x) * 43758.5453);
}

void MAIN()
{
    vec3 p = VERTEX;
    vec3 dir = normalize(p);
    float r = length(p);

    // Large impact dents
    float impactA = pow(max(0.0, dot(dir, normalize(vec3( 0.72,  0.16,  0.68)))), 8.0);
    float impactB = pow(max(0.0, dot(dir, normalize(vec3(-0.56, -0.28,  0.78)))), 9.0);

    // General combat wear
    float dents =
        sin(dir.x * 8.0 + dir.y * 5.0) *
        sin(dir.y * 10.0 + dir.z * 4.0) *
        sin(dir.z * 7.0 + dir.x * 6.0);

    float chips =
        sin(dir.x * 18.0) *
        sin(dir.y * 17.0) *
        sin(dir.z * 20.0);

    float ridges = pow(abs(sin(
        dir.x * 13.0 +
        dir.y * 15.0 +
        dir.z * 12.0)), 3.0);

    float seed = dot(dir, vec3(13.7, 51.2, 87.4));
    float jitter = (hash11(seed) - 0.5) * 0.014;

    float radial =
        1.0
        - impactA * 0.055
        - impactB * 0.048
        + dents   * 0.014
        + chips   * 0.007
        + ridges  * 0.010
        + jitter;

    radial = max(0.88, radial);

    vec3 displaced = dir * r * radial;

    VERTEX = displaced;
    vDirOS = normalize(displaced);
    vWorldPos = (MODEL_MATRIX * vec4(displaced, 1.0)).xyz;

    POSITION = MODELVIEWPROJECTION_MATRIX * vec4(displaced, 1.0);
}
