// ZeldaOoT.vert
// The Legend of Zelda: Ocarina of Time (2026) inspired relic.
// Symmetric carved stone / gilded armor silhouette.
// The entire animation closes exactly when uTime jumps 3600 -> 1.
// QtQuick3D CustomMaterial.Shaded - MAIN only.

VARYING vec3 vDirOS;
VARYING vec3 vWorldPos;

const float TAU = 6.28318530718;

void MAIN()
{
    vec3 p = VERTEX;
    float radius = max(length(p), 0.00001);
    vec3 d = p / radius;

    float t = (uTime - 1.0) * (TAU / 3599.0);
    float phi = atan(d.z, d.x);
    float latitude = asin(clamp(d.y, -1.0, 1.0));
    float eq = max(0.0, 1.0 - d.y * d.y);

    // Symmetric temple-stone facets: no random silhouette noise.
    float arch6 = cos(6.0 * phi) * eq * eq;
    float arch12 = cos(12.0 * phi + 0.20) * eq * eq * eq;

    // Broad ridges resemble concentric sculpted stone and bronze rings.
    float stoneBelts = cos(8.0 * latitude);
    float fineBelts = cos(16.0 * latitude + 0.32);

    // Raised geometric relief, deliberately regular.
    float radial = 1.0
        + 0.026 * arch6
        + 0.009 * arch12
        + 0.014 * stoneBelts
        + 0.004 * fineBelts;

    // A slow magical resonance, with no abrupt frame transitions.
    radial += 0.0026 * sin(t) * (0.5 + 0.5 * arch6);
    radial += 0.0015 * cos(2.0 * t) * eq;

    vec3 displaced = d * (radius * radial);

    VERTEX = displaced;
    vDirOS = d; // Stable object-space coordinates, regardless of sphere rotation.
    vWorldPos = (MODEL_MATRIX * vec4(displaced, 1.0)).xyz;
    POSITION = MODELVIEWPROJECTION_MATRIX * vec4(displaced, 1.0);
}
