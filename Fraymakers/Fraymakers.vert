// Fraymakers.vert
// Mostly spherical cyclic deformation:
// - one closed animation cycle every 60 seconds
// - very small breathing and traveling waves
// - silhouette kept nearly round for badge motion in the fragment
// - world position exported for fragment shading

VARYING vec3 vDirOS;
VARYING vec3 vWorldPos;

void MAIN()
{
    vec3 p = VERTEX;
    float r = length(p);

    // 1 full cycle per 60 seconds
    float t = uTime * 0.00174532925; // 2*PI / 3600

    vec3 dir = normalize(p);

    // Very subtle breathing so the silhouette stays almost spherical
    float breathe = sin(t + dir.y * 2.2) * 0.0035;
    float waveA   = sin(t * 2.0 + dir.x * 2.8 + dir.z * 1.6) * 0.0020;
    float waveB   = cos(t * 1.0 - dir.z * 2.4 + dir.y * 1.9) * 0.0015;

    float radial = 1.0 + breathe + waveA + waveB;

    vec3 displaced = dir * (r * radial);

    VERTEX = displaced;
    vDirOS = normalize(displaced);
    vWorldPos = (MODEL_MATRIX * vec4(displaced, 1.0)).xyz;

    POSITION = MODELVIEWPROJECTION_MATRIX * vec4(displaced, 1.0);
}
