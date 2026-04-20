// SF6_InkSphere.vert
// SF6 ink-inspired stable sphere mapping:
// - no deformation for clean graffiti block placement
// - object-space direction pass-through for anchored UV projection
// - world position exported for fragment shading terms

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
