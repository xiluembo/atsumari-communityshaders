// MegaMan.frag
// Mega Man inspired dynamic surface:
// - monochromatic blue metallic palette
// - pixelated Mega Buster shots moving along parallels
// - each parallel has its own cyclic motion, direction and erratic speed profile
// - stronger metallic reflections
// - panel seams and rail grooves for an armor-like look
// MAIN-only, no extra custom uniforms

VARYING vec3 vDirOS;
VARYING vec3 vWorldPos;

const float TAU     = 6.2831853;
const float INV_TAU = 0.15915494;

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

vec2 rotate2(vec2 p, float a)
{
    float c = cos(a);
    float s = sin(a);
    return vec2(
        p.x * c - p.y * s,
        p.x * s + p.y * c
    );
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

vec2 pixelate(vec2 p, vec2 res)
{
    return floor(p * res + 0.5) / res;
}

float bandMask(float y, float center, float halfWidth)
{
    return 1.0 - smoothstep(halfWidth, halfWidth + 0.010, abs(y - center));
}

float railMask(float y, float center, float halfWidth)
{
    float d = abs(abs(y - center) - halfWidth * 0.55);
    return 1.0 - smoothstep(0.006, 0.018, d);
}

float shotGlyph(vec2 p, float dirSign)
{
    // p is expected in a small local range around [0,0].
    // Pixelated Mega Buster pellet with a tiny trail.
    vec2 q = pixelate(p, vec2(20.0, 12.0));

    float core  = boxMask(q - vec2(0.000, 0.000), vec2(0.080, 0.070), 0.010);
    float front = boxMask(q - vec2(0.040 * dirSign, 0.000), vec2(0.030, 0.050), 0.010);
    float tail1 = boxMask(q + vec2(0.120 * dirSign, 0.000), vec2(0.035, 0.035), 0.010);
    float tail2 = boxMask(q + vec2(0.190 * dirSign, 0.000), vec2(0.020, 0.020), 0.010);

    return max(max(core, front), max(tail1 * 0.90, tail2 * 0.75));
}

void parallelShots(
    vec2 uv,
    float t,
    float centerY,
    float width,
    float dirSign,
    float speedA,
    float speedB,
    float phase,
    float repeatCount,
    out float shotMask,
    out float glowMask,
    out float bandCore,
    out float bandRail
)
{
    bandCore = bandMask(uv.y, centerY, width);
    bandRail = railMask(uv.y, centerY, width);

    // Fully cyclic, but with distinct and somewhat erratic motion.
    // The base term controls revolutions over 60s.
    // The sine terms perturb the speed/phase, yet remain periodic.
    float shift =
        dirSign * (
            speedA * t * INV_TAU +
            0.035 * sin(speedB * t + phase) +
            0.018 * sin((speedA + speedB) * t + phase * 1.7)
        );

    // Repeating pellets along the parallel
    vec2 local;
    local.x = fract((uv.x - shift) * repeatCount) - 0.5;
    local.y = (uv.y - centerY) / (width * 2.0);

    shotMask = shotGlyph(local, dirSign) * bandCore;
    glowMask = shotGlyph(local * 0.72, dirSign) * bandCore;
}

vec3 fakeBlueMetalEnv(vec3 R)
{
    vec3 darkBlue   = vec3(0.03, 0.07, 0.16);
    vec3 midBlue    = vec3(0.08, 0.22, 0.48);
    vec3 brightBlue = vec3(0.24, 0.52, 0.96);

    float t = clamp(R.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 env = mix(darkBlue, midBlue, t);
    env = mix(env, brightBlue, pow(max(0.0, R.y), 2.0) * 0.40);

    float horizon = 1.0 - abs(R.y);
    env += brightBlue * horizon * 0.12;

    return env;
}

void MAIN()
{
    // Exact 60-second cycle
    float t = uTime * 0.00174532925;

    vec3 d = normalize(vDirOS);

    // Stable spherical UV
    vec2 uv = vec2(
        atan(d.z, d.x) * INV_TAU + 0.5,
        d.y * 0.5 + 0.5
    );

    // Monochromatic Mega Man blue palette
    vec3 blueBlack   = vec3(0.02, 0.05, 0.12);
    vec3 blueDark    = vec3(0.04, 0.10, 0.24);
    vec3 blueMid     = vec3(0.08, 0.22, 0.52);
    vec3 blueSteel   = vec3(0.12, 0.34, 0.78);
    vec3 blueBright  = vec3(0.22, 0.52, 0.96);
    vec3 blueGlow    = vec3(0.42, 0.74, 1.00);

    // ------------------------------------------------------------------
    // Metallic base surface
    // ------------------------------------------------------------------
    vec2 duv = uv;
    duv += vec2(
        0.010 * sin(t + uv.y * 8.0),
        0.010 * cos(t + uv.x * 10.0)
    );

    float n1 = fbm(duv * 3.0 + vec2(0.12 * cos(t), 0.10 * sin(t)));
    float n2 = fbm(duv * 6.0 + vec2(0.08 * sin(t + 1.2), 0.10 * cos(t + 1.2)));

    vec3 col = mix(blueDark, blueSteel, smoothstep(0.28, 0.82, n1));
    col = mix(col, blueMid, smoothstep(0.62, 0.92, n2) * 0.24);

    // ------------------------------------------------------------------
    // Panel seams for a metallic armor feel
    // ------------------------------------------------------------------
    vec2 panelUV = vec2(uv.x * 14.0, uv.y * 8.0);
    vec2 panelF  = abs(fract(panelUV) - 0.5);

    float panelSeam =
        1.0 - smoothstep(0.44, 0.49, max(panelF.x, panelF.y));

    float panelFace =
        1.0 - smoothstep(0.22, 0.45, max(panelF.x, panelF.y));

    col = mix(col, blueBlack, panelSeam * 0.34);
    col = mix(col, blueBright, panelFace * 0.06);

    // ------------------------------------------------------------------
    // Parallel bands with independent cyclic projectile motion
    // ------------------------------------------------------------------
    float s1, g1, b1, r1;
    float s2, g2, b2, r2;
    float s3, g3, b3, r3;
    float s4, g4, b4, r4;
    float s5, g5, b5, r5;

    parallelShots(uv, t, 0.20, 0.040,  1.0, 1.0, 3.0, 0.30, 6.0, s1, g1, b1, r1);
    parallelShots(uv, t, 0.34, 0.042, -1.0, 2.0, 5.0, 1.20, 7.0, s2, g2, b2, r2);
    parallelShots(uv, t, 0.50, 0.045,  1.0, 4.0, 2.0, 2.50, 8.0, s3, g3, b3, r3);
    parallelShots(uv, t, 0.66, 0.042, -1.0, 3.0, 7.0, 3.40, 6.0, s4, g4, b4, r4);
    parallelShots(uv, t, 0.80, 0.040,  1.0, 5.0, 4.0, 4.60, 7.0, s5, g5, b5, r5);

    float shotMask = s1 + s2 + s3 + s4 + s5;
    float glowMask = g1 + g2 + g3 + g4 + g5;
    float bandMaskSum = b1 + b2 + b3 + b4 + b5;
    float railMaskSum = r1 + r2 + r3 + r4 + r5;

    bandMaskSum = clamp(bandMaskSum, 0.0, 1.0);
    railMaskSum = clamp(railMaskSum, 0.0, 1.0);
    shotMask    = clamp(shotMask, 0.0, 1.0);
    glowMask    = clamp(glowMask, 0.0, 1.0);

    // Dark metallic troughs and brighter rails around the parallels
    col = mix(col, blueBlack, bandMaskSum * 0.12);
    col = mix(col, blueBright, railMaskSum * 0.18);

    // Shots: same hue family, just brighter
    col = mix(col, blueBright, shotMask * 0.72);
    col = mix(col, blueGlow, glowMask * 0.42);

    // ------------------------------------------------------------------
    // Additional subtle ring energy
    // ------------------------------------------------------------------
    float ringFlowA = 1.0 - smoothstep(
        0.05, 0.11,
        abs(sin(uv.x * 18.0 - 2.0 * t + uv.y * 6.0))
    );

    float ringFlowB = 1.0 - smoothstep(
        0.05, 0.11,
        abs(sin(uv.x * 12.0 + 3.0 * t - uv.y * 5.0))
    );

    col = mix(col, blueSteel, ringFlowA * bandMaskSum * 0.10);
    col = mix(col, blueBright, ringFlowB * railMaskSum * 0.08);

    // ------------------------------------------------------------------
    // Height field for metallic relief
    // ------------------------------------------------------------------
    float h =
        (n1 - 0.5) * 0.06 +
        panelFace * 0.08 +
        panelSeam * 0.10 +
        bandMaskSum * 0.10 +
        railMaskSum * 0.18 +
        shotMask * 0.16 +
        glowMask * 0.10;

    vec3 N = normalize(NORMAL);
    vec3 V = normalize(VIEW_VECTOR);

    vec3 dpdx = dFdx(vWorldPos);
    vec3 dpdy = dFdy(vWorldPos);

    float dhdx = dFdx(h);
    float dhdy = dFdy(h);

    float bumpAmp = 2.20;

    vec3 dpdx2 = dpdx + N * (dhdx * bumpAmp);
    vec3 dpdy2 = dpdy + N * (dhdy * bumpAmp);

    vec3 Nb = normalize(cross(dpdx2, dpdy2));
    if (dot(Nb, N) < 0.0)
        Nb = -Nb;

    // ------------------------------------------------------------------
    // Manual metallic lighting
    // ------------------------------------------------------------------
    vec3 L = normalize(vec3(-0.28, 0.88, 0.36));
    float ndl = max(dot(Nb, L), 0.0);

    float lit = mix(0.38, 0.96, ndl);
    col *= lit;

    // Bevel modulation
    vec2 Ltb = vec2(dot(L, normalize(dpdx)), dot(L, normalize(dpdy)));
    float bevel = (dhdx * Ltb.x + dhdy * Ltb.y);
    col *= (1.0 + clamp(bevel * 0.58, -0.10, 0.12));

    // Strong metallic specular
    vec3 H = normalize(V + L);
    float ndh = max(dot(Nb, H), 0.0);

    float specBase   = pow(ndh, 90.0)  * 0.08;
    float specMetal  = pow(ndh, 170.0) * (0.12 + railMaskSum * 0.18);
    float specShots  = pow(ndh, 220.0) * glowMask * 0.28;

    col += blueBright * specBase;
    col += blueGlow   * specMetal;
    col += blueGlow   * specShots;

    // Environment reflection
    vec3 R = reflect(-V, Nb);
    vec3 env = fakeBlueMetalEnv(R);

    float ndv  = max(dot(Nb, V), 0.0);
    float fres = pow(1.0 - ndv, 2.8);

    col = mix(col, env, fres * 0.18);

    // Rim highlight
    float rim = pow(1.0 - ndv, 2.2);
    col += blueGlow * rim * 0.10;

    // Final grading: keep it blue and metallic
    col = (col - 0.5) * 1.10 + 0.5;
    col = pow(clamp(col, 0.0, 1.0), vec3(0.94));

    // Let QtQuick3D's PBR pipeline handle the metallic response.
    // The surface color remains in the blue family.
    BASE_COLOR = vec4(clamp(col, 0.0, 1.0), 1.0);

    // Keep only the projectile/glow elements emissive.
    // This avoids making the entire sphere look self-lit.
    EMISSIVE_COLOR =
    blueGlow * clamp(glowMask * 0.45 + shotMask * 0.12 + rim * 0.10, 0.0, 1.0);

    // Real PBR metallic material.
    METALNESS = 0.72;
    ROUGHNESS = 0.24;
    SPECULAR_AMOUNT = 0.85;
}
