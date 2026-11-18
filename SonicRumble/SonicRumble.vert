// SonicRumble.vert
// Sonic Rumble inspired stable sphere mapping:
// - no geometric deformation, so ring and sparkle masks stay anchored
// - object-space direction passed to the fragment stage
// - world position exported for shading
// - intended for meshes rotating externally in the scene

VARYING vec3 vDirOS;
VARYING vec3 vWorldPos;

void MAIN()
{
    vec3 p = VERTEX;

    // Keep the mesh stable; object rotation in the scene provides motion.
    VERTEX = p;

    vDirOS = normalize(p);
    vWorldPos = (MODEL_MATRIX * vec4(p, 1.0)).xyz;

    POSITION = MODELVIEWPROJECTION_MATRIX * vec4(p, 1.0);
}
