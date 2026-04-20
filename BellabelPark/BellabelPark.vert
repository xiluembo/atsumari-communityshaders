// BellabelPark.vert
// Stable object-space mapping for a sphere that already rotates externally.

VARYING vec3 vDirOS;
VARYING vec3 vWorldPos;

void MAIN()
{
    vec3 p = VERTEX;

    // Keep geometry stable; the scene/object rotation provides the motion.
    VERTEX = p;

    vDirOS = normalize(p);
    vWorldPos = (MODEL_MATRIX * vec4(p, 1.0)).xyz;

    POSITION = MODELVIEWPROJECTION_MATRIX * vec4(p, 1.0);
}