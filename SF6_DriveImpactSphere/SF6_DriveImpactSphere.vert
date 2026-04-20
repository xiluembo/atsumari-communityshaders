// SF6_DriveImpactSphere.vert
// Drive Impact inspired stable sphere mapping:
// - no vertex deformation to keep crack/ring masks coherent
// - object-space direction pass-through for anchored projection
// - world position exported for view/light shaping in fragment

VARYING vec3 vDirOS;
VARYING vec3 vWorldPos;

void MAIN()
{
    vec3 p = VERTEX;

    VERTEX = p;

    vDirOS = normalize(p);
    vWorldPos = (MODEL_MATRIX * vec4(p, 1.0)).xyz;

    POSITION = MODELVIEWPROJECTION_MATRIX * vec4(p, 1.0);
}
