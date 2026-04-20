// TeraRaidCave.frag
// Dark Tera Raid cave inspired shader:
// - obsidian / indigo / deep violet base
// - reflective crystal facets
// - glowing tera veins
// - strong Fresnel / cave reflections
// MAIN-only, no custom uniforms.

VARYING vec3 vDirOS;
VARYING vec3 vDirRawOS;
VARYING vec3 vWorldPos;

float hash21(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float hash11(float x) { return fract(sin(x) * 43758.5453); }
float snap1(float x, float steps) { return floor(x * steps + 0.5) / steps; }

float aaLine(float dist, float w)
{
    float aa = max(fwidth(dist), 1e-4);
    return 1.0 - smoothstep(w - aa, w + aa, dist);
}

vec3 hueShiftYIQ(vec3 c, float a)
{
    float Y = dot(c, vec3(0.299, 0.587, 0.114));
    float I = dot(c, vec3(0.596, -0.275, -0.321));
    float Q = dot(c, vec3(0.212, -0.523, 0.311));

    float ca = cos(a);
    float sa = sin(a);

    float I2 = I * ca - Q * sa;
    float Q2 = I * sa + Q * ca;

    vec3 outc;
    outc.r = Y + 0.956 * I2 + 0.621 * Q2;
    outc.g = Y - 0.272 * I2 - 0.647 * Q2;
    outc.b = Y - 1.106 * I2 + 1.703 * Q2;
    return clamp(outc, 0.0, 1.0);
}

vec3 cavePalette(float t)
{
    float i = floor(fract(t) * 6.0);

    vec3 c0 = vec3(0.05, 0.06, 0.10); // obsidian blue-black
    vec3 c1 = vec3(0.10, 0.08, 0.18); // deep violet
    vec3 c2 = vec3(0.06, 0.12, 0.20); // deep cyan shadow
    vec3 c3 = vec3(0.14, 0.10, 0.22); // plum
    vec3 c4 = vec3(0.08, 0.16, 0.24); // wet crystal blue
    vec3 c5 = vec3(0.12, 0.06, 0.16); // dark magenta shadow

    vec3 c = c0;
    if (i < 1.0) c = c0;
    else if (i < 2.0) c = c1;
    else if (i < 3.0) c = c2;
    else if (i < 4.0) c = c3;
    else if (i < 5.0) c = c4;
    else              c = c5;

    return c;
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

// Returns: color + height + emissive vein mask
void crystalPlane(vec2 uv, float planeId, out vec3 outCol, out float outH, out float outGlow)
{
    float grid = 8.8;

    vec2 g = uv * grid;
    vec2 cell = floor(g);
    vec2 f = fract(g);

    float id = hash21(cell + vec2(planeId * 11.7, planeId * 4.3));

    vec3 A = cavePalette(id + 0.17);
    vec3 B = cavePalette(id + 0.61);

    float r = hash21(cell + vec2(6.2 + planeId, 3.4 - planeId));

    // Facet split
    float cutDist = (r < 0.5) ? abs(f.x - f.y) : abs((f.x + f.y) - 1.0);
    float cut = aaLine(cutDist, 0.020);

    // Panel borders
    float edgeDist = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y));
    float aa = max(fwidth(edgeDist), 1e-4);
    float border = 1.0 - smoothstep(0.050 - aa, 0.050 + aa, edgeDist);

    float side = (r < 0.5) ? step(f.y, f.x) : step(1.0 - f.y, f.x);
    vec3 tile = mix(A, B, side);

    // Internal crystal gradient
    float grad = dot(f - 0.5, normalize(vec2(0.72, 0.65)));
    tile *= (1.0 + grad * 0.06);

    // Tera vein field
    float veinNoise = noise21(g * 1.4 + vec2(planeId * 2.7, planeId * 4.9));
    float vein = 1.0 - smoothstep(0.06, 0.14, abs(veinNoise - 0.52));
    vein *= 1.0 - smoothstep(0.55, 0.95, length(f - 0.5) * 1.25);

    // Dark crystal edge tint
    vec3 edgeTint = hueShiftYIQ(tile, 0.90);
    vec3 edgeCol = mix(edgeTint, vec3(0.10, 0.16, 0.42), 0.40) * 0.45;

    float edgeMask = border * 0.62 + cut * 0.54;
    vec3 col = mix(tile, edgeCol, edgeMask);

    // Vein glow colors are not added here yet, only marked
    outGlow = clamp(vein * 0.75 + edgeMask * 0.15, 0.0, 1.0);

    // Height for bump / bevel
    float tileH = (id - 0.5) * 0.16;
    outH = tileH + edgeMask * 1.10 + vein * 0.40;

    outCol = col;
}

vec3 fakeCaveEnv(vec3 R)
{
    // Dark cave reflections with bright tera highlights
    vec3 deepCave = vec3(0.02, 0.03, 0.06);
    vec3 indigo   = vec3(0.16, 0.12, 0.30);
    vec3 cyanGlow = vec3(0.18, 0.72, 0.98);
    vec3 magGlow  = vec3(0.78, 0.24, 0.92);

    float top = clamp(R.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 env = mix(deepCave, indigo, top * 0.55);

    // Horizontal cave glows
    float horizon = 1.0 - abs(R.y);
    env += cyanGlow * pow(horizon, 2.2) * 0.18;
    env += magGlow  * pow(max(0.0, R.x * 0.5 + 0.5), 3.0) * 0.10;

    return env;
}

vec3 gradeRaidCave(vec3 c)
{
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    float mx = max(c.r, max(c.g, c.b));
    float mn = min(c.r, min(c.g, c.b));
    float sat = mx - mn;

    // Keep it dark, but let reflections keep color
    float x = smoothstep(0.04, 0.80, l);
    float bell = 4.0 * x * (1.0 - x);

    float boost = 0.62 * (1.0 - sat);
    float satMix = (1.18 + boost) * (1.0 + bell * 0.18);
    satMix = clamp(satMix, 0.0, 1.8);

    c = mix(vec3(l), c, satMix);

    // Slight contrast
    c = (c - 0.5) * 1.08 + 0.5;

    // Very light tonemap so reflections stay punchy
    c = c / (vec3(1.0) + c * 0.10);

    return clamp(c, 0.0, 1.0);
}

void MAIN()
{
    vec3 d = normalize(vDirOS);

    // Triplanar weights
    vec3 w = abs(d);
    w = w / max(1e-5, (w.x + w.y + w.z));

    vec2 uvX = d.yz * 0.5 + 0.5;
    vec2 uvY = d.xz * 0.5 + 0.5;
    vec2 uvZ = d.xy * 0.5 + 0.5;

    vec3 cx, cy, cz;
    float hx, hy, hz;
    float gx, gy, gz;

    crystalPlane(uvX, 0.0, cx, hx, gx);
    crystalPlane(uvY, 1.0, cy, hy, gy);
    crystalPlane(uvZ, 2.0, cz, hz, gz);

    vec3 col = cx * w.x + cy * w.y + cz * w.z;
    float h  = hx * w.x + hy * w.y + hz * w.z;
    float glowMask = gx * w.x + gy * w.y + gz * w.z;

    // Stable sparkle specks
    float sparkle = step(0.994, hash11(dot(d, vec3(31.1, 77.9, 14.7)) * 211.0));
    col += vec3(1.0) * sparkle * 0.10;

    // Relief normal
    vec3 N = normalize(NORMAL);
    vec3 V = normalize(VIEW_VECTOR);

    vec3 dpdx = dFdx(vWorldPos);
    vec3 dpdy = dFdy(vWorldPos);

    float dhdx = dFdx(h);
    float dhdy = dFdy(h);

    float bumpAmp = 2.35;

    vec3 dpdx2 = dpdx + N * (dhdx * bumpAmp);
    vec3 dpdy2 = dpdy + N * (dhdy * bumpAmp);

    vec3 Nb = normalize(cross(dpdx2, dpdy2));
    if (dot(Nb, N) < 0.0) Nb = -Nb;

    // Cave lighting: darker base, stronger reflections
    vec3 L = normalize(vec3(-0.24, 0.86, 0.44));
    float ndl = max(dot(Nb, L), 0.0);

    float bands = 4.0;
    float q = floor(ndl * bands) / max(1.0, (bands - 1.0));
    float lit = mix(0.42, 0.86, q);
    col *= lit;

    // Bevel modulation
    vec2 Ltb = vec2(dot(L, normalize(dpdx)), dot(L, normalize(dpdy)));
    float bevel = (dhdx * Ltb.x + dhdy * Ltb.y);
    col *= (1.0 + clamp(bevel * 0.60, -0.12, 0.12));

    // Emissive tera veins
    vec3 glowA = vec3(0.10, 0.95, 1.00);
    vec3 glowB = vec3(0.78, 0.26, 0.95);
    vec3 glowC = vec3(0.38, 0.58, 1.00);
    vec3 teraGlow = mix(glowA, glowB, 0.5 + 0.5 * sin(dot(d, vec3(7.0, 5.0, 3.0)) + uTime * 0.7));
    teraGlow = mix(teraGlow, glowC, 0.35);

    col += teraGlow * glowMask * 0.18;

    // Fresnel reflections do most of the work
    float ndv = max(dot(Nb, V), 0.0);
    float fres = pow(1.0 - ndv, 3.2);

    vec3 R = reflect(-V, Nb);
    vec3 env = fakeCaveEnv(R);

    // Stronger reflection than the brighter Terastal version
    float reflAmt = mix(0.08, 0.42, fres);
    col = mix(col, env, reflAmt);

    // Wet cave specular
    vec3 H = normalize(V + L);
    float ndh = max(dot(Nb, H), 0.0);
    float spec = pow(ndh, 180.0) * 0.28;
    col += env * spec;

    // Extra edge shimmer
    col += teraGlow * fres * 0.10;

    // Final grading
    col = gradeRaidCave(col);

    BASE_COLOR = vec4(0.0, 0.0, 0.0, 1.0);
    EMISSIVE_COLOR = col;

    METALNESS = 0.0;
    SPECULAR_AMOUNT = 0.0;
    ROUGHNESS = 1.0;
}