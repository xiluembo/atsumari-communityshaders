// BellabelPark.vert
// Bellabel Park inspired stable sphere mapping:
// - no geometric deformation (pattern stability first)
// - object-space directions passed to fragment stage
// - intended for meshes rotating externally in scene

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
