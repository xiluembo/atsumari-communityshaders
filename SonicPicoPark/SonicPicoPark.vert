// SonicPicoPark.vert
// Sonic Pico Park-inspired cooperative level sphere for QtQuick3D.
// Only uTime is required; one exact loop over uTime = 1..3600.
// Object-space geometry; no UV seam and no artificial polar caps.

VARYING vec3 vDirOS;
VARYING vec3 vWorldPos;

void MAIN()
{
    const float TAU = 6.28318530718;
    float t = (uTime - 1.0) * (TAU / 3599.0);

    vec3 p = VERTEX;
    float originalRadius = max(length(p), 0.00001);
    vec3 d = p / originalRadius;

    float phi = atan(d.z, d.x);
    float latitude = asin(clamp(d.y, -1.0, 1.0));
    float equator = max(0.0, 1.0 - d.y * d.y);

    // A regular octagonal rhythm suggests the square Pico Park tiles.
    // The envelope smoothly removes longitude-dependent shapes at poles.
    float polygon = cos(8.0 * phi) * equator * equator;
    float rimSteps = cos(10.0 * latitude);

    // Embossed structural ribs, not spikes or exaggerated mountains.
    float raisedTiles =
        pow(abs(d.x * d.y * d.z) * 3.0, 2.0);

    // Cyclic, small movements make the puzzle platform feel alive.
    float elasticMotion =
        0.0024 * sin(t + 4.0 * phi) * equator +
        0.0017 * cos(2.0 * t + 6.0 * latitude);

    float radial =
        1.0 +
        0.011 * polygon +
        0.007 * rimSteps +
        0.007 * raisedTiles +
        elasticMotion;

    vec3 displaced = d * (originalRadius * max(radial, 0.95));

    VERTEX = displaced;
    vDirOS = d;
    vWorldPos = (MODEL_MATRIX * vec4(displaced, 1.0)).xyz;
    POSITION = MODELVIEWPROJECTION_MATRIX * vec4(displaced, 1.0);
}
