// MinaTheHollower.frag
// Mina the Hollower inspired dynamic surface:
// - darker 8-bit gothic palette
// - more pixelated overall image
// - no isolated motifs; motifs repeat in bands / tiled structures
// - cyclic motion over 60 seconds
// - stronger physical texture perception
// MAIN-only, no extra custom uniforms

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

vec2 pixelate(vec2 p, vec2 res)
{
    return floor(p * res + 0.5) / res;
}

float boxMask(vec2 p, vec2 b, float feather)
{
    vec2 d = abs(p) - b;
    float dist = max(d.x, d.y);
    return 1.0 - smoothstep(0.0, feather, dist);
}

float diamondMask(vec2 p, float r, float feather)
{
    float d = abs(p.x) + abs(p.y) - r;
    return 1.0 - smoothstep(0.0, feather, d);
}

float plusShape(vec2 p)
{
    float v = boxMask(p, vec2(0.020, 0.100), 0.012);
    float h = boxMask(p, vec2(0.100, 0.020), 0.012);
    return max(v, h);
}

float roseShape(vec2 p)
{
    float c0 = diamondMask(p, 0.040, 0.012);
    float c1 = diamondMask(p - vec2( 0.045,  0.015), 0.030, 0.012);
    float c2 = diamondMask(p - vec2(-0.045,  0.015), 0.030, 0.012);
    float c3 = diamondMask(p - vec2( 0.020, -0.035), 0.028, 0.012);
    float c4 = diamondMask(p - vec2(-0.020, -0.035), 0.028, 0.012);
    return max(c0, max(max(c1, c2), max(c3, c4)));
}

float flameShape(vec2 p)
{
    float o = diamondMask(p - vec2(0.0, 0.010), 0.050, 0.012);
    float i = diamondMask(p - vec2(0.0, 0.000), 0.025, 0.012);
    return max(o * 0.7, i);
}

float dashGlyph(vec2 p)
{
    float trail1 = boxMask(p - vec2(-0.030,  0.000), vec2(0.165, 0.030), 0.010);
    float trail2 = boxMask(p - vec2(-0.085,  0.040), vec2(0.100, 0.025), 0.010);
    float head   = diamondMask(p - vec2(0.145, 0.000), 0.050, 0.010);
    return max(max(trail1, trail2), head);
}

vec3 fakeGothicEnv(vec3 R)
{
    vec3 deepTop   = vec3(0.03, 0.05, 0.10);
    vec3 deepBot   = vec3(0.08, 0.03, 0.06);
    vec3 violetFog = vec3(0.22, 0.10, 0.34);
    vec3 coldBlue  = vec3(0.10, 0.22, 0.52);

    float t = clamp(R.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 env = mix(deepBot, deepTop, t);
    env = mix(env, violetFog, (1.0 - abs(R.y)) * 0.18);
    env += coldBlue * pow(max(0.0, R.x * 0.5 + 0.5), 2.6) * 0.12;

    return env;
}

void MAIN()
{
    // Exact 60-second cycle
    float t = uTime * 0.00174532925;

    vec3 d = normalize(vDirOS);

    // Stable spherical UV
    vec2 uv = vec2(
        atan(d.z, d.x) / 6.2831853 + 0.5,
        d.y * 0.5 + 0.5
    );

    // Mina-inspired palette
    vec3 inkBlack    = vec3(0.01, 0.01, 0.02);
    vec3 midnight    = vec3(0.03, 0.05, 0.10);
    vec3 navyStone   = vec3(0.08, 0.14, 0.28);
    vec3 cobaltBlue  = vec3(0.12, 0.28, 0.62);
    vec3 deepPurple  = vec3(0.18, 0.10, 0.28);
    vec3 violetGlow  = vec3(0.34, 0.16, 0.52);
    vec3 bloodDark   = vec3(0.28, 0.03, 0.06);
    vec3 crimson     = vec3(0.72, 0.08, 0.16);
    vec3 scarlet     = vec3(0.92, 0.10, 0.18);
    vec3 cream       = vec3(0.92, 0.88, 0.78);
    vec3 goldDark    = vec3(0.55, 0.38, 0.12);
    vec3 goldBright  = vec3(0.86, 0.66, 0.26);
    vec3 candleAmber = vec3(0.98, 0.58, 0.14);
    vec3 flameCream  = vec3(1.00, 0.84, 0.48);
    vec3 mossGreen   = vec3(0.28, 0.58, 0.20);

    // ------------------------------------------------------------------
    // Cyclic domain motion for the whole surface
    // ------------------------------------------------------------------
    vec2 duv = uv;
    duv += vec2(
        0.022 * sin(t + uv.y * 9.0) +
        0.010 * sin(2.0 * t + uv.x * 14.0),

        0.022 * cos(t + uv.x * 11.0) +
        0.010 * sin(3.0 * t + uv.y * 12.0)
    );

    // Stronger pixelation for the surface as a whole
    vec2 puv = pixelate(duv, vec2(72.0, 72.0));

    float n1 = fbm(puv * 3.0 + vec2(0.20 * cos(t),       0.18 * sin(t)));
    float n2 = fbm(puv * 5.0 + vec2(0.16 * sin(t + 1.1), 0.18 * cos(t + 1.1)));
    float n3 = fbm(puv * 7.4 + vec2(0.12 * cos(t + 2.2), 0.14 * sin(t + 2.2)));

    vec3 col = mix(midnight, navyStone, smoothstep(0.30, 0.82, n1));
    col = mix(col, deepPurple, smoothstep(0.54, 0.88, n2) * 0.42);
    col = mix(col, cobaltBlue, smoothstep(0.72, 0.94, n3) * 0.16);

    // ------------------------------------------------------------------
    // Gothic wallpaper tiles
    // ------------------------------------------------------------------
    vec2 wallUV = puv * vec2(12.0, 10.0) + vec2(0.10 * cos(t), 0.08 * sin(t));
    vec2 wallF  = fract(wallUV) - 0.5;
    wallF = pixelate(wallF, vec2(18.0, 18.0));

    float wallDiamond = diamondMask(wallF, 0.34, 0.010);
    float wallCross   = plusShape(wallF * 1.15);
    float wallpaper   = max(wallDiamond * 0.70, wallCross * 0.30);

    col = mix(col, violetGlow, wallpaper * 0.16);
    col = mix(col, inkBlack, (1.0 - wallpaper) * 0.06);

    // ------------------------------------------------------------------
    // Pixel brick masonry
    // ------------------------------------------------------------------
    vec2 brickUV = puv * vec2(9.0, 11.0) + vec2(0.12 * sin(t), 0.0);
    float row = floor(brickUV.y);
    vec2 brickF = fract(vec2(brickUV.x + mod(row, 2.0) * 0.5, brickUV.y)) - 0.5;
    brickF = pixelate(brickF, vec2(16.0, 16.0));

    float brickFill = boxMask(brickF, vec2(0.46, 0.38), 0.010);
    float mortar    = 1.0 - brickFill;

    vec3 brickCol = mix(bloodDark, vec3(0.26, 0.12, 0.08), smoothstep(0.35, 0.85, n2));
    col = mix(col, brickCol, brickFill * 0.42);
    col = mix(col, inkBlack, mortar * 0.18);

    // ------------------------------------------------------------------
    // Repeating gold tracery / rails
    // ------------------------------------------------------------------
    vec2 railUV = puv * vec2(7.0, 5.0) + vec2(-0.14 * cos(t), 0.12 * sin(t));
    vec2 railF = fract(railUV) - 0.5;
    railF = pixelate(railF, vec2(20.0, 20.0));

    float railV = boxMask(railF, vec2(0.045, 0.48), 0.010);
    float railH = boxMask(railF, vec2(0.48, 0.045), 0.010);
    float railRing = max(0.0,
        diamondMask(railF, 0.34, 0.010) -
        diamondMask(railF, 0.26, 0.010));

    float tracery = max(max(railV * 0.65, railH * 0.25), railRing * 0.75);

    col = mix(col, goldDark, tracery * 0.24);
    col = mix(col, goldBright, tracery * 0.10);

    // ------------------------------------------------------------------
    // Repeating pixel motifs marching in rows
    // No isolated single motifs: they are tiled and cyclic.
    // ------------------------------------------------------------------

    // 1) Lantern / candle row
    vec2 lanUV = puv * vec2(6.0, 4.0) + vec2(0.28 * t, 0.06 * sin(t));
    vec2 lanF = fract(lanUV) - 0.5;
    lanF = pixelate(lanF, vec2(22.0, 22.0));

    float lanBand = smoothstep(0.18, 0.02, abs(fract(lanUV.y) - 0.5));
    float lanBody = boxMask(lanF - vec2(0.0, 0.02), vec2(0.080, 0.105), 0.010);
    float lanCap  = boxMask(lanF - vec2(0.0, 0.14), vec2(0.042, 0.020), 0.010);
    float lanStem = boxMask(lanF - vec2(0.0, 0.19), vec2(0.014, 0.040), 0.010);
    float lanFlame = flameShape(lanF);
    float lantern = max(max(lanBody, lanCap), lanStem) * lanBand;

    col = mix(col, goldBright, lantern * 0.72);
    col = mix(col, candleAmber, lanFlame * lanBand * 0.74);
    col = mix(col, flameCream, diamondMask(lanF, 0.018, 0.008) * lanBand * 0.55);

    // 2) Rose pattern row
    vec2 roseUV = puv * vec2(5.0, 5.0) + vec2(-0.20 * t, 0.10 * cos(t));
    vec2 roseF = fract(roseUV) - 0.5;
    roseF = pixelate(roseF, vec2(22.0, 22.0));

    float roseBand = smoothstep(0.22, 0.03, abs(fract(roseUV.x + roseUV.y * 0.5) - 0.5));
    float rose = roseShape(roseF + vec2(0.0, 0.03)) * roseBand;
    float stem = boxMask(roseF - vec2(0.0, -0.11), vec2(0.014, 0.070), 0.010) * roseBand;
    float leafL = diamondMask(roseF - vec2(-0.030, -0.08), 0.025, 0.010) * roseBand;
    float leafR = diamondMask(roseF - vec2( 0.030, -0.08), 0.025, 0.010) * roseBand;

    col = mix(col, crimson, rose * 0.80);
    col = mix(col, scarlet, rose * 0.24);
    col = mix(col, goldDark, stem * 0.60);
    col = mix(col, mossGreen, max(leafL, leafR) * 0.60);

    // 3) Mina dash / burrow glyph row
    vec2 dashUV = puv * vec2(4.5, 6.0) + vec2(0.0, -0.24 * t);
    vec2 dashF = fract(dashUV) - 0.5;
    dashF = pixelate(rotate2(dashF, 0.10 * sin(t)), vec2(24.0, 24.0));

    float dashBand = smoothstep(0.18, 0.04, abs(fract(dashUV.x * 0.7 + dashUV.y) - 0.5));
    float dash = dashGlyph(dashF) * dashBand;

    col = mix(col, crimson, dash * 0.78);
    col = mix(col, bloodDark, dash * 0.28);
    col = mix(col, cream, diamondMask(dashF - vec2(0.145, 0.000), 0.032, 0.008) * dashBand * 0.42);

    // ------------------------------------------------------------------
    // Subtle moving cold sparks
    // ------------------------------------------------------------------
    float sparkField = smoothstep(
        0.92, 0.985,
        fbm(puv * 18.0 + vec2(0.18 * cos(t), 0.16 * sin(t)))
    );
    vec3 sparkCol = mix(cobaltBlue, violetGlow, 0.5 + 0.5 * sin(t + dot(d, vec3(4.0, 3.0, 2.0))));
    col += sparkCol * sparkField * 0.03;

    // ------------------------------------------------------------------
    // Height field: stronger texture / more evident accidents
    // ------------------------------------------------------------------
    float h =
        wallpaper * 0.08 +
        brickFill * 0.16 +
        mortar * 0.10 +
        tracery * 0.14 +
        lantern * 0.18 +
        lanFlame * 0.12 +
        rose * 0.14 +
        stem * 0.06 +
        max(leafL, leafR) * 0.05 +
        dash * 0.14;

    vec3 N = normalize(NORMAL);
    vec3 V = normalize(VIEW_VECTOR);

    vec3 dpdx = dFdx(vWorldPos);
    vec3 dpdy = dFdy(vWorldPos);

    float dhdx = dFdx(h);
    float dhdy = dFdy(h);

    float bumpAmp = 2.50;

    vec3 dpdx2 = dpdx + N * (dhdx * bumpAmp);
    vec3 dpdy2 = dpdy + N * (dhdy * bumpAmp);

    vec3 Nb = normalize(cross(dpdx2, dpdy2));
    if (dot(Nb, N) < 0.0)
        Nb = -Nb;

    // ------------------------------------------------------------------
    // Dark lighting
    // ------------------------------------------------------------------
    vec3 L = normalize(vec3(-0.24, 0.86, 0.44));
    float ndl = max(dot(Nb, L), 0.0);

    float bands = 4.0;
    float q = floor(ndl * bands) / max(1.0, (bands - 1.0));
    float lit = mix(0.34, 0.88, q);
    col *= lit;

    // Bevel modulation from relief
    vec2 Ltb = vec2(dot(L, normalize(dpdx)), dot(L, normalize(dpdy)));
    float bevel = (dhdx * Ltb.x + dhdy * Ltb.y);
    col *= (1.0 + clamp(bevel * 0.60, -0.12, 0.14));

    // Specular, mainly on gold and flames
    vec3 H = normalize(V + L);
    float ndh = max(dot(Nb, H), 0.0);

    float goldMask = clamp(lantern + tracery, 0.0, 1.0);
    float flameMask = clamp(lanFlame, 0.0, 1.0);

    float specBase  = pow(ndh, 70.0) * 0.03;
    float specGold  = pow(ndh, 100.0) * goldMask * 0.10;
    float specFlame = pow(ndh, 90.0) * flameMask * 0.08;

    col += vec3(1.0) * specBase;
    col += goldBright * specGold;
    col += flameCream * specFlame;

    // Reflection
    vec3 R = reflect(-V, Nb);
    vec3 env = fakeGothicEnv(R);

    float ndv = max(dot(Nb, V), 0.0);
    float fres = pow(1.0 - ndv, 2.8);
    col = mix(col, env, fres * 0.10);

    // Dark rim light
    float rim = pow(1.0 - ndv, 2.3);
    vec3 rimColor = mix(violetGlow, crimson, 0.5 + 0.5 * sin(t + d.y * 2.5));
    col += rimColor * rim * 0.08;

    // Stronger posterization for 8-bit feel
    vec3 poster = floor(clamp(col, 0.0, 1.0) * 5.0) / 5.0;
    col = mix(col, poster, 0.48);

    col = clamp(col, 0.0, 1.0);

    BASE_COLOR = vec4(0.0, 0.0, 0.0, 1.0);
    EMISSIVE_COLOR = col;

    METALNESS = 0.0;
    SPECULAR_AMOUNT = 0.0;
    ROUGHNESS = 1.0;
}
