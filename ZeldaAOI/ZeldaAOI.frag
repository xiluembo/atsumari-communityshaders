// ZeldaAOI.frag
// Zelda AOI pulse sphere:
// - slow sine mix between the profile base color and a deep green accent
// - metallic specular response kept steady through the pulse
// MAIN-only, no custom uniforms.

float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }

void MAIN()
{
    float pulse = 0.5 + 0.5 * sin(3.14159265358979 * uTime / 60.0);
    vec4 otherColor = vec4(0.0, 0.3, 0.1, 1.0);
    BASE_COLOR = vec4(vec3(baseColor * (1-pulse)) + vec3(otherColor * pulse), 1.0);
    METALNESS = 0.6;
    SPECULAR_AMOUNT = 0.4;
    ROUGHNESS = 0.4;
}
