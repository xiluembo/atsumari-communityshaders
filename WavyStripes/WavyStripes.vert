// WavyStripes.vert
// Single-axis wave deformation for stripe animation support:
// - sinusoidal Y displacement driven by X position
// - time-based phase animation for traveling waves
// - slight radial push to keep sphere volume

VARYING vec3 pos;
void MAIN()
{
    pos = VERTEX;
    float wave = sin(pos.x * 4.0 + uTime / 10) * 2.1;
    vec3 displaced = pos + vec3(0.0, wave, 0.0);
    POSITION = MODELVIEWPROJECTION_MATRIX * vec4(displaced, 1.03);
}
