// BellabelPark.frag
// Super Mario Bros. Wonder - Bellabel Park inspired sphere:
// - grassy / sky / flowerbed color fields
// - large stylized flowers
// - iridescent bubble rings
// - soft sparkles
// - cheerful Nintendo-like shading
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

float aaLine(float dist, float w)
{
    float aa = max(fwidth(dist), 1e-4);
    return 1.0 - smoothstep(w - aa, w + aa, dist);
}

// Stable spherical patch projection around a chosen object-space direction.
void patchProject(in vec3 dir, in vec3 centerDir, out vec2 p2, out float patchMask)
{
    vec3 up = abs(centerDir.y) > 0.9 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
    vec3 xA = normalize(cross(up, centerDir));
    vec3 yA = cross(centerDir, xA);

    float z = dot(dir, centerDir);
    vec2 q = vec2(dot(dir, xA), dot(dir, yA));

    p2 = q / max(0.18, z + 0.18);

    float maxAngle = 0.72;
    float zMin = cos(maxAngle);
    patchMask = smoothstep(zMin, zMin + 0.05, z);
}

// Stylized flower with rounded petals + center disk.
float flowerMask(vec2 p, float petalCount, float innerR, float outerR)
{
    float r = length(p);
    float a = atan(p.y, p.x);

    float petalWave = 0.5 + 0.5 * cos(a * petalCount);
    float petalR = mix(innerR, outerR, pow(petalWave, 1.4));

    float petals = 1.0 - smoothstep(petalR, petalR + 0.020, r);
    float center = 1.0 - smoothstep(innerR * 0.55, innerR * 0.55 + 0.018, r);

    return max(petals, center);
}

// Bubble ring with soft iridescent feel.
float bubbleRing(vec2 p, float radius, float width)
{
    float r = length(p);
    return aaLine(abs(r - radius), width);
}

// Small sparkle / glint.
float sparkle(vec2 p, vec2 c, float s)
{
    vec2 q = p - c;
    float core = 1.0 - smoothstep(s * 0.30, s * 0.65, length(q));
    float crossA = aaLine(abs(q.x), s * 0.18) * (1.0 - smoothstep(s * 0.1, s, abs(q.y)));
    float crossB = aaLine(abs(q.y), s * 0.18) * (1.0 - smoothstep(s * 0.1, s, abs(q.x)));
    return max(core * 0.8, max(crossA, crossB));
}

void MAIN()
{
    vec3 d = normalize(vDirOS);

    // Stable spherical UV
    vec2 uv = vec2(
        atan(d.z, d.x) / 6.2831853 + 0.5,
        d.y * 0.5 + 0.5
    );

    // Bellabel Park inspired palette
    vec3 leafGreen   = vec3(0.54, 0.84, 0.38);
    vec3 grassBright = vec3(0.68, 0.90, 0.46);
    vec3 skyBlue     = vec3(0.52, 0.78, 0.98);
    vec3 aqua        = vec3(0.52, 0.90, 0.92);
    vec3 daisyWhite  = vec3(0.98, 0.98, 0.94);
    vec3 daisyYellow = vec3(0.98, 0.84, 0.28);
    vec3 flowerPink  = vec3(0.96, 0.62, 0.78);
    vec3 flowerLav   = vec3(0.78, 0.66, 0.96);
    vec3 warmPath    = vec3(0.96, 0.78, 0.50);
    vec3 deepLeaf    = vec3(0.24, 0.50, 0.18);

    // Base park-like fields
    float n1 = noise21(uv * 3.0 + vec2(0.8, 1.2));
    float n2 = noise21(uv * 5.5 + vec2(3.2, 0.6));
    float n3 = noise21(uv * 2.4 + vec2(6.1, 2.5));

    vec3 col = mix(leafGreen, grassBright, smoothstep(0.28, 0.78, n1));
    col = mix(col, skyBlue, smoothstep(0.62, 0.92, n2) * 0.38);
    col = mix(col, warmPath, smoothstep(0.55, 0.88, n3) * 0.22);

    // Subtle "park path / flowerbed" bands
    float band = 0.5 + 0.5 * sin((d.x + d.z) * 10.0 + n2 * 5.0);
    band = smoothstep(0.76, 0.94, band);
    col = mix(col, warmPath, band * 0.16);

    // Several stable flower centers on the sphere
    vec3 cA = normalize(vec3( 0.78,  0.12,  0.62));
    vec3 cB = normalize(vec3(-0.50,  0.56,  0.66));
    vec3 cC = normalize(vec3( 0.10, -0.62,  0.77));

    vec2 pA, pB, pC;
    float mA, mB, mC;
    patchProject(d, cA, pA, mA);
    patchProject(d, cB, pB, mB);
    patchProject(d, cC, pC, mC);

    float fA = flowerMask(pA, 6.0, 0.12, 0.24) * mA;
    float fB = flowerMask(pB, 5.0, 0.11, 0.21) * mB;
    float fC = flowerMask(pC, 7.0, 0.10, 0.22) * mC;

    float coreA = 1.0 - smoothstep(0.00, 0.070, length(pA));
    float coreB = 1.0 - smoothstep(0.00, 0.065, length(pB));
    float coreC = 1.0 - smoothstep(0.00, 0.060, length(pC));
    coreA *= mA;
    coreB *= mB;
    coreC *= mC;

    col = mix(col, daisyWhite, fA * 0.75);
    col = mix(col, flowerPink, fB * 0.55);
    col = mix(col, flowerLav,  fC * 0.50);

    col = mix(col, daisyYellow, coreA * 0.95);
    col = mix(col, daisyYellow, coreB * 0.85);
    col = mix(col, daisyYellow, coreC * 0.85);

    // Bubble rings
    float ringA = bubbleRing(pA, 0.32, 0.016) * mA;
    float ringB = bubbleRing(pB, 0.27, 0.016) * mB;
    float ringC = bubbleRing(pC, 0.36, 0.016) * mC;

    vec3 bubbleA = mix(aqua, skyBlue, 0.5 + 0.5 * sin(uTime * 1.7 + 1.2));
    vec3 bubbleB = mix(flowerLav, aqua, 0.5 + 0.5 * sin(uTime * 1.5 + 2.4));
    vec3 bubbleC = mix(daisyWhite, skyBlue, 0.5 + 0.5 * sin(uTime * 1.3 + 0.5));

    col += bubbleA * ringA * 0.35;
    col += bubbleB * ringB * 0.28;
    col += bubbleC * ringC * 0.30;

    // Sparkles
    float spA = sparkle(pA, vec2( 0.18, -0.10), 0.10) * mA;
    float spB = sparkle(pB, vec2(-0.14,  0.12), 0.09) * mB;
    float spC = sparkle(pC, vec2( 0.08,  0.16), 0.08) * mC;

    col += daisyWhite * (spA * 0.35 + spB * 0.30 + spC * 0.30);

    // Gentle leafy line accents
    float leafStroke = abs(sin((d.x - d.z) * 16.0 + n1 * 6.0));
    float strokeMask = 1.0 - smoothstep(0.03, 0.10, leafStroke);
    col = mix(col, deepLeaf, strokeMask * 0.10);

    // Self-contained shading
    vec3 N = normalize(NORMAL);
    vec3 V = normalize(VIEW_VECTOR);
    vec3 L = normalize(vec3(-0.30, 0.88, 0.30));

    float ndl = max(dot(N, L), 0.0);

    // Soft toon-ish quantization
    float bands = 4.0;
    float q = floor(ndl * bands) / max(1.0, (bands - 1.0));
    float lit = mix(0.78, 1.0, q);
    col *= lit;

    // Dew-like glossy highlight
    vec3 H = normalize(V + L);
    float ndh = max(dot(N, H), 0.0);
    float spec = pow(ndh, 80.0) * 0.08;
    col += vec3(1.0) * spec;

    // Soft colorful rim
    float ndv = max(dot(N, V), 0.0);
    float rim = pow(1.0 - ndv, 2.3);
    vec3 rimColor = mix(aqua, daisyYellow, 0.5 + 0.5 * d.y);
    col += rimColor * rim * 0.10;

    // Final cheerful grade
    col = (col - 0.5) * 1.06 + 0.5;
    col = pow(clamp(col, 0.0, 1.0), vec3(0.96));

    BASE_COLOR = vec4(0.0, 0.0, 0.0, 1.0);
    EMISSIVE_COLOR = clamp(col, 0.0, 1.0);

    METALNESS = 0.0;
    SPECULAR_AMOUNT = 0.0;
    ROUGHNESS = 1.0;
}