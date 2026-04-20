// SF6_DriveImpactSphere.frag
// Street Fighter 6 "Drive Impact" inspired sphere:
// - radial impact bursts
// - neon cracks
// - shock rings
// - dark paint base with fluorescent accents
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

// Project a spherical patch around a chosen object-space direction
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

// Radial crack field
float crackField(vec2 p, float seed)
{
    float r = length(p);
    float a = atan(p.y, p.x);

    float n = noise21(vec2(a * 2.5 + seed, r * 8.0 + seed * 1.7));
    float spokes = abs(sin(a * (10.0 + floor(seed * 4.0)) + n * 5.0));

    float crack = 1.0 - smoothstep(0.02, 0.08, spokes);
    crack *= smoothstep(0.04, 0.18, r);
    crack *= (1.0 - smoothstep(0.35, 0.95, r));

    // small branch noise
    float branch = noise21(p * 14.0 + vec2(seed, seed * 2.3));
    crack *= 0.75 + 0.25 * smoothstep(0.35, 0.85, branch);

    return crack;
}

// Circular shock ring
float shockRing(vec2 p, float radius, float width)
{
    float r = length(p);
    return aaLine(abs(r - radius), width);
}

// Splattery impact blob
float impactBlob(vec2 p, float seed)
{
    float n = noise21(p * 7.0 + vec2(seed * 3.1, seed * 4.7));
    float r = length(p);
    float blob = 1.0 - smoothstep(0.18 + n * 0.08, 0.32 + n * 0.08, r);
    return blob;
}

void MAIN()
{
    vec3 d = normalize(vDirOS);

    // Base SF6 palette
    vec3 baseDark = vec3(0.05, 0.05, 0.07);
    vec3 deepPurple = vec3(0.20, 0.08, 0.34);
    vec3 neonPurple = vec3(0.58, 0.18, 0.95);
    vec3 neonBlue   = vec3(0.05, 0.70, 1.00);
    vec3 neonCyan   = vec3(0.10, 0.95, 0.95);
    vec3 neonOrange = vec3(1.00, 0.46, 0.05);
    vec3 neonPink   = vec3(1.00, 0.24, 0.62);
    vec3 inkDark    = vec3(0.02, 0.02, 0.03);

    // Base background texture, object anchored
    vec2 uv = vec2(
        atan(d.z, d.x) / 6.2831853 + 0.5,
        d.y * 0.5 + 0.5
    );

    float n1 = noise21(uv * 3.0 + vec2(0.7, 1.1));
    float n2 = noise21(uv * 5.5 + vec2(2.8, 0.3));

    vec3 col = mix(baseDark, deepPurple, smoothstep(0.35, 0.80, n1));
    col = mix(col, inkDark, smoothstep(0.62, 0.95, n2) * 0.30);

    // Two impact centers fixed in object space
    vec3 cA = normalize(vec3( 0.72,  0.18,  0.66));
    vec3 cB = normalize(vec3(-0.58, -0.42,  0.70));

    vec2 pA, pB;
    float mA, mB;
    patchProject(d, cA, pA, mA);
    patchProject(d, cB, pB, mB);

    // Time pulse for energy
    float pulse = 0.82 + 0.18 * sin(uTime * 3.0);

    // Impact A
    float blobA   = impactBlob(pA, 1.3) * mA;
    float crackA  = crackField(pA, 2.1) * mA;
    float ringA1  = shockRing(pA, 0.22, 0.020) * mA;
    float ringA2  = shockRing(pA, 0.38, 0.018) * mA;
    float coreA   = 1.0 - smoothstep(0.00, 0.14, length(pA));
    coreA *= mA;

    // Impact B
    float blobB   = impactBlob(pB, 4.7) * mB;
    float crackB  = crackField(pB, 5.2) * mB;
    float ringB1  = shockRing(pB, 0.20, 0.020) * mB;
    float ringB2  = shockRing(pB, 0.34, 0.018) * mB;
    float coreB   = 1.0 - smoothstep(0.00, 0.13, length(pB));
    coreB *= mB;

    // Composite impact colors
    vec3 impactA = vec3(0.0);
    impactA += neonOrange * blobA * 0.55;
    impactA += neonPink   * crackA * 0.65 * pulse;
    impactA += neonBlue   * ringA1 * 0.85;
    impactA += neonCyan   * ringA2 * 0.65;
    impactA += neonOrange * coreA  * 0.90;

    vec3 impactB = vec3(0.0);
    impactB += neonPurple * blobB * 0.52;
    impactB += neonBlue   * crackB * 0.70 * pulse;
    impactB += neonPink   * ringB1 * 0.75;
    impactB += neonCyan   * ringB2 * 0.60;
    impactB += neonBlue   * coreB  * 0.85;

    col += impactA + impactB;

    // Dark brush streaks passing through the surface
    float streak1 = abs(sin((d.x - d.z) * 22.0 + n1 * 9.0));
    float streak2 = abs(sin((d.x + d.y * 0.7) * 19.0 + n2 * 7.0));
    float inkMask = (1.0 - smoothstep(0.04, 0.13, streak1)) * 0.28
                  + (1.0 - smoothstep(0.03, 0.10, streak2)) * 0.20;
    col = mix(col, inkDark, clamp(inkMask, 0.0, 1.0));

    // Self-contained lighting
    vec3 N = normalize(NORMAL);
    vec3 V = normalize(VIEW_VECTOR);
    vec3 L = normalize(vec3(-0.35, 0.85, 0.35));

    float ndl = max(dot(N, L), 0.0);

    // Slight toon quantization
    float bands = 4.0;
    float q = floor(ndl * bands) / max(1.0, (bands - 1.0));
    float lit = mix(0.70, 1.00, q);
    col *= lit;

    // Stronger spec than previous simple version
    vec3 H = normalize(V + L);
    float ndh = max(dot(N, H), 0.0);
    float spec = pow(ndh, 110.0) * 0.12;
    col += vec3(1.0) * spec;

    // Colored rim
    float ndv = max(dot(N, V), 0.0);
    float rim = pow(1.0 - ndv, 2.3);
    vec3 rimColor = mix(neonBlue, neonOrange, 0.5 + 0.5 * d.y);
    col += rimColor * rim * 0.14;

    // Mild contrast / clamp
    col = (col - 0.5) * 1.08 + 0.5;
    col = clamp(col, 0.0, 1.0);

    BASE_COLOR = vec4(0.0, 0.0, 0.0, 1.0);
    EMISSIVE_COLOR = col;

    METALNESS = 0.0;
    SPECULAR_AMOUNT = 0.0;
    ROUGHNESS = 1.0;
}