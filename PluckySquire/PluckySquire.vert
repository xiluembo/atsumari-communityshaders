// PluckySquire.vert
// The Plucky Squire inspired sphere:
// - flatter/cartoon overall
// - but with slightly stronger layered relief than the previous flat variant
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

    // Slightly stronger than the previous flat version
    // to make the paper/cutout layering more visible.
    float layerA = cos(4.0 * az) * eq * 0.0095;
    float layerB = cos(8.0 * az + 0.55) * eq * eq * 0.0060;
    float pageB  = cos(6.0 * asin(clamp(y, -1.0, 1.0))) * 0.0050;

    float pulse =
        sin(t + az * 3.0) * eq * 0.0014 +
        cos(2.0 * t + y * 4.5) * 0.0011;

    float radial = 1.0 + layerA + layerB + pageB + pulse;
    radial = max(0.965, radial);

    vec3 displaced = dir * (r * radial);

    VERTEX = displaced;
    vDirOS = normalize(displaced);
    vWorldPos = (MODEL_MATRIX * vec4(displaced, 1.0)).xyz;

    POSITION = MODELVIEWPROJECTION_MATRIX * vec4(displaced, 1.0);
}
