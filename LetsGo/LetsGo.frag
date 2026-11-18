// LetsGo.frag
// Pokémon Let's Go Pikachu/Eevee inspired dynamic surface.
// - Bright Kanto / partner Pokémon palette
// - Pikachu lightning, Eevee paw prints, Poké Ball motifs
// - Motifs walk on cyclic 60-second paths
// - Soft toy/plastic relief and glossy finish
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

vec2 rotate2(vec2 p, float a)
{
    float c = cos(a);
    float s = sin(a);
    return vec2(
        p.x * c - p.y * s,
        p.x * s + p.y * c
    );
}

float circleMask(vec2 p, float r, float feather)
{
    float d = length(p);
    return 1.0 - smoothstep(r, r + feather, d);
}

float ringMask(vec2 p, float r, float w)
{
    return aaLine(abs(length(p) - r), w);
}

float boxMask(vec2 p, vec2 b, float feather)
{
    vec2 d = abs(p) - b;
    float dist = max(d.x, d.y);
    return 1.0 - smoothstep(0.0, feather, dist);
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

// Closed orbit on a sphere. Repeats exactly every 60 seconds.
vec3 orbitDir(vec3 baseDir, float t, float phase, float ax, float ay)
{
    vec3 up = abs(baseDir.y) > 0.9 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
    vec3 u = normalize(cross(up, baseDir));
    vec3 v = cross(baseDir, u);

    return normalize(
        baseDir +
        u * (cos(t + phase) * ax) +
        v * (sin(t + phase) * ay)
    );
}

float lightningBolt(vec2 p)
{
    // Zig-zag bolt built from thick line segments.
    float a = segmentStroke(p, vec2(-0.05,  0.16), vec2( 0.02,  0.03), 0.022);
    float b = segmentStroke(p, vec2( 0.02,  0.03), vec2(-0.02,  0.03), 0.022);
    float c = segmentStroke(p, vec2(-0.02,  0.03), vec2( 0.06, -0.16), 0.022);
    return max(a, max(b, c));
}

float pawPrint(vec2 p)
{
    float pad = circleMask(p - vec2(0.0, -0.045), 0.060, 0.015);

    float toe1 = circleMask(p - vec2(-0.065, 0.055), 0.030, 0.012);
    float toe2 = circleMask(p - vec2(-0.020, 0.085), 0.030, 0.012);
    float toe3 = circleMask(p - vec2( 0.030, 0.085), 0.030, 0.012);
    float toe4 = circleMask(p - vec2( 0.075, 0.050), 0.028, 0.012);

    return max(pad, max(max(toe1, toe2), max(toe3, toe4)));
}

float pokeballShape(vec2 p, out float redHalf, out float whiteHalf, out float line, out float button)
{
    float outer = circleMask(p, 0.170, 0.018);
    float border = ringMask(p, 0.170, 0.014);

    redHalf = outer * smoothstep(-0.010, 0.020, p.y);
    whiteHalf = outer * (1.0 - smoothstep(-0.020, 0.010, p.y));

    line = aaLine(abs(p.y), 0.012) * outer;
    button = circleMask(p, 0.038, 0.010);

    return outer + border;
}

float sparkleShape(vec2 p)
{
    float a = segmentStroke(p, vec2(-0.080, 0.0), vec2(0.080, 0.0), 0.010);
    float b = segmentStroke(p, vec2(0.0, -0.080), vec2(0.0, 0.080), 0.010);
    float c = segmentStroke(p, vec2(-0.050, -0.050), vec2(0.050, 0.050), 0.007);
    float d = segmentStroke(p, vec2(-0.050, 0.050), vec2(0.050, -0.050), 0.007);
    float mask = 1.0 - smoothstep(0.06, 0.12, length(p));
    return max(max(a, b), max(c, d)) * mask;
}

vec3 fakeLetsGoEnv(vec3 R)
{
    vec3 sky = vec3(0.58, 0.82, 1.00);
    vec3 grass = vec3(0.52, 0.86, 0.36);
    vec3 warm = vec3(1.00, 0.84, 0.44);

    float t = clamp(R.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 env = mix(grass, sky, t);

    float horizon = 1.0 - abs(R.y);
    env = mix(env, warm, horizon * 0.14);

    return env;
}

void MAIN()
{
    // Exact 60-second cycle.
    float t = uTime * 0.00174532925;

    vec3 d = normalize(vDirOS);

    // Stable spherical UV.
    vec2 uv = vec2(
        atan(d.z, d.x) / 6.2831853 + 0.5,
        d.y * 0.5 + 0.5
    );

    // Let's Go inspired palette.
    vec3 skyBlue      = vec3(0.54, 0.80, 1.00);
    vec3 grassGreen   = vec3(0.52, 0.86, 0.36);
    vec3 leafGreen    = vec3(0.28, 0.68, 0.25);
    vec3 routeTan     = vec3(0.92, 0.74, 0.48);
    vec3 cream        = vec3(0.98, 0.94, 0.80);

    vec3 pikaYellow   = vec3(1.00, 0.86, 0.16);
    vec3 pikaOrange   = vec3(1.00, 0.55, 0.12);
    vec3 pikaBrown    = vec3(0.46, 0.26, 0.10);

    vec3 eeveeTan     = vec3(0.78, 0.50, 0.24);
    vec3 eeveeBrown   = vec3(0.38, 0.22, 0.10);
    vec3 eeveeCream   = vec3(0.96, 0.86, 0.62);

    vec3 pokeballRed  = vec3(0.92, 0.10, 0.12);
    vec3 pokeballDark = vec3(0.05, 0.05, 0.06);
    vec3 white        = vec3(0.98, 0.98, 0.95);
    vec3 candyPink    = vec3(0.98, 0.58, 0.78);

    // ------------------------------------------------------------------
    // Soft cyclic base motion.
    // ------------------------------------------------------------------
    vec2 duv = uv;
    duv += vec2(
        0.020 * sin(t + uv.y * 8.0) +
        0.012 * sin(2.0 * t + uv.x * 13.0),

        0.020 * cos(t + uv.x * 9.0) +
        0.010 * sin(3.0 * t + uv.y * 11.0)
    );

    float n1 = fbm(duv * 2.7 + vec2(0.20 * cos(t),       0.18 * sin(t)));
    float n2 = fbm(duv * 5.0 + vec2(0.16 * sin(t + 1.2), 0.18 * cos(t + 1.2)));
    float n3 = fbm(duv * 7.0 + vec2(0.12 * cos(t + 2.1), 0.14 * sin(t + 2.1)));

    // Sunny Kanto base: sky, grass, route tan.
    vec3 col = mix(skyBlue, grassGreen, smoothstep(0.32, 0.78, n1));
    col = mix(col, routeTan, smoothstep(0.62, 0.90, n2) * 0.28);
    col = mix(col, cream, smoothstep(0.76, 0.96, n3) * 0.12);

    // ------------------------------------------------------------------
    // Route / field bands.
    // ------------------------------------------------------------------
    float routeBand = 1.0 - smoothstep(
        0.07, 0.15,
        abs(sin(duv.x * 9.0 + duv.y * 5.0 - t))
    );

    float grassBand = 1.0 - smoothstep(
        0.06, 0.13,
        abs(sin(duv.y * 13.0 + t * 0.75))
    );

    col = mix(col, routeTan, routeBand * 0.20);
    col = mix(col, leafGreen, grassBand * 0.10);

    // ------------------------------------------------------------------
    // Candy / partner sparkle field, cyclic and subtle.
    // ------------------------------------------------------------------
    vec2 candyUV = duv * vec2(14.0, 9.0) + vec2(0.25 * cos(t), 0.20 * sin(t));
    vec2 candyF = fract(candyUV) - 0.5;

    float candyField = smoothstep(0.70, 0.92, fbm(candyUV * 0.24 + vec2(cos(t), sin(t))));
    float candyDot = circleMask(candyF, 0.095, 0.025) * candyField;

    vec3 candyCol = mix(candyPink, pikaYellow, 0.5 + 0.5 * sin(t + fbm(candyUV * 0.15) * 6.2831853));
    col = mix(col, candyCol, candyDot * 0.20);

    // ------------------------------------------------------------------
    // Moving motifs along closed 60s orbits.
    // ------------------------------------------------------------------
    vec3 baseBolt = normalize(vec3( 0.76,  0.18,  0.62));
    vec3 basePaw  = normalize(vec3(-0.52,  0.54,  0.64));
    vec3 baseBall = normalize(vec3( 0.10, -0.58,  0.81));

    vec3 centerBolt = orbitDir(baseBolt, t, 0.20, 0.24, 0.14);
    vec3 centerPaw  = orbitDir(basePaw,  t, 2.25, 0.20, 0.16);
    vec3 centerBall = orbitDir(baseBall, t, 4.10, 0.22, 0.12);

    vec2 pBolt, pPaw, pBall;
    float mBolt, mPaw, mBall;

    patchProject(d, centerBolt, pBolt, mBolt);
    patchProject(d, centerPaw,  pPaw,  mPaw);
    patchProject(d, centerBall, pBall, mBall);

    // Local cyclic walking inside each patch.
    pBolt -= vec2(0.035 * cos(t + 0.2), 0.026 * sin(t + 0.2));
    pPaw  -= vec2(0.030 * cos(t + 1.2), 0.028 * sin(t + 1.2));
    pBall -= vec2(0.026 * cos(t + 2.2), 0.026 * sin(t + 2.2));

    // Pikachu lightning.
    vec2 boltQ = rotate2(pBolt, 0.20 * sin(t));
    float bolt = lightningBolt(boltQ) * mBolt;
    float boltGlow = lightningBolt(boltQ * 0.82) * mBolt;

    col = mix(col, pikaYellow, boltGlow * 0.35);
    col = mix(col, pikaYellow, bolt * 0.86);
    col = mix(col, pikaOrange, bolt * 0.22);

    // Eevee paw print.
    vec2 pawQ = rotate2(pPaw, -0.18 * sin(t + 1.0));
    float paw = pawPrint(pawQ) * mPaw;
    float pawOuter = pawPrint(pawQ * 0.85) * mPaw;

    col = mix(col, eeveeCream, pawOuter * 0.35);
    col = mix(col, eeveeTan, paw * 0.72);
    col = mix(col, eeveeBrown, paw * 0.20);

    // Poké Ball.
    vec2 ballQ = rotate2(pBall, 0.25 * sin(t + 2.0));
    float redHalf, whiteHalf, ballLine, ballButton;
    float ball = pokeballShape(ballQ, redHalf, whiteHalf, ballLine, ballButton) * mBall;

    col = mix(col, pokeballRed, redHalf * mBall * 0.82);
    col = mix(col, white, whiteHalf * mBall * 0.76);
    col = mix(col, pokeballDark, ballLine * mBall * 0.86);
    col = mix(col, white, ballButton * mBall * 0.92);
    col = mix(col, pokeballDark, ringMask(ballQ, 0.170, 0.012) * mBall * 0.80);

    // Traveling sparkles around partner motifs.
    vec2 sparkQ1 = pBolt - vec2(0.16 * cos(t), 0.10 * sin(t));
    vec2 sparkQ2 = pPaw  - vec2(0.12 * cos(t + 1.4), 0.12 * sin(t + 1.4));
    vec2 sparkQ3 = pBall - vec2(0.10 * cos(t + 2.8), 0.14 * sin(t + 2.8));

    float sp1 = sparkleShape(sparkQ1) * mBolt;
    float sp2 = sparkleShape(sparkQ2) * mPaw;
    float sp3 = sparkleShape(sparkQ3) * mBall;

    col += white * (sp1 * 0.20 + sp2 * 0.18 + sp3 * 0.16);

    // ------------------------------------------------------------------
    // Height field for physical texture perception.
    // ------------------------------------------------------------------
    float h =
        (n1 - 0.5) * 0.06 +
        routeBand * 0.10 +
        grassBand * 0.06 +
        candyDot * 0.08 +
        bolt * 0.18 +
        boltGlow * 0.06 +
        paw * 0.16 +
        pawOuter * 0.05 +
        ball * 0.14 +
        ballLine * 0.08 +
        ballButton * 0.10 +
        (sp1 + sp2 + sp3) * 0.08;

    vec3 N = normalize(NORMAL);
    vec3 V = normalize(VIEW_VECTOR);

    vec3 dpdx = dFdx(vWorldPos);
    vec3 dpdy = dFdy(vWorldPos);

    float dhdx = dFdx(h);
    float dhdy = dFdy(h);

    float bumpAmp = 1.70;

    vec3 dpdx2 = dpdx + N * (dhdx * bumpAmp);
    vec3 dpdy2 = dpdy + N * (dhdy * bumpAmp);

    vec3 Nb = normalize(cross(dpdx2, dpdy2));
    if (dot(Nb, N) < 0.0)
        Nb = -Nb;

    // ------------------------------------------------------------------
    // Bright toy-like lighting.
    // ------------------------------------------------------------------
    vec3 L = normalize(vec3(-0.30, 0.88, 0.34));
    float ndl = max(dot(Nb, L), 0.0);

    float bands = 4.0;
    float q = floor(ndl * bands) / max(1.0, (bands - 1.0));
    float lit = mix(0.78, 1.04, q);
    col *= lit;

    // Bevel modulation.
    vec2 Ltb = vec2(dot(L, normalize(dpdx)), dot(L, normalize(dpdy)));
    float bevel = (dhdx * Ltb.x + dhdy * Ltb.y);
    col *= (1.0 + clamp(bevel * 0.42, -0.06, 0.08));

    // Gloss.
    vec3 H = normalize(V + L);
    float ndh = max(dot(Nb, H), 0.0);

    float spec = pow(ndh, 90.0) * 0.10;
    float wetCandy = pow(ndh, 120.0) * candyDot * 0.08;

    col += vec3(1.0) * spec;
    col += candyCol * wetCandy;

    // Soft environment reflection.
    vec3 R = reflect(-V, Nb);
    vec3 env = fakeLetsGoEnv(R);

    float ndv = max(dot(Nb, V), 0.0);
    float fres = pow(1.0 - ndv, 2.6);

    col = mix(col, env, fres * 0.10);

    // Partner rim glow.
    float rim = pow(1.0 - ndv, 2.2);
    vec3 rimColor = mix(pikaYellow, eeveeTan, 0.5 + 0.5 * sin(t + d.y * 2.0));
    rimColor = mix(rimColor, skyBlue, 0.22);
    col += rimColor * rim * 0.10;

    // Final cheerful grade.
    col = (col - 0.5) * 1.06 + 0.5;
    col = pow(clamp(col, 0.0, 1.0), vec3(0.96));

    BASE_COLOR = vec4(0.0, 0.0, 0.0, 1.0);
    EMISSIVE_COLOR = clamp(col, 0.0, 1.0);

    METALNESS = 0.0;
    SPECULAR_AMOUNT = 0.0;
    ROUGHNESS = 1.0;
}
