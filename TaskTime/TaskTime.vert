// TaskTime.vert
// Single-axis wave deformation for the Task Time palette:
// - sinusoidal Y displacement driven by X position
// - time-based phase animation for traveling waves
// - slight radial push to keep sphere volume

VARYING vec3 pos;
void MAIN()
{
    pos = VERTEX;
    float wavex = sin(pos.x * 5.0 + uTime / 10) * 2.3;
    vec3 displaced = pos + vec3(0.0, wavex, 0.0);
    POSITION = MODELVIEWPROJECTION_MATRIX * vec4(displaced, 1.03);
}
