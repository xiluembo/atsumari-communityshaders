// MinaTheHollower.vert
// Mina the Hollower inspired sphere:
// - more evident but harmonious/symmetrical surface accidents
// - still mostly spherical
// - exact cyclic motion over 60 seconds

VARYING vec3 vDirOS;
VARYING vec3 vWorldPos;

void MAIN()
{
    vec3 p = VERTEX;
    float r = length(p);

    // 1 full cycle over 60 seconds
    float t = uTime * 0.00174532925; // 2*PI / 3600

    vec3 dir = normalize(p);

    float az = atan(dir.z, dir.x);
    float eq = 1.0 - dir.y * dir.y;

    // Stronger harmonic silhouette, but still symmetric and controlled
    float harmonic4 = cos(4.0 * az) * eq;
    float harmonic8 = cos(8.0 * az + 0.7) * eq * eq;
    float polar     = 3.0 * dir.y * dir.y - 1.0;
    float equator   = eq * eq;

    // Slow cyclic breathing
    float pulse =
        sin(t + 4.0 * az) * eq * 0.0030 +
        cos(t + dir.y * 6.0) * 0.0022 +
        sin(2.0 * t + 8.0 * az) * eq * 0.0015;

    float radial =
        1.0 +
        harmonic4 * 0.032 +
        harmonic8 * 0.014 +
        polar     * 0.018 +
        equator   * 0.010 +
        pulse;

    radial = max(0.90, radial);

    vec3 displaced = dir * (r * radial);

    VERTEX = displaced;
    vDirOS = normalize(displaced);
    vWorldPos = (MODEL_MATRIX * vec4(displaced, 1.0)).xyz;

    POSITION = MODELVIEWPROJECTION_MATRIX * vec4(displaced, 1.04);
}
