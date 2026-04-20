// SF6_InkSphere.frag
// Simple Street Fighter 6-inspired sphere:
// - graffiti color blocks
// - paint splats
// - ink/brush streaks
// - slight toon shading + rim
// MAIN-only, no custom uniforms.

VARYING vec3 vDirOS;
VARYING vec3 vWorldPos;

float hash21(vec2 p)
{
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float noise21(vec2 p)
{
    vec2 i = floor(p);
    vec2 f = fract(p);

    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Sparse paint splat inside a tiled grid
float paintSplat(vec2 uv, float scale)
{
    vec2 g = uv * scale;
    vec2 id = floor(g);
    vec2 f = fract(g) - 0.5;

    float h = hash21(id);

    // Sparse placement
    if (h < 0.72)
        return 0.0;

    vec2 c = vec2(
        hash21(id + vec2(1.7, 2.3)),
        hash21(id + vec2(4.1, 0.9))
    ) - 0.5;

    float r = 0.10 + 0.10 * hash21(id + vec2(8.2, 3.6));

    float d0 = length(f - c);
    float d1 = length(f - (c * 0.55 + vec2( 0.16, -0.08)));
    float d2 = length(f - (c * 0.45 + vec2(-0.14,  0.10)));

    float m0 = 1.0 - smoothstep(r,         r + 0.025, d0);
    float m1 = 1.0 - smoothstep(r * 0.45,  r * 0.45 + 0.02, d1);
    float m2 = 1.0 - smoothstep(r * 0.32,  r * 0.32 + 0.02, d2);

    return max(m0, max(m1 * 0.85, m2 * 0.75));
}

void MAIN()
{
    vec3 d = normalize(vDirOS);

    // Stable spherical UV in object space
    vec2 uv = vec2(
        atan(d.z, d.x) / 6.2831853 + 0.5,
        d.y * 0.5 + 0.5
    );

    // Street/graffiti-inspired palette
    vec3 asphalt = vec3(0.05, 0.05, 0.07);
    vec3 purple  = vec3(0.42, 0.18, 0.78);
    vec3 blue    = vec3(0.08, 0.58, 0.96);
    vec3 orange  = vec3(0.98, 0.46, 0.08);
    vec3 yellow  = vec3(0.96, 0.82, 0.18);
    vec3 inkDark = vec3(0.03, 0.03, 0.04);

    // Large graffiti fields
    float n1 = noise21(uv * 3.2 + vec2(1.1, 0.3));
    float n2 = noise21(uv * 2.1 + vec2(4.3, 2.7));
    float n3 = noise21(uv * 4.0 + vec2(0.7, 5.2));

    float mPurple = smoothstep(0.42, 0.68, n1 + d.x * 0.22 - d.y * 0.08);
    float mOrange = smoothstep(0.46, 0.72, n2 - d.z * 0.18 + d.y * 0.10);
    float mBlue   = smoothstep(0.50, 0.76, n3 + d.z * 0.20);

    vec3 col = asphalt;
    col = mix(col, purple, mPurple * 0.85);
    col = mix(col, orange, mOrange * 0.78);
    col = mix(col, blue,   mBlue   * 0.72);

    // Yellow accent band
    float accent = 0.5 + 0.5 * sin((d.x + d.z) * 15.0 + n2 * 6.0);
    accent = smoothstep(0.74, 0.90, accent);
    col = mix(col, yellow, accent * 0.28);

    // Paint splats
    float splat1 = paintSplat(uv + vec2(0.11, 0.03), 5.5);
    float splat2 = paintSplat(uv + vec2(-0.07, 0.16), 7.0);

    col = mix(col, orange, splat1 * 0.65);
    col = mix(col, blue,   splat2 * 0.55);

    // Ink / brush streaks
    float streakA = abs(sin((d.x - d.z) * 18.0 + n1 * 7.0));
    float streakB = abs(sin((d.x + d.y) * 20.0 + n2 * 8.0));

    float inkA = 1.0 - smoothstep(0.08, 0.16, streakA);
    float inkB = 1.0 - smoothstep(0.06, 0.13, streakB);

    float inkMask = max(inkA * 0.55, inkB * 0.40);
    col = mix(col, inkDark, inkMask);

    // Simple self-contained lighting
    vec3 N = normalize(NORMAL);
    vec3 V = normalize(VIEW_VECTOR);
    vec3 L = normalize(vec3(-0.35, 0.85, 0.35));

    float ndl = max(dot(N, L), 0.0);

    // Slight toon feel
    float bands = 4.0;
    float q = floor(ndl * bands) / max(1.0, (bands - 1.0));
    float lit = mix(0.72, 1.0, q);
    col *= lit;

    // Gloss highlight
    vec3 H = normalize(V + L);
    float ndh = max(dot(N, H), 0.0);
    float spec = pow(ndh, 90.0) * 0.10;
    col += vec3(1.0) * spec;

    // Colored rim
    float ndv = max(dot(N, V), 0.0);
    float rim = pow(1.0 - ndv, 2.4);
    vec3 rimColor = mix(blue, orange, 0.5 + 0.5 * d.y);
    col += rimColor * rim * 0.12;

    // Output
    BASE_COLOR = vec4(0.0, 0.0, 0.0, 1.0);
    EMISSIVE_COLOR = clamp(col, 0.0, 1.0);

    METALNESS = 0.0;
    SPECULAR_AMOUNT = 0.0;
    ROUGHNESS = 1.0;
}