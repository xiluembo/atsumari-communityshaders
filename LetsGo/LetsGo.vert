// LetsGo.vert
// Pokémon Let's Go Pikachu/Eevee inspired sphere.
// - Soft toy-like silhouette
// - Harmonic, gentle deformation
// - Exact 60-second cycle using uTime in [1..3600]

VARYING vec3 vDirOS;
VARYING vec3 vWorldPos;

void MAIN()
{
    vec3 p = VERTEX;
    float r = length(p);

    // 1 full cycle every 60 seconds
    float t = uTime * 0.00174532925; // 2*PI / 3600

    vec3 dir = normalize(p);

    float az = atan(dir.z, dir.x);
    float eq = 1.0 - dir.y * dir.y;

    // Soft partner-toy deformation: visible but not rugged
    float softLobes =
        cos(4.0 * az + t * 0.35) * eq * 0.010 +
        cos(2.0 * az - t * 0.25) * eq * eq * 0.006;

    float plushBreath =
        sin(t * 0.55 + dir.y * 2.6) * 0.004 +
        sin(t * 0.35 + dir.x * 2.0 + dir.z * 1.4) * 0.003;

    float radial = 1.0 + softLobes + plushBreath;
    radial = max(0.96, radial);

    vec3 displaced = dir * (r * radial);

    VERTEX = displaced;
    vDirOS = normalize(displaced);
    vWorldPos = (MODEL_MATRIX * vec4(displaced, 1.0)).xyz;

    POSITION = MODELVIEWPROJECTION_MATRIX * vec4(displaced, 1.0);
}
