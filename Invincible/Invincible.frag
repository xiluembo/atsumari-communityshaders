// Invincible.frag
// Brutal Invincible-themed shader:
// - darker Viltrumite-battle mood
// - aggressive comic halftone
// - dried blood + fresh blood
// - Invincible blue/yellow
// - Omni-Man red/white
// - Atom Eve pink/magenta energy
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

float segmentStroke(vec2 p, vec2 a, vec2 b, float w)
{
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0.0, 1.0);
    float d = length(pa - ba * h);
    float aa = max(fwidth(d), 1e-4);
    return 1.0 - smoothstep(w - aa, w + aa, d);
}

void patchProject(in vec3 dir, in vec3 centerDir, out vec2 p2, out float patchMask)
{
    vec3 up = abs(centerDir.y) > 0.9 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
    vec3 xA = normalize(cross(up, centerDir));
    vec3 yA = cross(centerDir, xA);

    float z = dot(dir, centerDir);
    vec2 q = vec2(dot(dir, xA), dot(dir, yA));

    p2 = q / max(0.18, z + 0.18);

    float maxAngle = 0.78;
    float zMin = cos(maxAngle);
    patchMask = smoothstep(zMin, zMin + 0.05, z);
}

float blob(vec2 p, vec2 c, float r)
{
    float d = length(p - c);
    return 1.0 - smoothstep(r, r + 0.028, d);
}

float bloodSplat(vec2 p, float seed)
{
    vec2 c0 = vec2( 0.00,  0.00);
    vec2 c1 = vec2( 0.10 * sin(seed * 2.1),  0.08 * cos(seed * 1.7));
    vec2 c2 = vec2(-0.13 * cos(seed * 1.3),  0.06 * sin(seed * 2.8));
    vec2 c3 = vec2( 0.05 * sin(seed * 4.1), -0.15);
    vec2 c4 = vec2(-0.08, -0.22);

    float b0 = blob(p, c0, 0.16);
    float b1 = blob(p, c1, 0.08);
    float b2 = blob(p, c2, 0.07);
    float b3 = blob(p, c3, 0.06);
    float b4 = blob(p, c4, 0.045);

    // Long vertical-ish drip in local patch space
    float dripX = aaLine(abs(p.x - 0.03 * sin(seed * 5.7)), 0.018);
    float dripY = 1.0 - smoothstep(-0.34, 0.06, p.y);
    float drip = dripX * dripY * smoothstep(0.01, 0.10, length(p));

    float splat = max(max(b0, b1), max(b2, max(b3, b4)));
    splat = max(splat, drip * 0.78);

    return clamp(splat, 0.0, 1.0);
}

float impactBurst(vec2 p)
{
    float r = length(p);
    float a = atan(p.y, p.x);

    float n = noise21(p * 8.0 + vec2(2.1, 4.7));
    float spokes = abs(sin(a * 6.0 + n * 5.0));
    float cracks = 1.0 - smoothstep(0.04, 0.12, spokes);
    cracks *= smoothstep(0.10, 0.18, r);
    cracks *= (1.0 - smoothstep(0.24, 0.46, r));

    float pit = 1.0 - smoothstep(0.00, 0.10, r);

    return clamp(max(pit * 0.85, cracks * 0.90), 0.0, 1.0);
}

float impactBruise(vec2 p)
{
    float r = length(p);
    float ring = smoothstep(0.08, 0.16, r) * (1.0 - smoothstep(0.22, 0.42, r));
    return clamp(ring, 0.0, 1.0);
}

float halftoneDots(vec2 uv, float scale, float amount)
{
    vec2 g = fract(uv * scale) - 0.5;
    float d = length(g);

    float radius = mix(0.03, 0.34, amount);
    float aa = max(fwidth(d), 1e-4);

    return 1.0 - smoothstep(radius - aa, radius + aa, d);
}

void MAIN()
{
    vec3 d = normalize(vDirOS);

    // Stable spherical UV
    vec2 uv = vec2(
        atan(d.z, d.x) / 6.2831853 + 0.5,
        d.y * 0.5 + 0.5
    );

    // Character-inspired palette
    vec3 invBlue      = vec3(0.10, 0.40, 0.92);
    vec3 invBlueDark  = vec3(0.05, 0.16, 0.46);
    vec3 invYellow    = vec3(0.96, 0.80, 0.14);

    vec3 omniRed      = vec3(0.76, 0.08, 0.10);
    vec3 omniWhite    = vec3(0.95, 0.95, 0.94);

    vec3 evePink      = vec3(0.97, 0.48, 0.78);
    vec3 eveMagenta   = vec3(0.82, 0.18, 0.72);
    vec3 eveGlow      = vec3(1.00, 0.72, 0.94);

    vec3 suitBlack    = vec3(0.04, 0.05, 0.07);
    vec3 inkDark      = vec3(0.02, 0.03, 0.05);
    vec3 paperWhite   = vec3(0.97, 0.96, 0.95);

    vec3 driedBloodD  = vec3(0.18, 0.03, 0.03);
    vec3 driedBloodM  = vec3(0.30, 0.05, 0.04);
    vec3 freshBlood   = vec3(0.72, 0.08, 0.08);
    vec3 bruiseCol    = vec3(0.14, 0.05, 0.16);

    // Base dark combat tone
    float n1 = noise21(uv * 3.0 + vec2(0.8, 1.4));
    float n2 = noise21(uv * 6.0 + vec2(3.7, 0.5));
    float n3 = noise21(uv * 10.0 + vec2(5.2, 2.3));

    vec3 col = mix(invBlue, invBlueDark, smoothstep(0.44, 0.88, n1));
    col = mix(col, suitBlack, smoothstep(0.70, 0.96, n2) * 0.36);
    col = mix(col, inkDark,   smoothstep(0.76, 0.98, n3) * 0.16);

    // Invincible-like yellow heroic banding
    float yBand1 = 1.0 - smoothstep(0.08, 0.16, abs(d.x * 0.95 + d.z * 0.38 - 0.06));
    float yBand2 = 1.0 - smoothstep(0.10, 0.18, abs(d.y * 0.90 - d.x * 0.32 + 0.03));
    float invMask = max(yBand1 * 0.95, yBand2 * 0.60);

    col = mix(col, invYellow, clamp(invMask, 0.0, 1.0));

    // Dark trim around Invincible-inspired areas
    float trim1 = aaLine(abs(d.x * 0.95 + d.z * 0.38 - 0.06), 0.020);
    float trim2 = aaLine(abs(d.y * 0.90 - d.x * 0.32 + 0.03), 0.020);
    float trimMask = clamp(trim1 * 0.55 + trim2 * 0.42, 0.0, 1.0);
    col = mix(col, suitBlack, trimMask);

    // Omni-Man-inspired red / white sweep
    float omniBand   = 1.0 - smoothstep(0.08, 0.15, abs(d.z * 0.95 - d.x * 0.28 + 0.08));
    float omniCenter = 1.0 - smoothstep(0.04, 0.09, abs(d.z * 0.95 - d.x * 0.28 + 0.08));
    float omniTrim   = aaLine(abs(d.z * 0.95 - d.x * 0.28 - 0.03), 0.018);

    col = mix(col, omniRed,   omniBand   * 0.48);
    col = mix(col, omniWhite, omniCenter * 0.24 + omniTrim * 0.12);

    // Atom Eve-inspired energy residue / crackle
    vec3 cE = normalize(vec3(0.16, 0.60, 0.78));
    vec2 pE;
    float mE;
    patchProject(d, cE, pE, mE);

    float eveCore  = 1.0 - smoothstep(0.00, 0.12, length(pE));
    float eveRing  = aaLine(abs(length(pE) - 0.22), 0.018);
    float eveCrack = 1.0 - smoothstep(0.03, 0.09, abs(sin((pE.x - pE.y) * 18.0 + noise21(pE * 8.0) * 4.0)));
    eveCrack *= (1.0 - smoothstep(0.04, 0.40, length(pE)));

    float eveMask = clamp((eveCore * 0.8 + eveRing * 0.7 + eveCrack * 0.6) * mE, 0.0, 1.0);

    col = mix(col, evePink, eveMask * 0.32);
    col = mix(col, eveMagenta, eveMask * 0.16);

    // Impact / damage patches
    vec3 cA = normalize(vec3( 0.74,  0.18,  0.64));
    vec3 cB = normalize(vec3(-0.48, -0.42,  0.77));
    vec3 cC = normalize(vec3( 0.08, -0.62,  0.78));

    vec2 pA, pB, pC;
    float mA, mB, mC;

    patchProject(d, cA, pA, mA);
    patchProject(d, cB, pB, mB);
    patchProject(d, cC, pC, mC);

    float impactA = impactBurst(pA) * mA;
    float impactB = impactBurst(pB) * mB;

    float bruiseA = impactBruise(pA) * mA;
    float bruiseB = impactBruise(pB) * mB;

    // Slash marks
    float slashA =
        segmentStroke(pA, vec2(-0.18, 0.08), vec2(0.14, -0.06), 0.012) +
        segmentStroke(pA, vec2(-0.16, 0.15), vec2(0.10,  0.00), 0.010);
    slashA *= mA;

    float slashB =
        segmentStroke(pB, vec2(-0.14, 0.10), vec2(0.16, -0.08), 0.012) +
        segmentStroke(pB, vec2(-0.20, 0.02), vec2(0.08, -0.10), 0.010);
    slashB *= mB;

    float damageMask = clamp(impactA * 0.95 + impactB * 0.85 + slashA * 0.48 + slashB * 0.52, 0.0, 1.0);
    float bruiseMask = clamp(bruiseA * 0.80 + bruiseB * 0.72, 0.0, 1.0);

    col = mix(col, bruiseCol, bruiseMask * 0.65);
    col = mix(col, suitBlack, damageMask * 0.28);

    // Blood splatter patches
    float bloodA = bloodSplat(pA, 1.4) * mA;
    float bloodB = bloodSplat(pB, 2.7) * mB;
    float bloodC = bloodSplat(pC, 4.1) * mC;

    float bloodMask = clamp(
        bloodA * 1.15 +
        bloodB * 1.00 +
        bloodC * 0.90 +
        slashA * 0.22 +
        slashB * 0.20,
        0.0, 1.0);

    // Dried-blood-biased coloration
    float bloodNoise = noise21(uv * 12.0 + vec2(4.3, 7.1));
    vec3 bloodCol = mix(driedBloodD, driedBloodM, smoothstep(0.22, 0.72, bloodNoise));
    bloodCol = mix(bloodCol, freshBlood, smoothstep(0.78, 0.96, bloodNoise) * 0.22);

    col = mix(col, bloodCol, bloodMask);

    // Additional tiny white scuffs / paper scratches
    float scratchA = abs(sin((d.x - d.z) * 18.0 + n1 * 7.0));
    float scratchB = abs(sin((d.x + d.y * 0.6) * 23.0 + n2 * 6.0));

    float scuff1 = 1.0 - smoothstep(0.03, 0.08, scratchA);
    float scuff2 = 1.0 - smoothstep(0.02, 0.06, scratchB);
    float scuffMask = clamp(scuff1 * 0.10 + scuff2 * 0.08, 0.0, 1.0);

    col = mix(col, paperWhite, scuffMask * 0.18);

    // Lighting
    vec3 N = normalize(NORMAL);
    vec3 V = normalize(VIEW_VECTOR);
    vec3 L = normalize(vec3(-0.34, 0.86, 0.38));

    float ndl = max(dot(N, L), 0.0);

    // Darker, harsher Viltrumite-battle shading
    float bands = 4.0;
    float q = floor(ndl * bands) / max(1.0, (bands - 1.0));
    float lit = mix(0.46, 0.94, q);
    col *= lit;

    // Aggressive comic-book halftone
    float shadowAmt = 1.0 - ndl;
    float dots1 = halftoneDots(uv + vec2(d.x, d.z) * 0.05,  95.0, shadowAmt * 0.95);
    float dots2 = halftoneDots(uv * 1.12 + vec2(d.y, -d.x) * 0.04, 150.0, clamp(shadowAmt * 0.75 + 0.20, 0.0, 1.0));

    float dotMask = max(dots1 * 0.92, dots2 * 0.60);
    col = mix(col, col * 0.60, dotMask * (0.28 + shadowAmt * 0.20));

    // Specular highlights
    vec3 H = normalize(V + L);
    float ndh = max(dot(N, H), 0.0);

    float specSuit  = pow(ndh,  90.0) * 0.07;
    float specBlood = pow(ndh, 130.0) * bloodMask * 0.20;
    float specEve   = pow(ndh, 110.0) * eveMask   * 0.10;

    col += vec3(1.0)           * specSuit;
    col += vec3(1.0, 0.28, 0.28) * specBlood;
    col += eveGlow             * specEve;

    // Atom Eve emissive residue
    col += mix(evePink, eveGlow, 0.5 + 0.5 * sin(uTime * 2.0)) * eveMask * 0.10;

    // Dramatic multi-character rim
    float ndv = max(dot(N, V), 0.0);
    float rim = pow(1.0 - ndv, 2.3);

    vec3 rimLow  = mix(invBlue, omniRed, 0.55);
    vec3 rimHigh = mix(invYellow, evePink, 0.50);
    vec3 rimColor = mix(rimLow, rimHigh, 0.5 + 0.5 * d.y);

    col += rimColor * rim * 0.11;

    // Final brutal comic-book grade
    col = (col - 0.5) * 1.12 + 0.5;
    col = pow(clamp(col, 0.0, 1.0), vec3(0.95));

    BASE_COLOR = vec4(0.0, 0.0, 0.0, 1.0);
    EMISSIVE_COLOR = clamp(col, 0.0, 1.0);

    METALNESS = 0.0;
    SPECULAR_AMOUNT = 0.0;
    ROUGHNESS = 1.0;
}
