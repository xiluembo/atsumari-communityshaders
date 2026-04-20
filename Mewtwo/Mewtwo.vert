// Mewtwo.vert
// Mewtwo inspired "psychic cocoon" sphere deformation:
// - angular swirl waves around the Y axis
// - slow breathing pulse over radial displacement
// - equator-weighted deformation profile
// - phase channels exported for fragment color/stripe animation

VARYING vec3 pos;
VARYING vec2 vPhaseData;

void MAIN()
{
    vec3 p = VERTEX;       // original mesh position
    float r = length(p);   // original radius

    // approximate normal (sphere centered at the origin)
    vec3 n = normalize(p);

    // spherical coordinates
    float theta = atan(p.z, p.x);               // [-pi, pi]   -> angle around the Y axis
    float phi   = acos(clamp(n.y, -1.0, 1.0)); // [0, pi]     -> 0 top, pi bottom

    // ===== "psychic cocoon" deformation =====
    // equator ~1 at the equator, ~0 at the poles
    float equator = sin(phi);

    // radial waves rotating around the Y axis
    // BEFORE: sin(theta * 6.0 + uTime * 0.8);
    float swirl = sin(theta * 6.0 + uTime * 0.4);   // ~4x slower

    // slow radius pulse (psychic breathing)
    // BEFORE: sin(uTime * 0.25);
    float breathe = sin(uTime * 0.12);              // much smoother (~80s per cycle)

    // combined amplitude: stronger at the equator, weaker at the poles
    float amp = 0.08 * equator;        // ~8% of the radius at maximum
    float radialOffset = amp * swirl * (0.6 + 0.4 * breathe);

    float newR = r * (1.0 + radialOffset);

    vec3 deformed = normalize(p) * newR;

    pos = deformed;

    // ===== phase data for the fragment shader =====
    // vPhaseData.x: normalized angular position [0,1]
    float theta01 = (theta / 6.28318530718) + 0.5;

    // vPhaseData.y: "psychic" band rotating around the Y axis
    float phaseY = n.y + 0.25 * sin(theta * 4.0 + uTime * 0.5);
    vPhaseData = vec2(theta01, phaseY);

    const float RADIUS_PUSH = 1.12;
    POSITION = MODELVIEWPROJECTION_MATRIX * vec4(deformed, RADIUS_PUSH);
}
