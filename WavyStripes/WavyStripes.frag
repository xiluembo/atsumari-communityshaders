// WavyStripes.frag
// Minimal animated stripe sphere:
// - two-color horizontal stripe blend in UV space
// - time-based phase scrolling for continuous stripe motion
// - clean flat output focused on graphic contrast
// MAIN-only, no custom uniforms.

float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
void MAIN()
{
    vec3 otherColor = vec3(47/255.0, 0.0, 0.0);
    vec2 vUV = UV0;
    float stripe = step(0.5, fract(vUV.x * 5.0 + uTime / 120));
    BASE_COLOR = vec4(vec3(baseColor * stripe) + vec3(otherColor * (1 - stripe)), 1.0);
}
