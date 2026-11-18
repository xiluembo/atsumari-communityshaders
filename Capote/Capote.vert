// Capote.vert
// Card-table inspired sphere:
// - regular but slightly carved/faceted
// - harmonic surface accidents
// - exact 60-second cycle using uTime in [1..3600]

VARYING vec3 vDirOS;
VARYING vec3 vWorldPos;

void MAIN()
{
    vec3 p = VERTEX;
    float r = length(p);

    // One full cycle every 60 seconds.
    float t = uTime * 0.00174532925; // 2*PI / 3600

    vec3 dir = normalize(p);

    float az = atan(dir.z, dir.x);
    float y = dir.y;
    float eq = 1.0 - y * y;

    // Regular card-table / token-like harmonics.
    float h4  = cos(4.0  * az) * eq * 0.012;
    float h8  = cos(8.0  * az + 0.4) * eq * eq * 0.010;
    float h16 = cos(16.0 * az) * eq * eq * 0.005;

    // Latitudinal grooves, like circular tracks for cards.
    float rings =
        cos(10.0 * asin(clamp(y, -1.0, 1.0))) * 0.007;

    // Slow, subtle breathing.
    float pulse =
        sin(t + 4.0 * az) * eq * 0.0020 +
        cos(2.0 * t + y * 5.0) * 0.0015;

    float radial =
        1.0 +
        h4 +
        h8 +
        h16 +
        rings +
        pulse;

    radial = max(0.93, radial);

    vec3 displaced = dir * (r * radial);

    VERTEX = displaced;
    vDirOS = normalize(displaced);
    vWorldPos = (MODEL_MATRIX * vec4(displaced, 1.0)).xyz;

    POSITION = MODELVIEWPROJECTION_MATRIX * vec4(displaced, 1.0);
}
