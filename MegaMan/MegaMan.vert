// MegaMan.vert
// Mega Man inspired sphere:
// - predominantly blue
// - slightly polygonal, but still regular
// - metallic / armor-like silhouette
// - exact 60-second cycle using uTime in [1..3600]

VARYING vec3 vDirOS;
VARYING vec3 vWorldPos;

void MAIN()
{
    vec3 p = VERTEX;
    float r = length(p);

    // One full cycle every 60 seconds
    float t = uTime * 0.00174532925; // 2*PI / 3600

    vec3 dir = normalize(p);

    float az = atan(dir.z, dir.x);
    float y  = dir.y;
    float eq = 1.0 - y * y;

    // Slightly faceted / polygonal regularity
    float sectorCount = 14.0;
    float sectorSize  = 6.2831853 / sectorCount;
    float azSnap      = floor(az / sectorSize + 0.5) * sectorSize;

    float ySteps = 8.0;
    float ySnap  = floor(y * ySteps + 0.5) / ySteps;

    float xr = sqrt(max(0.0, 1.0 - ySnap * ySnap));
    vec3 facetedDir = normalize(vec3(
        cos(azSnap) * xr,
        ySnap,
        sin(azSnap) * xr
    ));

    // Slight blend toward faceted geometry
    vec3 polyDir = normalize(mix(dir, facetedDir, 0.18));

    // Regular armor-like accidents
    float ringHarmonic   = cos(6.0 * asin(clamp(y, -1.0, 1.0))) * 0.010;
    float azHarmonic     = cos(sectorCount * az) * eq * 0.012;
    float polarHarmonic  = (3.0 * y * y - 1.0) * 0.010;

    // Subtle cyclic breathing so it does not feel rigid
    float pulse =
        sin(t + az * 4.0) * eq * 0.0025 +
        cos(2.0 * t + y * 7.0) * 0.0018;

    float radial =
        1.0 +
        ringHarmonic +
        azHarmonic +
        polarHarmonic +
        pulse;

    radial = max(0.92, radial);

    vec3 displaced = polyDir * (r * radial);

    VERTEX = displaced;
    vDirOS = normalize(displaced);
    vWorldPos = (MODEL_MATRIX * vec4(displaced, 1.0)).xyz;

    POSITION = MODELVIEWPROJECTION_MATRIX * vec4(displaced, 1.03);
}
