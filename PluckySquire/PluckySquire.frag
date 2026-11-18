// PluckySquire.frag
// The Plucky Squire inspired material:
// - flat / cartoon printed illustration
// - patterns continue over the full sphere
// - no polar aura
// - saturated storybook colors
// - bold dark outlines
// - stronger layered paper relief
// MAIN-only, no extra custom uniforms

VARYING vec3 vDirOS;
VARYING vec3 vWorldPos;

const float TAU = 6.2831853;

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

float fbm(vec2 p)
{
    float v = 0.0;
    float a = 0.5;

    v += noise21(p) * a; p *= 2.0; a *= 0.5;
    v += noise21(p) * a; p *= 2.0; a *= 0.5;
    v += noise21(p) * a;

    return v;
}

float aaLine(float dist, float w)
{
    float aa = max(fwidth(dist), 1e-4);
    return 1.0 - smoothstep(w - aa, w + aa, dist);
}

float boxMask(vec2 p, vec2 b, float feather)
{
    vec2 d = abs(p) - b;
    float dist = max(d.x, d.y);
    return 1.0 - smoothstep(0.0, feather, dist);
}

vec2 rotate2(vec2 p, float a)
{
    float c = cos(a);
    float s = sin(a);
    return vec2(
        p.x * c - p.y * s,
        p.x * s + p.y * c
    );
}

// Seam-safe wrapped coordinates
vec2 wrapCoord(float phi, float y, float freq, float t, vec2 phase)
{
    return vec2(
        cos(phi * freq + t + phase.x),
        sin(phi * freq + t + phase.y)
    ) + y * vec2(1.25, 1.67);
}

void MAIN()
{
    float t = uTime * 0.00174532925;

    vec3 d = normalize(vDirOS);

    float phi = atan(d.z, d.x);
    float y   = d.y;
    float eq  = 1.0 - y * y;

    // The "page band" remains as a compositional hint only.
    // It is NOT used as a hard mask anymore.
    float pageBand = 1.0 - smoothstep(0.64, 0.92, abs(y));
    float pageAccent = 0.45 + 0.55 * pageBand;

    // Saturated palette inspired by the reference art
    vec3 inkDark   = vec3(0.10, 0.08, 0.12);

    vec3 lemon     = vec3(0.97, 0.95, 0.20);
    vec3 whiteWarm = vec3(0.99, 0.97, 0.88);
    vec3 cyanSky   = vec3(0.16, 0.72, 0.98);
    vec3 aquaMint  = vec3(0.16, 0.92, 0.70);
    vec3 hotPink   = vec3(0.95, 0.24, 0.58);
    vec3 magenta   = vec3(0.88, 0.22, 0.76);
    vec3 coral     = vec3(0.98, 0.46, 0.34);
    vec3 purple    = vec3(0.64, 0.38, 0.94);
    vec3 blue      = vec3(0.22, 0.46, 0.94);
    vec3 whiteHot  = vec3(0.99, 0.99, 0.96);

    // ------------------------------------------------------------------
    // Seam-safe base domain
    // ------------------------------------------------------------------
    vec2 c1 = wrapCoord(phi, y, 1.0, 0.40 * t, vec2(0.2, 1.0));
    vec2 c2 = wrapCoord(phi, y, 2.0, 0.75 * t, vec2(1.6, 0.3));
    vec2 c3 = wrapCoord(phi, y, 3.0, 0.55 * t, vec2(2.4, 1.9));
    vec2 c4 = wrapCoord(phi, y, 5.0, 0.25 * t, vec2(0.9, 2.6));

    float n1 = fbm(c1 * 2.3 + vec2(0.08 * cos(t), 0.06 * sin(t)));
    float n2 = fbm(c2 * 3.3 + vec2(0.06 * sin(t + 1.0), 0.08 * cos(t + 1.0)));
    float n3 = fbm(c3 * 4.8 + vec2(0.05 * cos(t + 2.0), 0.06 * sin(t + 2.0)));
    float n4 = fbm(c4 * 6.2 + vec2(0.04 * cos(t + 0.7), 0.05 * sin(t + 0.7)));

    // ------------------------------------------------------------------
    // Global flat printed base
    // Continuous over the whole sphere.
    // ------------------------------------------------------------------
    vec3 col = mix(whiteWarm, lemon, 0.34);

    float washA = 0.5 + 0.5 * sin(2.6 * phi + 2.8 * y - 0.55 * t + n1 * 1.4);
    float washB = 0.5 + 0.5 * sin(-3.2 * phi + 2.1 * y + 0.85 * t + n2 * 1.3);

    col = mix(col, cyanSky, smoothstep(0.72, 0.94, washA) * 0.10);
    col = mix(col, aquaMint, smoothstep(0.72, 0.94, washB) * 0.08);
    col = mix(col, hotPink, smoothstep(0.82, 0.98, n4) * 0.04);

    // ------------------------------------------------------------------
    // Printed story-map regions
    // These exist over the full sphere, with extra emphasis near pageBand.
    // ------------------------------------------------------------------
    float fA = 0.5 + 0.5 * sin(4.2 * phi + 4.6 * y - t + n1 * 2.0);
    float fB = 0.5 + 0.5 * sin(-5.2 * phi + 6.0 * y + 1.5 * t + n2 * 1.7);
    float fC = 0.5 + 0.5 * sin(8.0 * phi * eq + 6.5 * y - 2.0 * t + n3 * 1.5);
    float fD = 0.5 + 0.5 * sin(11.0 * phi - 5.0 * y + 2.5 * t + n4 * 1.3);

    float regionWater = smoothstep(0.52, 0.72, fA + 0.16 * n2);
    float regionGrass = smoothstep(0.50, 0.70, fB + 0.14 * n3);
    float regionPath  = smoothstep(0.56, 0.76, fC + 0.12 * n4);
    float regionTown  = smoothstep(0.62, 0.82, fD + 0.10 * n1);

    col = mix(col, cyanSky,  regionWater * (0.42 + 0.36 * pageAccent));
    col = mix(col, aquaMint, regionGrass * (0.38 + 0.30 * pageAccent));
    col = mix(col, hotPink,  regionPath  * (0.28 + 0.26 * pageAccent));
    col = mix(col, purple,   regionTown  * (0.12 + 0.16 * pageAccent));
    col = mix(col, coral, smoothstep(0.80, 0.96, n3) * (0.08 + 0.06 * pageAccent));

    // ------------------------------------------------------------------
    // Strong black outlines around printed regions
    // ------------------------------------------------------------------
    float outlineWater = 1.0 - smoothstep(0.012, 0.038, abs((fA + 0.16 * n2) - 0.62));
    float outlineGrass = 1.0 - smoothstep(0.012, 0.038, abs((fB + 0.14 * n3) - 0.60));
    float outlinePath  = 1.0 - smoothstep(0.012, 0.038, abs((fC + 0.12 * n4) - 0.66));
    float outlineTown  = 1.0 - smoothstep(0.012, 0.038, abs((fD + 0.10 * n1) - 0.72));

    float outlines = clamp(outlineWater + outlineGrass + outlinePath + outlineTown, 0.0, 1.0);
    col = mix(col, inkDark, outlines * (0.42 + 0.30 * pageAccent));

    // ------------------------------------------------------------------
    // Printed tracks / ribbons
    // Also global over the whole sphere.
    // ------------------------------------------------------------------
    float ribbonA = 1.0 - smoothstep(
        0.038, 0.088,
        abs(sin(7.0 * phi + 6.0 * y - t))
    );

    float ribbonB = 1.0 - smoothstep(
        0.038, 0.088,
        abs(sin(-10.0 * phi + 8.0 * y + 2.0 * t))
    );

    float ribbonC = 1.0 - smoothstep(
        0.038, 0.088,
        abs(sin(13.0 * phi * eq + 9.0 * y - 3.0 * t))
    );

    float ribbonInkA = 1.0 - smoothstep(
        0.010, 0.026,
        abs(abs(sin(7.0 * phi + 6.0 * y - t)) - 0.05)
    );

    float ribbonInkB = 1.0 - smoothstep(
        0.010, 0.026,
        abs(abs(sin(-10.0 * phi + 8.0 * y + 2.0 * t)) - 0.05)
    );

    col = mix(col, aquaMint, ribbonA * (0.06 + 0.08 * pageAccent));
    col = mix(col, hotPink,  ribbonB * (0.06 + 0.08 * pageAccent));
    col = mix(col, cyanSky,  ribbonC * (0.04 + 0.06 * pageAccent));

    col = mix(col, inkDark, clamp(ribbonInkA + ribbonInkB, 0.0, 1.0) * (0.08 + 0.14 * pageAccent));

    // ------------------------------------------------------------------
    // Page-like fold / spine line
    // This remains visible across the full sphere.
    // ------------------------------------------------------------------
    float fold = 1.0 - smoothstep(0.016, 0.065, abs(d.x * 0.97 + d.z * 0.18));
    col = mix(col, inkDark, fold * 0.10);
    col = mix(col, whiteHot, fold * 0.035);

    // ------------------------------------------------------------------
    // Page decorations / scalloped frame
    // Global, but stronger near the page band.
    // ------------------------------------------------------------------
    float scallop = 1.0 - smoothstep(
        0.05, 0.11,
        abs(sin(10.0 * phi + 6.0 * y + t))
    );

    float borderBand = 1.0 - smoothstep(0.10, 0.18, abs(abs(y) - 0.63));
    float frame = scallop * borderBand;

    col = mix(col, lemon, frame * (0.06 + 0.10 * pageAccent));
    col = mix(col, inkDark, frame * (0.08 + 0.14 * pageAccent));

    // ------------------------------------------------------------------
    // Small printed marks / doodle texture
    // ------------------------------------------------------------------
    vec2 tabsP = wrapCoord(phi, y, 9.0, 0.20 * t, vec2(0.0, 1.4));
    tabsP = rotate2(tabsP, 0.12 * sin(t));

    float tabA = boxMask(tabsP - vec2(-0.22, 0.00), vec2(0.08, 0.05), 0.02);
    float tabB = boxMask(tabsP - vec2( 0.00, 0.00), vec2(0.08, 0.05), 0.02);
    float tabC = boxMask(tabsP - vec2( 0.22, 0.00), vec2(0.08, 0.05), 0.02);

    float tabs = clamp(tabA + tabB + tabC, 0.0, 1.0) * smoothstep(0.72, 0.90, n4);
    col = mix(col, magenta, tabs * (0.04 + 0.08 * pageAccent));
    col = mix(col, inkDark, tabs * (0.06 + 0.08 * pageAccent));

    // ------------------------------------------------------------------
    // Very subtle glow
    // Distributed over the sphere, no polar aura.
    // ------------------------------------------------------------------
    vec2 g1 = wrapCoord(phi, y, 12.0, 0.50 * t, vec2(0.8, 2.1));
    vec2 g2 = wrapCoord(phi, y, 15.0, 0.70 * t, vec2(2.0, 0.7));

    float glowField1 = smoothstep(0.94, 0.992, fbm(g1 * 6.0));
    float glowField2 = smoothstep(0.95, 0.994, fbm(g2 * 7.0));

    float glowPulse = 0.5 + 0.5 * sin(3.0 * t + 4.0 * phi + 5.0 * y);
    float glowMask = clamp((glowField1 * 0.8 + glowField2 * 0.6) * glowPulse, 0.0, 1.0);

    vec3 glowColor = mix(lemon, whiteHot, 0.55);
    glowColor = mix(glowColor, aquaMint, 0.20);

    col = mix(col, glowColor, glowMask * 0.035);

    // ------------------------------------------------------------------
    // Height field: stronger relief than before
    // ------------------------------------------------------------------
    float h =
        pageBand * 0.06 +
        fold * 0.10 +
        regionWater * (0.08 + 0.05 * pageAccent) +
        regionGrass * (0.08 + 0.05 * pageAccent) +
        regionPath  * (0.06 + 0.04 * pageAccent) +
        regionTown  * (0.05 + 0.03 * pageAccent) +
        outlines * 0.08 +
        ribbonA * (0.05 + 0.05 * pageAccent) +
        ribbonB * (0.05 + 0.05 * pageAccent) +
        ribbonC * (0.04 + 0.04 * pageAccent) +
        frame * 0.08 +
        tabs * 0.05 +
        glowMask * 0.02 +
        (n1 - 0.5) * 0.020 +
        (n2 - 0.5) * 0.016;

    vec3 N = normalize(NORMAL);
    vec3 V = normalize(VIEW_VECTOR);

    vec3 dpdx = dFdx(vWorldPos);
    vec3 dpdy = dFdy(vWorldPos);

    float dhdx = dFdx(h);
    float dhdy = dFdy(h);

    // Increased bump amplitude for more visible paper/cutout relief.
    float bumpAmp = 2.35;

    vec3 dpdx2 = dpdx + N * (dhdx * bumpAmp);
    vec3 dpdy2 = dpdy + N * (dhdy * bumpAmp);

    vec3 Nb = normalize(cross(dpdx2, dpdy2));
    if (dot(Nb, N) < 0.0)
        Nb = -Nb;

    // ------------------------------------------------------------------
    // Flat/cartoon lighting
    // ------------------------------------------------------------------
    vec3 L = normalize(vec3(-0.30, 0.88, 0.34));
    float ndl = max(dot(Nb, L), 0.0);

    float bands = 3.0;
    float q = floor(ndl * bands) / max(1.0, (bands - 1.0));
    float lit = mix(0.82, 1.00, q);
    col *= lit;

    vec2 Ltb = vec2(dot(L, normalize(dpdx)), dot(L, normalize(dpdy)));
    float bevel = (dhdx * Ltb.x + dhdy * Ltb.y);
    col *= (1.0 + clamp(bevel * 0.34, -0.06, 0.08));

    vec3 H = normalize(V + L);
    float ndh = max(dot(Nb, H), 0.0);

    float fxMask = clamp(glowMask + outlines * 0.18 + frame * 0.18, 0.0, 1.0);
    float specBase = pow(ndh, 60.0) * 0.006;
    float specFx   = pow(ndh, 95.0) * fxMask * 0.018;

    col += whiteHot * specBase;
    col += glowColor * specFx;

    // Neutral subtle rim only. No colored pole aura.
    float ndv = max(dot(Nb, V), 0.0);
    float rim = pow(1.0 - ndv, 2.0);
    col += whiteWarm * rim * 0.010;

    // Strong saturation push
    col = (col - 0.5) * 1.20 + 0.5;
    col = pow(clamp(col, 0.0, 1.0), vec3(0.98));

    vec3 finalColor = clamp(col, 0.0, 1.0);

    BASE_COLOR = vec4(finalColor, 1.0);

    EMISSIVE_COLOR =
        glowColor * clamp(glowMask * 0.08, 0.0, 1.0);

    METALNESS = 0.00;
    ROUGHNESS = 0.86;
    SPECULAR_AMOUNT = 0.12;
}
