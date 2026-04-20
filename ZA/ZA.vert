VARYING vec3 pos;
VARYING vec2 vPhaseData;

// ===== utility =====
float snap1D(float v, float s) { return floor(v / s + 0.5) * s; }

// --------- HEX (axial/cube coords) ---------
// Convert Cartesian (x,z) -> axial (q,r) for "pointy-top" orientation
vec2 cart_to_axial_pointy(vec2 p, float size) {
    float q = (1.7320508075688772 * 0.3333333333333 * p.x - 0.3333333333333 * p.y) / size;
    float r = (0.6666666666667 * p.y) / size;
    return vec2(q, r);
}
vec2 axial_to_cart_pointy(vec2 a, float size) {
    float x = size * (1.7320508075688772 * a.x + 0.8660254037844386 * a.y);
    float z = size * (1.5 * a.y);
    return vec2(x, z);
}
vec3 cube_round(vec3 c) {
    vec3 rc = floor(c + 0.5);
    vec3 diff = abs(rc - c);
    if (diff.x > diff.y && diff.x > diff.z)      rc.x = -rc.y - rc.z;
    else if (diff.y > diff.z)                    rc.y = -rc.x - rc.z;
    else                                         rc.z = -rc.x - rc.y;
    return rc;
}
vec2 hex_snap_pointy(vec2 xz, float size) {
    vec2 a  = cart_to_axial_pointy(xz, size);
    vec3 c  = vec3(a.x, -a.x - a.y, a.y);
    vec3 cr = cube_round(c);
    vec2 ar = vec2(cr.x, cr.z);
    return axial_to_cart_pointy(ar, size);
}

// ===== dominant face selection (cube-map style) =====
int dominant_axis(vec3 n) {
    vec3 an = abs(n);
    // Tie-break favors Y for better vertical stability
    if (an.x > an.y && an.x > an.z) return 0; // X-dominant -> YZ plane
    if (an.y >= an.z)               return 1; // Y-dominant -> XZ plane
    return 2;                                   // Z-dominant -> XY plane
}

void MAIN()
{
    pos = VERTEX;

    // ===== parameters =====
    const float HEX_SIZE   = 6.0;   // hex "radius" (adjust to your scale)
    const float STEP_AXIS  = 3.0;   // quantization along the axis perpendicular to the selected plane
    const float RADIUS_PUSH = 1.12; // subtle push like in your shader

    // For a sphere centered at the origin, normal ≈ normalized position.
    // (If applied to other geometry, replace with the proper transformed NORMAL)
    vec3 n = normalize(pos);

    int face = dominant_axis(n);

    vec3 voxelPos;
    vec2 phase; // for vPhaseData
    if (face == 0) {
        // X-dominant: use YZ plane and quantize X
        vec2 yz  = vec2(pos.y, pos.z);
        vec2 hYZ = hex_snap_pointy(yz, HEX_SIZE);
        float xq = snap1D(pos.x, STEP_AXIS);
        voxelPos = vec3(xq, hYZ.x, hYZ.y);
        phase    = hYZ; // keep phase in the active plane
    } else if (face == 1) {
        // Y-dominant: use XZ plane and quantize Y
        vec2 xz  = vec2(pos.x, pos.z);
        vec2 hXZ = hex_snap_pointy(xz, HEX_SIZE);
        float yq = snap1D(pos.y, STEP_AXIS);
        voxelPos = vec3(hXZ.x, yq, hXZ.y);
        phase    = hXZ;
    } else {
        // Z-dominant: use XY plane and quantize Z
        vec2 xy  = vec2(pos.x, pos.y);
        vec2 hXY = hex_snap_pointy(xy, HEX_SIZE);
        float zq = snap1D(pos.z, STEP_AXIS);
        voxelPos = vec3(hXY.x, hXY.y, zq);
        phase    = hXY;
    }

    vPhaseData = phase;

    POSITION = MODELVIEWPROJECTION_MATRIX * vec4(voxelPos, RADIUS_PUSH);
}
