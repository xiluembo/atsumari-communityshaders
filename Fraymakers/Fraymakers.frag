// Fraymakers.frag
// Fraymakers-inspired dynamic surface with:
// - closed cyclic motion over 60 seconds
// - walking badges moving smoothly along the sphere
// - periodic flowing background
// - animated height field for living texture
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

float starShape(vec2 p, float rOuter, float rInner, float points)
{
    float a = atan(p.y, p.x);
    float r = length(p);

    float wave = 0.5 + 0.5 * cos(a * points);
    float rr = mix(rInner, rOuter, pow(wave, 1.5));

    return 1.0 - smoothstep(rr, rr + 0.018, r);
}

float plusShape(vec2 p)
{
    float v = boxMask(p, vec2(0.020, 0.110), 0.012);
    float h = boxMask(p, vec2(0.110, 0.020), 0.012);
    return max(v, h);
}

float burstShape(vec2 p, float spikes, float outerR, float innerR)
{
    float a = atan(p.y, p.x);
    float r = length(p);

    float wave = 0.5 + 0.5 * cos(a * spikes);
    float rr = mix(innerR, outerR, pow(wave, 1.7));

    return 1.0 - smoothstep(rr, rr + 0.020, r);
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

// Build a closed orbit around a base direction on the sphere.
// Because it uses sin/cos of t, it repeats exactly every 60 seconds.
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

vec3 fakeArcadeEnv(vec3 R)
{
    vec3 deep    = vec3(0.06, 0.08, 0.14);
    vec3 sky     = vec3(0.36, 0.78, 0.98);
    vec3 magenta = vec3(0.78, 0.22, 0.70);
    vec3 orange  = vec3(0.98, 0.56, 0.14);

    float tt = clamp(R.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 env = mix(deep, sky, tt * 0.70);

    float horizon = 1.0 - abs(R.y);
    env = mix(env, orange, horizon * 0.12);

    float side = max(0.0, R.x * 0.5 + 0.5);
    env += magenta * pow(side, 2.8) * 0.12;

    return env;
}

void MAIN()
{
    // 1 full cycle per 60 seconds
    float t = uTime * 0.00174532925; // 0..2PI over 60s

    vec3 d = normalize(vDirOS);

    // Stable spherical UV
    vec2 uv = vec2(
        atan(d.z, d.x) / 6.2831853 + 0.5,
        d.y * 0.5 + 0.5
    );

    // Fraymakers palette
    vec3 cyanA    = vec3(0.16, 0.88, 0.98);
    vec3 cyanB    = vec3(0.10, 0.58, 0.96);
    vec3 deepBlue = vec3(0.08, 0.14, 0.34);
    vec3 magentaA = vec3(0.92, 0.26, 0.72);
    vec3 magentaB = vec3(0.70, 0.18, 0.66);
    vec3 orangeA  = vec3(0.98, 0.56, 0.14);
    vec3 yellowA  = vec3(0.98, 0.84, 0.18);
    vec3 whiteA   = vec3(0.98, 0.98, 0.96);

    // -----------------------------------------------------------------
    // Periodic background motion: fully cyclic, no abrupt reconfiguration
    // -----------------------------------------------------------------
    vec2 duv = uv;
    duv += vec2(
        0.030 * sin(t + uv.y * 10.0) +
        0.015 * sin(2.0 * t + uv.x * 17.0),

        0.028 * cos(t + uv.x * 12.0) +
        0.012 * sin(3.0 * t + uv.y * 14.0)
    );

    float n1 = fbm(duv * 3.0 + vec2(0.25 * cos(t),          0.20 * sin(t)));
    float n2 = fbm(duv * 5.2 + vec2(0.18 * sin(t + 1.1),    0.22 * cos(t + 1.1)));
    float n3 = fbm(duv * 8.0 + vec2(0.14 * cos(t + 2.2),    0.16 * sin(t + 2.2)));

    vec3 col = mix(cyanB, deepBlue, smoothstep(0.38, 0.88, n1));
    col = mix(col, cyanA,    smoothstep(0.54, 0.84, n2) * 0.34);
    col = mix(col, magentaB, smoothstep(0.70, 0.94, n3) * 0.22);

    // Periodic flowing ribbons
    float ribbonA = 1.0 - smoothstep(
        0.04, 0.10,
        abs(sin(duv.x * 16.0 + duv.y * 8.0 - t))
    );

    float ribbonB = 1.0 - smoothstep(
        0.04, 0.10,
        abs(sin(duv.x * 9.0 - duv.y * 13.0 + 2.0 * t))
    );

    float ribbonC = 1.0 - smoothstep(
        0.04, 0.10,
        abs(sin(duv.y * 18.0 - 3.0 * t))
    );

    col = mix(col, mix(cyanA,   whiteA,  0.35), ribbonA * 0.22);
    col = mix(col, mix(orangeA, yellowA, 0.48), ribbonB * 0.18);
    col = mix(col, mix(magentaA, whiteA, 0.28), ribbonC * 0.16);

    // -----------------------------------------------------------------
    // Pixel-ish clusters that slide continuously with the domain
    // -----------------------------------------------------------------
    vec2 gridUV = duv * vec2(18.0, 12.0);
    vec2 cellF = fract(gridUV) - 0.5;

    float sqMain = boxMask(cellF, vec2(0.30, 0.30), 0.08);
    float sqMini = boxMask(cellF - vec2(0.18, -0.12), vec2(0.14, 0.14), 0.06);
    float sqShape = max(sqMain, sqMini);

    float clusterField = smoothstep(
        0.46, 0.76,
        fbm(gridUV * 0.18 + vec2(0.55 * cos(t), 0.45 * sin(t)))
    );

    float clusterPulse = 0.82 + 0.18 * sin(t + fbm(gridUV * 0.11) * 6.2831853);

    float pixelCluster = sqShape * clusterField * clusterPulse;

    vec3 clusterCol = mix(cyanA, magentaA, smoothstep(0.40, 0.78, fbm(gridUV * 0.09 + 1.7)));
    clusterCol = mix(clusterCol, orangeA, smoothstep(0.76, 0.95, fbm(gridUV * 0.06 + 3.4)));
    clusterCol = mix(clusterCol, yellowA, smoothstep(0.88, 0.98, fbm(gridUV * 0.05 + 5.2)));

    col = mix(col, clusterCol, pixelCluster * 0.36);

    // -----------------------------------------------------------------
    // Main elements walking along closed trajectories on the sphere
    // -----------------------------------------------------------------
    vec3 baseA = normalize(vec3( 0.76,  0.18,  0.62));
    vec3 baseB = normalize(vec3(-0.52,  0.54,  0.64));
    vec3 baseC = normalize(vec3( 0.10, -0.58,  0.81));

    vec3 centerA = orbitDir(baseA, 1.0 * t, 0.20, 0.22, 0.14);
    vec3 centerB = orbitDir(baseB, 1.0 * t, 2.10, 0.18, 0.16);
    vec3 centerC = orbitDir(baseC, 1.0 * t, 4.10, 0.20, 0.12);

    vec2 pA, pB, pC;
    float mA, mB, mC;

    patchProject(d, centerA, pA, mA);
    patchProject(d, centerB, pB, mB);
    patchProject(d, centerC, pC, mC);

    // Small closed motion inside each patch too
    vec2 walkA = vec2(0.040 * cos(t + 0.2),       0.025 * sin(t + 0.2));
    vec2 walkB = vec2(0.035 * cos(t + 1.3),       0.030 * sin(2.0 * t + 1.3));
    vec2 walkC = vec2(0.030 * cos(t + 2.5),       0.030 * sin(t + 2.5));

    pA -= walkA;
    pB -= walkB;
    pC -= walkC;

    float pulseA = 0.5 + 0.5 * sin(t + 0.2);
    float pulseB = 0.5 + 0.5 * sin(t + 1.1);
    float pulseC = 0.5 + 0.5 * sin(t + 2.0);

    float burstA = burstShape(
        rotate2(pA, 0.35 * t),
        8.0,
        mix(0.16, 0.22, pulseA),
        mix(0.06, 0.10, pulseA)
    ) * mA;

    float coreA = 1.0 - smoothstep(0.00, mix(0.06, 0.09, pulseA), length(pA));
    coreA *= mA;

    float diamondB = diamondMask(rotate2(pB, -0.25 * t), mix(0.11, 0.15, pulseB), 0.016) * mB;
    float plusB    = plusShape(rotate2(pB, 0.22 * t)) * mB;

    float starC = starShape(
        rotate2(pC, 0.18 * t),
        mix(0.12, 0.16, pulseC),
        mix(0.05, 0.07, pulseC),
        5.0
    ) * mC;

    col = mix(col, orangeA,  burstA   * 0.62);
    col = mix(col, yellowA,  coreA    * 0.88);
    col = mix(col, magentaA, diamondB * 0.48);
    col = mix(col, cyanA,    plusB    * 0.78);
    col = mix(col, yellowA,  starC    * 0.74);

    // -----------------------------------------------------------------
    // Height field follows the same cyclic moving structures
    // -----------------------------------------------------------------
    float h =
        (n1 - 0.5) * 0.08 +
        (n2 - 0.5) * 0.06 +
        ribbonA * 0.16 +
        ribbonB * 0.13 +
        ribbonC * 0.11 +
        pixelCluster * 0.18 +
        burstA * 0.18 +
        coreA  * 0.10 +
        diamondB * 0.12 +
        plusB    * 0.10 +
        starC    * 0.12;

    vec3 N = normalize(NORMAL);
    vec3 V = normalize(VIEW_VECTOR);

    vec3 dpdx = dFdx(vWorldPos);
    vec3 dpdy = dFdy(vWorldPos);

    float dhdx = dFdx(h);
    float dhdy = dFdy(h);

    float bumpAmp = 1.75;

    vec3 dpdx2 = dpdx + N * (dhdx * bumpAmp);
    vec3 dpdy2 = dpdy + N * (dhdy * bumpAmp);

    vec3 Nb = normalize(cross(dpdx2, dpdy2));
    if (dot(Nb, N) < 0.0)
        Nb = -Nb;

    vec3 L = normalize(vec3(-0.30, 0.88, 0.34));
    float ndl = max(dot(Nb, L), 0.0);

    float bands = 4.0;
    float q = floor(ndl * bands) / max(1.0, (bands - 1.0));
    float lit = mix(0.74, 1.00, q);
    col *= lit;

    vec2 Ltb = vec2(dot(L, normalize(dpdx)), dot(L, normalize(dpdy)));
    float bevel = (dhdx * Ltb.x + dhdy * Ltb.y);
    col *= (1.0 + clamp(bevel * 0.46, -0.08, 0.10));

    vec3 H = normalize(V + L);
    float ndh = max(dot(Nb, H), 0.0);
    float spec = pow(ndh, 96.0) * 0.11;
    col += vec3(1.0) * spec;

    vec3 R = reflect(-V, Nb);
    vec3 env = fakeArcadeEnv(R);

    float ndv = max(dot(Nb, V), 0.0);
    float fres = pow(1.0 - ndv, 2.8);
    col = mix(col, env, fres * 0.11);

    float rim = pow(1.0 - ndv, 2.2);
    vec3 rimColor = mix(cyanA, magentaA, 0.5 + 0.5 * sin(t + d.y * 2.5));
    rimColor = mix(rimColor, orangeA, 0.22 + 0.16 * sin(t));
    col += rimColor * rim * 0.12;

    col = (col - 0.5) * 1.10 + 0.5;
    col = pow(clamp(col, 0.0, 1.0), vec3(0.95));

    BASE_COLOR = vec4(0.0, 0.0, 0.0, 1.0);
    EMISSIVE_COLOR = clamp(col, 0.0, 1.0);

    METALNESS = 0.0;
    SPECULAR_AMOUNT = 0.0;
    ROUGHNESS = 1.0;
}
