// SonicRumble.frag
// Sonic Rumble inspired sphere:
// - bright blue toy/plastic base
// - golden ring motifs
// - checkerboard accents
// - star sparkles
// - glossy arcade-like finish
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

float ringShape(vec2 p, float radius, float width)
{
    float r = length(p);
    return aaLine(abs(r - radius), width);
}

float starShape(vec2 p, vec2 c, float s)
{
    vec2 q = p - c;
    float core = 1.0 - smoothstep(s * 0.22, s * 0.55, length(q));

    float crossA = aaLine(abs(q.x), s * 0.12) * (1.0 - smoothstep(0.0, s, abs(q.y)));
    float crossB = aaLine(abs(q.y), s * 0.12) * (1.0 - smoothstep(0.0, s, abs(q.x)));

    float diagA = aaLine(abs(q.x - q.y) * 0.7071, s * 0.10) * (1.0 - smoothstep(0.0, s * 1.2, length(q)));
    float diagB = aaLine(abs(q.x + q.y) * 0.7071, s * 0.10) * (1.0 - smoothstep(0.0, s * 1.2, length(q)));

    return max(core, max(max(crossA, crossB), max(diagA * 0.75, diagB * 0.75)));
}

void MAIN()
{
    vec3 d = normalize(vDirOS);

    // Stable spherical UV
    vec2 uv = vec2(
        atan(d.z, d.x) / 6.2831853 + 0.5,
        d.y * 0.5 + 0.5
    );

    // Sonic-inspired palette
    vec3 sonicBlue  = vec3(0.04, 0.44, 0.96);
    vec3 skyBlue    = vec3(0.28, 0.74, 1.00);
    vec3 deepBlue   = vec3(0.03, 0.16, 0.46);
    vec3 ringGold   = vec3(0.98, 0.78, 0.12);
    vec3 warmGold   = vec3(1.00, 0.88, 0.34);
    vec3 arcadeRed  = vec3(0.95, 0.18, 0.14);
    vec3 cleanWhite = vec3(0.98, 0.98, 1.00);
    vec3 darkInk    = vec3(0.02, 0.04, 0.10);

    // Base toy/plastic blue body
    float n1 = noise21(uv * 3.0 + vec2(0.7, 1.3));
    float n2 = noise21(uv * 6.0 + vec2(3.1, 0.5));

    vec3 col = mix(sonicBlue, skyBlue, smoothstep(0.28, 0.82, n1));
    col = mix(col, deepBlue, smoothstep(0.60, 0.95, n2) * 0.22);

    // Equatorial checker accent band
    float band = 1.0 - smoothstep(0.14, 0.18, abs(d.y));
    vec2 checkerUV = vec2(
        atan(d.z, d.x) / 6.2831853 * 16.0,
        d.y * 10.0
    );
    vec2 checkCell = floor(checkerUV);
    float checker = mod(checkCell.x + checkCell.y, 2.0);
    vec3 checkerCol = mix(arcadeRed, cleanWhite, checker);

    col = mix(col, checkerCol, band * 0.30);

    // Two ring-emblem areas on the sphere
    vec3 cA = normalize(vec3( 0.78,  0.22,  0.58));
    vec3 cB = normalize(vec3(-0.52, -0.38,  0.76));

    vec2 pA, pB;
    float mA, mB;
    patchProject(d, cA, pA, mA);
    patchProject(d, cB, pB, mB);

    float ringA1 = ringShape(pA, 0.22, 0.020) * mA;
    float ringA2 = ringShape(pA, 0.30, 0.018) * mA;
    float ringB1 = ringShape(pB, 0.20, 0.020) * mB;
    float ringB2 = ringShape(pB, 0.29, 0.018) * mB;

    float ringMask = ringA1 + ringA2 + ringB1 + ringB2;
    col = mix(col, ringGold, clamp(ringMask * 0.90, 0.0, 1.0));

    // Ring cores / medallion centers
    float coreA = 1.0 - smoothstep(0.0, 0.14, length(pA));
    float coreB = 1.0 - smoothstep(0.0, 0.13, length(pB));
    coreA *= mA;
    coreB *= mB;

    col = mix(col, warmGold, clamp(coreA * 0.35 + coreB * 0.35, 0.0, 1.0));

    // Star sparkles near the ring areas
    float starA = starShape(pA, vec2( 0.10, -0.06), 0.11) * mA;
    float starB = starShape(pA, vec2(-0.16,  0.14), 0.08) * mA;
    float starC = starShape(pB, vec2( 0.14,  0.08), 0.10) * mB;
    float starD = starShape(pB, vec2(-0.08, -0.12), 0.07) * mB;

    float starMask = starA + starB + starC + starD;
    col += cleanWhite * starMask * 0.35;

    // Fast stripe accents for extra arcade energy
    float stripe = abs(sin((d.x - d.z) * 16.0 + n1 * 4.5));
    float stripeMask = 1.0 - smoothstep(0.10, 0.18, stripe);
    col = mix(col, skyBlue, stripeMask * 0.10);

    // Tiny golden sparkle specks
    float speck = step(0.992, hash21(floor(uv * 40.0)));
    col += ringGold * speck * 0.18;

    // Self-contained lighting
    vec3 N = normalize(NORMAL);
    vec3 V = normalize(VIEW_VECTOR);
    vec3 L = normalize(vec3(-0.32, 0.86, 0.38));

    float ndl = max(dot(N, L), 0.0);

    // Soft toon-ish plastic shading
    float bands = 4.0;
    float q = floor(ndl * bands) / max(1.0, (bands - 1.0));
    float lit = mix(0.76, 1.00, q);
    col *= lit;

    // Glossy plastic specular
    vec3 H = normalize(V + L);
    float ndh = max(dot(N, H), 0.0);
    float spec = pow(ndh, 100.0) * 0.14;
    col += vec3(1.0) * spec;

    // Soft fake environment reflection
    vec3 R = reflect(-V, N);
    vec3 envTop = vec3(0.62, 0.85, 1.00);
    vec3 envBot = vec3(0.10, 0.16, 0.34);
    float envT = clamp(R.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 env = mix(envBot, envTop, envT);

    float ndv = max(dot(N, V), 0.0);
    float fres = pow(1.0 - ndv, 3.0);
    col = mix(col, env, fres * 0.12);

    // Colored rim light
    float rim = pow(1.0 - ndv, 2.4);
    vec3 rimColor = mix(skyBlue, ringGold, 0.5 + 0.5 * d.y);
    col += rimColor * rim * 0.12;

    // Final arcade-like grade
    col = (col - 0.5) * 1.08 + 0.5;
    col = pow(clamp(col, 0.0, 1.0), vec3(0.95));

    BASE_COLOR = vec4(0.0, 0.0, 0.0, 1.0);
    EMISSIVE_COLOR = clamp(col, 0.0, 1.0);

    METALNESS = 0.0;
    SPECULAR_AMOUNT = 0.0;
    ROUGHNESS = 1.0;
}
