// RoboGAL.vert
// RoboGAL: Gaga Delta Lady inspired robotic shell.
// - Symmetrical armor plating
// - Slightly faceted silhouette
// - Subtle mechanical breathing
// - Seam-safe and exactly 60-second cyclic animation

VARYING vec3 vDirOS;
VARYING vec3 vWorldPos;

void MAIN()
{
    vec3 p = VERTEX;
    float r = max(length(p), 0.00001);
    vec3 d = p / r;

    const float TAU = 6.28318530718;
    float t = uTime * (TAU / 3600.0);

    float phi = atan(d.z, d.x);
    float y = d.y;
    float eq = max(0.0, 1.0 - y * y);

    // Repeating armor plates, symmetric around the vertical axis.
    float armorPlates = pow(
        abs(cos(8.0 * phi + 0.15 * sin(y * 4.0))),
        8.0
    ) * eq;

    // Gentle regular faceting.
    float facets = cos(12.0 * phi) * eq;

    // Circumferential mechanical ribs.
    float latitude = asin(clamp(y, -1.0, 1.0));
    float ribs = cos(10.0 * latitude);

    // A slow, entirely closed mechanical pulse.
    float breathe =
        0.0025 * sin(t + 4.0 * phi) * eq +
        0.0020 * cos(2.0 * t) * (1.0 - abs(y));

    float radial =
        1.0 +
        armorPlates * 0.018 +
        facets * 0.010 +
        ribs * 0.009 +
        breathe;

    radial = max(0.94, radial);

    vec3 displaced = d * (r * radial);

    VERTEX = displaced;

    vDirOS = d;
    vWorldPos = (MODEL_MATRIX * vec4(displaced, 1.0)).xyz;

    POSITION = MODELVIEWPROJECTION_MATRIX * vec4(displaced, 1.0);
}
