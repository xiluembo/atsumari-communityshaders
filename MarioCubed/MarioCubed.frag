// MarioCubed.frag
// Profile base color on the cubed sphere:
// - color comes from the profile base color
// - metallic specular response for a glossy block surface
// MAIN-only, no custom uniforms.

void MAIN()
{
    BASE_COLOR = vec4(vec3(baseColor), 1.0);
    METALNESS = 0.6;
    SPECULAR_AMOUNT = 0.6;
    ROUGHNESS = 0.4;
}
