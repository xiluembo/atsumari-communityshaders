// SF6_InkSphere.vert
// Stable object-space mapping for a rotating sphere.

VARYING vec3 vDirOS;
VARYING vec3 vWorldPos;

void MAIN()
{
    vec3 p = VERTEX;

    // No deformation: keep it stable while the sphere rotates externally
    VERTEX = p;

    vDirOS = normalize(p);
    vWorldPos = (MODEL_MATRIX * vec4(p, 1.0)).xyz;

    POSITION = MODELVIEWPROJECTION_MATRIX * vec4(p, 1.0);
}