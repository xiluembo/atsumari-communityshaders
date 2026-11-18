// Capote.frag
// Capote card-game inspired material:
// - green felt table
// - ivory cards moving around parallels
// - suits and trick/capote rings
// - cyclic 60-second motion
// - tactile felt/card relief
// MAIN-only, no extra custom uniforms.

VARYING vec3 vDirOS;
VARYING vec3 vWorldPos;

const float TAU = 6.2831853;
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

float circleMask(vec2 p, float r, float feather)
{
    float d = length(p);
    return 1.0 - smoothstep(r, r + feather, d);
}

float diamondMask(vec2 p, float r, float feather)
{
    float d = abs(p.x) + abs(p.y) - r;
    return 1.0 - smoothstep(0.0, feather, d);
}

float ringMask(float y, float center, float width)
{
    float d = abs(y - center);
    return 1.0 - smoothstep(width, width + 0.010, d);
}

float railMask(float y, float center, float width)
{
    float d = abs(abs(y - center) - width * 0.75);
    return 1.0 - smoothstep(0.004, 0.014, d);
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

vec2 pixelSnap(vec2 p, vec2 res)
{
    return floor(p * res + 0.5) / res;
}

float heartShape(vec2 p)
{
    p.y += 0.010;

    float l = circleMask(p - vec2(-0.035, 0.030), 0.050, 0.012);
    float r = circleMask(p - vec2( 0.035, 0.030), 0.050, 0.012);
    float b = diamondMask(p - vec2(0.0, -0.035), 0.095, 0.012);

    return max(max(l, r), b);
}

float diamondSuit(vec2 p)
{
    return diamondMask(p, 0.095, 0.012);
}

float clubShape(vec2 p)
{
    float a = circleMask(p - vec2( 0.000, 0.055), 0.043, 0.012);
    float b = circleMask(p - vec2(-0.045, 0.005), 0.043, 0.012);
    float c = circleMask(p - vec2( 0.045, 0.005), 0.043, 0.012);
    float s = boxMask(p - vec2(0.000, -0.060), vec2(0.018, 0.070), 0.010);

    return max(max(a, b), max(c, s));
}

float spadeShape(vec2 p)
{
    vec2 q = vec2(p.x, -p.y + 0.015);

    float top = heartShape(q);
    float stem = boxMask(p - vec2(0.000, -0.065), vec2(0.018, 0.065), 0.010);
    float foot = diamondMask(p - vec2(0.000, -0.115), 0.035, 0.010);

    return max(top, max(stem, foot));
}

float cardRect(vec2 p)
{
    float body = boxMask(p, vec2(0.145, 0.360), 0.025);
    float inner = boxMask(p, vec2(0.118, 0.315), 0.018);
    return body;
}

float cardBorder(vec2 p)
{
    float outer = boxMask(p, vec2(0.145, 0.360), 0.025);
    float inner = boxMask(p, vec2(0.118, 0.315), 0.018);
    return max(0.0, outer - inner);
}

void cardLane(
    vec2 uv,
    float t,
    float centerY,
    float width,
    float dirSign,
    float speed,
    float wobbleSpeed,
    float phase,
    float repeatCount,
    out float card,
    out float border,
    out float suit,
    out float rail
)
{
    // Integer base speed keeps the entire trajectory cyclic in 60 seconds.
    // The sinusoidal terms make the motion less mechanical, but still periodic.
    float shift =
        dirSign * (
            speed * t * INV_TAU +
            0.030 * sin(wobbleSpeed * t + phase) +
            0.016 * sin((speed + wobbleSpeed) * t + phase * 1.7)
        );

    float center =
        centerY +
        0.010 * sin(t + phase) +
        0.006 * sin(2.0 * t + phase * 0.6);

    float band = ringMask(uv.y, center, width);
    rail = railMask(uv.y, center, width);

    vec2 local;
    local.x = fract((uv.x - shift) * repeatCount) - 0.5;
    local.y = (uv.y - center) / (width * 2.0);

    // Slightly pixel-snapped cards, like old digital card sprites.
    local = pixelSnap(local, vec2(28.0, 36.0));

    card = cardRect(local) * band;
    border = cardBorder(local) * band;

    vec2 sp = local * 1.65;
    suit = max(
        heartShape(sp),
        max(diamondSuit(sp), max(clubShape(sp), spadeShape(sp)))
    ) * card;
}

vec3 fakeFeltEnv(vec3 R)
{
    vec3 darkGreen = vec3(0.02, 0.09, 0.055);
    vec3 feltGreen = vec3(0.04, 0.24, 0.13);
    vec3 warmGold  = vec3(0.78, 0.56, 0.22);

    float top = clamp(R.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 env = mix(darkGreen, feltGreen, top);

    float horizon = 1.0 - abs(R.y);
    env = mix(env, warmGold, horizon * 0.10);

    return env;
}

void MAIN()
{
    // uTime goes from 1 to 3600 over 60 seconds.
    float t = uTime * 0.00174532925;

    vec3 d = normalize(vDirOS);

    vec2 uv = vec2(
        atan(d.z, d.x) * INV_TAU + 0.5,
        d.y * 0.5 + 0.5
    );

    // Capote / card table palette.
    vec3 feltDark   = vec3(0.015, 0.065, 0.040);
    vec3 feltMid    = vec3(0.030, 0.180, 0.095);
    vec3 feltLight  = vec3(0.070, 0.320, 0.170);

    vec3 ivory      = vec3(0.92, 0.86, 0.70);
    vec3 paperWarm  = vec3(0.98, 0.93, 0.78);
    vec3 inkBlack   = vec3(0.025, 0.020, 0.018);
    vec3 suitRed    = vec3(0.72, 0.040, 0.035);

    vec3 goldDark   = vec3(0.40, 0.26, 0.070);
    vec3 gold       = vec3(0.82, 0.58, 0.18);
    vec3 goldLight  = vec3(1.00, 0.78, 0.30);

    vec3 woodBrown  = vec3(0.22, 0.11, 0.045);

    // ------------------------------------------------------------------
    // Felt base, cyclic and gently alive.
    // ------------------------------------------------------------------
    vec2 duv = uv;
    duv += vec2(
        0.010 * sin(t + uv.y * 9.0),
        0.010 * cos(t + uv.x * 8.0)
    );

    float n1 = fbm(duv * 3.0 + vec2(0.14 * cos(t), 0.12 * sin(t)));
    float n2 = fbm(duv * 8.0 + vec2(0.08 * sin(t + 1.1), 0.10 * cos(t + 1.1)));

    vec3 col = mix(feltDark, feltMid, smoothstep(0.20, 0.88, n1));
    col = mix(col, feltLight, smoothstep(0.66, 0.94, n2) * 0.20);

    // Felt weave.
    float weaveA = 1.0 - smoothstep(
        0.035, 0.085,
        abs(sin(duv.x * 95.0 + 0.35 * sin(t)))
    );

    float weaveB = 1.0 - smoothstep(
        0.035, 0.085,
        abs(sin(duv.y * 80.0 + 0.35 * cos(t)))
    );

    float weave = weaveA * 0.45 + weaveB * 0.35;
    col = mix(col, feltLight, weave * 0.045);
    col = mix(col, feltDark, (1.0 - weave) * 0.035);

    // ------------------------------------------------------------------
    // Table/card lane grooves.
    // ------------------------------------------------------------------
    float groove1 = railMask(uv.y, 0.22, 0.050);
    float groove2 = railMask(uv.y, 0.38, 0.052);
    float groove3 = railMask(uv.y, 0.55, 0.056);
    float groove4 = railMask(uv.y, 0.72, 0.050);

    float grooves = clamp(groove1 + groove2 + groove3 + groove4, 0.0, 1.0);

    col = mix(col, woodBrown, grooves * 0.14);
    col = mix(col, goldDark, grooves * 0.08);

    // ------------------------------------------------------------------
    // Moving cards on cyclic parallels.
    // ------------------------------------------------------------------
    float c1, bd1, su1, rl1;
    float c2, bd2, su2, rl2;
    float c3, bd3, su3, rl3;
    float c4, bd4, su4, rl4;

    cardLane(uv, t, 0.22, 0.050,  1.0, 1.0, 3.0, 0.30, 7.0, c1, bd1, su1, rl1);
    cardLane(uv, t, 0.38, 0.052, -1.0, 2.0, 5.0, 1.40, 8.0, c2, bd2, su2, rl2);
    cardLane(uv, t, 0.55, 0.056,  1.0, 3.0, 2.0, 2.50, 9.0, c3, bd3, su3, rl3);
    cardLane(uv, t, 0.72, 0.050, -1.0, 4.0, 7.0, 3.60, 7.0, c4, bd4, su4, rl4);

    float cardMask = clamp(c1 + c2 + c3 + c4, 0.0, 1.0);
    float borderMask = clamp(bd1 + bd2 + bd3 + bd4, 0.0, 1.0);
    float suitMask = clamp(su1 + su2 + su3 + su4, 0.0, 1.0);
    float railSum = clamp(rl1 + rl2 + rl3 + rl4, 0.0, 1.0);

    // Alternate red/black feeling per latitude.
    float redSuits = clamp(su1 + su3, 0.0, 1.0);
    float blackSuits = clamp(su2 + su4, 0.0, 1.0);

    col = mix(col, goldDark, railSum * 0.10);
    col = mix(col, ivory, cardMask * 0.82);
    col = mix(col, paperWarm, cardMask * 0.18);
    col = mix(col, gold, borderMask * 0.55);

    col = mix(col, suitRed, redSuits * 0.82);
    col = mix(col, inkBlack, blackSuits * 0.88);

    // ------------------------------------------------------------------
    // Capote sweep: a golden wave crossing the whole table.
    // Represents a full sweep / taking everything.
    // ------------------------------------------------------------------
    float sweepPhase = fract(t * INV_TAU);
    float sweepX = fract(uv.x - sweepPhase);

    float sweepCore = 1.0 - smoothstep(0.015, 0.045, abs(sweepX - 0.5));
    float sweepGlow = 1.0 - smoothstep(0.040, 0.120, abs(sweepX - 0.5));

    // Make it stronger around the middle, like a dramatic reveal across the table.
    float sweepLatitude = smoothstep(0.10, 0.45, uv.y) * (1.0 - smoothstep(0.55, 0.92, uv.y));

    float capoteSweep = sweepCore * sweepLatitude;
    float capoteGlow = sweepGlow * sweepLatitude;

    col = mix(col, goldLight, capoteGlow * 0.18);
    col = mix(col, goldLight, capoteSweep * 0.44);

    // Small cyclic trick counters around the equator.
    vec2 counterUV = vec2(uv.x * 12.0 - t * INV_TAU * 2.0, uv.y);
    vec2 cf = fract(counterUV) - vec2(0.5, 0.0);
    cf.y = (uv.y - 0.50) / 0.070;

    float counterBand = ringMask(uv.y, 0.50, 0.045);
    float counter = circleMask(cf, 0.115, 0.020) * counterBand;

    col = mix(col, gold, counter * 0.40);
    col = mix(col, goldLight, counter * 0.18);

    // ------------------------------------------------------------------
    // Height field for physical texture.
    // ------------------------------------------------------------------
    float h =
        (n1 - 0.5) * 0.045 +
        weave * 0.045 +
        grooves * 0.100 +
        railSum * 0.120 +
        cardMask * 0.145 +
        borderMask * 0.120 +
        suitMask * 0.080 +
        counter * 0.110 +
        capoteGlow * 0.080 +
        capoteSweep * 0.130;

    vec3 N = normalize(NORMAL);
    vec3 V = normalize(VIEW_VECTOR);

    vec3 dpdx = dFdx(vWorldPos);
    vec3 dpdy = dFdy(vWorldPos);

    float dhdx = dFdx(h);
    float dhdy = dFdy(h);

    float bumpAmp = 2.10;

    vec3 dpdx2 = dpdx + N * (dhdx * bumpAmp);
    vec3 dpdy2 = dpdy + N * (dhdy * bumpAmp);

    vec3 Nb = normalize(cross(dpdx2, dpdy2));
    if (dot(Nb, N) < 0.0)
        Nb = -Nb;

    // ------------------------------------------------------------------
    // Manual card-table lighting.
    // ------------------------------------------------------------------
    vec3 L = normalize(vec3(-0.32, 0.86, 0.38));
    float ndl = max(dot(Nb, L), 0.0);

    float bands = 4.0;
    float q = floor(ndl * bands) / max(1.0, bands - 1.0);
    float lit = mix(0.48, 0.96, q);

    col *= lit;

    // Bevel modulation from relief.
    vec2 Ltb = vec2(dot(L, normalize(dpdx)), dot(L, normalize(dpdy)));
    float bevel = dhdx * Ltb.x + dhdy * Ltb.y;
    col *= 1.0 + clamp(bevel * 0.42, -0.08, 0.10);

    // Paper/gold highlights.
    vec3 H = normalize(V + L);
    float ndh = max(dot(Nb, H), 0.0);

    float paperSpec = pow(ndh, 90.0) * cardMask * 0.035;
    float goldSpec  = pow(ndh, 140.0) * clamp(borderMask + counter + capoteSweep, 0.0, 1.0) * 0.090;

    col += paperWarm * paperSpec;
    col += goldLight * goldSpec;

    // Soft felt environment.
    vec3 R = reflect(-V, Nb);
    vec3 env = fakeFeltEnv(R);

    float ndv = max(dot(Nb, V), 0.0);
    float fres = pow(1.0 - ndv, 2.6);

    col = mix(col, env, fres * 0.075);

    // Dark green rim.
    float rim = pow(1.0 - ndv, 2.25);
    col += mix(feltLight, gold, 0.22) * rim * 0.055;

    // Final grade.
    col = (col - 0.5) * 1.08 + 0.5;
    col = pow(clamp(col, 0.0, 1.0), vec3(0.96));

    vec3 finalColor = clamp(col, 0.0, 1.0);

    // Mostly matte felt/card material, with subtle self-lit highlights.
    BASE_COLOR = vec4(finalColor, 1.0);

    EMISSIVE_COLOR =
        goldLight * clamp(capoteSweep * 0.18 + counter * 0.06, 0.0, 1.0) +
        paperWarm * clamp(cardMask * 0.025, 0.0, 1.0);

    METALNESS = 0.02;
    ROUGHNESS = 0.78;
    SPECULAR_AMOUNT = 0.38;
}
