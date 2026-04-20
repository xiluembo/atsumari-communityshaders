VARYING vec3 pos;
VARYING vec2 vPhaseData;

void MAIN()
{
    vec3 p = VERTEX;       // original mesh position
    float r = length(p);   // original radius

    vec3 n = normalize(p);

    float theta = atan(p.z, p.x);               // [-pi, pi]   -> angle around the Y axis
    float phi   = acos(clamp(n.y, -1.0, 1.0)); // [0, pi]     -> 0 top, pi bottom

    float equator = sin(phi);

    float swirl = sin(theta * 4.0 + uTime * 0.4);   // ~4x slower

    float breathe = sin(uTime * 0.12);              // much smoother (~80s per cycle)

    float amp = 0.12 * equator;
    float radialOffset = amp * swirl * (0.6 + 0.4 * breathe);

    float newR = r * (1.0 + radialOffset);

    vec3 deformed = normalize(p) * newR;

    pos = deformed;

    float theta01 = (theta / 6.28318530718) + 0.5;

    float phaseY = n.y + 0.25 * sin(theta * 4.0 + uTime * 0.5);
    vPhaseData = vec2(theta01, phaseY);

    const float RADIUS_PUSH = 1.12;
    POSITION = MODELVIEWPROJECTION_MATRIX * vec4(deformed, RADIUS_PUSH);
}
