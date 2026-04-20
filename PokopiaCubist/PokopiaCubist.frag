// PokopiaCubist.frag
// Pokopia-inspired cubist relief-metal sphere:
// - sky/mint/sunflower/coral/aqua/lavender tile palette
// - pronounced but soft-pastel color treatment
// - darker blue-lavender divider ink and relief ridges
// - midtone-biased saturation and gentle stylized grading
// MAIN-only, no custom uniforms.

VARYING vec3 vDirOS;
VARYING vec3 vDirRawOS;
VARYING vec3 vWorldPos;

float hash21(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float hash11(float x) { return fract(sin(x) * 43758.5453); }

float aaLine(float dist, float w)
{
    float aa = max(fwidth(dist), 1e-4);
    return 1.0 - smoothstep(w - aa, w + aa, dist);
}

// Fast hue shift in YIQ space
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

vec3 pokopiaPalette(float t)
{
    // More pronounced than previous pastel set, but still soft.
    float i = floor(fract(t) * 8.0);

    vec3 c0 = vec3(0.58, 0.80, 0.98); // logo sky blue
    vec3 c1 = vec3(0.58, 0.90, 0.72); // mint green
    vec3 c2 = vec3(0.98, 0.84, 0.42); // sunflower yellow
    vec3 c3 = vec3(0.97, 0.60, 0.64); // coral pink
    vec3 c4 = vec3(0.78, 0.68, 0.97); // lavender
    vec3 c5 = vec3(0.50, 0.88, 0.92); // aqua
    vec3 c6 = vec3(0.64, 0.84, 0.46); // fresh leaf green
    vec3 c7 = vec3(0.98, 0.74, 0.50); // peach/orange

    vec3 c = c0;
    if (i < 1.0) c = c0;
    else if (i < 2.0) c = c1;
    else if (i < 3.0) c = c2;
    else if (i < 4.0) c = c3;
    else if (i < 5.0) c = c4;
    else if (i < 6.0) c = c5;
    else if (i < 7.0) c = c6;
    else              c = c7;

    // Keep it pastel by nudging very slightly toward white.
    c = mix(c, vec3(1.0), 0.08);
    return c;
}

// Outputs: color + ridgeMask + height
void cubistPlane(vec2 uv, float planeId, out vec3 outCol, out float ridgeMask, out float outH)
{
    float grid = 9.0;

    vec2 g = uv * grid;
    vec2 cell = floor(g);
    vec2 f = fract(g);

    float id = hash21(cell + vec2(planeId * 17.0, planeId * 3.0));

    vec3 A = pokopiaPalette(id + 0.13);
    vec3 B = pokopiaPalette(id + 0.63);

    float r = hash21(cell + vec2(19.7 + planeId, 43.1 - planeId));

    // Divider lines remain visible
    float cutDist = (r < 0.5) ? abs(f.x - f.y) : abs((f.x + f.y) - 1.0);
    float cutLine = aaLine(cutDist, 0.024);

    float edgeDist = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y));
    float aa = max(fwidth(edgeDist), 1e-4);
    float border = 1.0 - smoothstep(0.062 - aa, 0.062 + aa, edgeDist);

    float side = (r < 0.5) ? step(f.y, f.x) : step(1.0 - f.y, f.x);
    vec3 tile = mix(A, B, side);

    // Slight card/paper gradient
    float grad = dot(f - 0.5, normalize(vec2(0.7, 0.9)));
    tile *= (1.0 + grad * 0.05);

    // Colored divider ink: hue-shift tile toward blue/lavender
    vec3 shifted = hueShiftYIQ(tile, 1.02);
    vec3 targetLavBlue = vec3(0.50, 0.50, 0.96);
    vec3 inkTint = mix(shifted, targetLavBlue, 0.45);

    // Dark, but still colorful
    vec3 ink = mix(inkTint * 0.34, vec3(0.13, 0.14, 0.22), 0.18);

    float inkMask = border * 0.64 + cutLine * 0.56;
    vec3 col = mix(tile, ink, inkMask);

    ridgeMask = clamp(border * 0.92 + cutLine * 0.86, 0.0, 1.0);

    float tileH = (id - 0.5) * 0.18;
    outH = tileH + ridgeMask * 1.20;

    outCol = col;
}

vec3 fakeEnv(vec3 R)
{
    // Closer to Pokopia ambience:
    // blue sky / green fields / warm flowerbed highlights
    vec3 sky    = vec3(0.56, 0.79, 0.97);
    vec3 horizon= vec3(0.95, 0.82, 0.62);
    vec3 ground = vec3(0.63, 0.84, 0.47);

    float t = clamp(R.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 env = mix(ground, sky, t);

    // Warm horizon tint
    float h = 1.0 - abs(R.y);
    env = mix(env, horizon, h * 0.18);

    return env;
}

// More saturation in midtones, less in very dark / very bright areas
vec3 gradePokopia(vec3 c)
{
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));

    float mx = max(c.r, max(c.g, c.b));
    float mn = min(c.r, min(c.g, c.b));
    float sat = mx - mn;

    // Bell curve centered on midtones
    float x = smoothstep(0.08, 0.92, l);
    float bell = 4.0 * x * (1.0 - x);

    // Stronger vibrance for low-sat colors, especially in midtones
    float boost = 0.82 * (1.0 - sat);
    float satMix = (1.34 + boost) * (1.0 + bell * 0.34);
    satMix = clamp(satMix, 0.0, 2.10);

    c = mix(vec3(l), c, satMix);

    // Slight contrast
    c = (c - 0.5) * 1.10 + 0.5;

    // Light highlight compression, weaker than before
    c = c / (vec3(1.0) + c * 0.22);

    // Slightly brighter gamma to keep it cheerful
    c = pow(clamp(c, 0.0, 1.0), vec3(0.94));

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
    float rx, ry, rz;
    float hx, hy, hz;

    cubistPlane(uvX, 0.0, cx, rx, hx);
    cubistPlane(uvY, 1.0, cy, ry, hy);
    cubistPlane(uvZ, 2.0, cz, rz, hz);

    vec3 col = cx * w.x + cy * w.y + cz * w.z;
    float ridge = rx * w.x + ry * w.y + rz * w.z;
    float h = hx * w.x + hy * w.y + hz * w.z;

    // Very subtle stable grain
    float grain = (hash11(dot(d, vec3(12.7, 93.1, 41.3)) * 123.0) - 0.5) * 0.008;
    col += grain;

    // Relief normal from height
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
    if (dot(Nb, N) < 0.0) Nb = -Nb;

    // Soft lighting
    vec3 L = normalize(vec3(-0.35, 0.85, 0.35));
    float ndl = max(dot(Nb, L), 0.0);

    float bands = 4.0;
    float dither = (hash11(dot(d, vec3(71.3, 17.9, 53.1)) + 2.0) - 0.5) * 0.018;
    float q = floor(clamp(ndl + dither, 0.0, 1.0) * bands) / max(1.0, (bands - 1.0));

    float ambient = 0.74;
    float lit = mix(ambient, 1.00, q);
    col *= lit;

    // Bevel shading without white wash
    vec2 Ltb = vec2(dot(L, normalize(dpdx)), dot(L, normalize(dpdy)));
    float bevel = (dhdx * Ltb.x + dhdy * Ltb.y);
    col *= (1.0 + clamp(bevel * 0.52, -0.10, 0.10));

    // Tiny ridge emphasis
    col = mix(col, col * 0.985, ridge * 0.07);

    // Gentle colored rim
    float ndv = max(dot(Nb, V), 0.0);
    float rim = pow(1.0 - ndv, 2.1);
    col += fakeEnv(reflect(-V, Nb)) * rim * 0.025;

    // Slight metallic reflection, tinted by environment
    float metalness = 0.18;
    float roughness = 0.42;

    float F = pow(1.0 - ndv, 5.0);
    float F0 = mix(0.03, 0.08, metalness);
    float fresnel = clamp(F0 + (1.0 - F0) * F, 0.0, 1.0);

    vec3 R = reflect(-V, Nb);
    vec3 env = fakeEnv(R);

    float reflAmt = fresnel * (0.26 + 0.74 * metalness) * (1.0 - roughness);
    col = mix(col, env, clamp(reflAmt, 0.0, 0.12));

    // Colored spec
    vec3 H = normalize(V + L);
    float ndh = max(dot(Nb, H), 0.0);
    float specPow = mix(55.0, 140.0, 1.0 - roughness);
    float spec = pow(ndh, specPow) * (0.025 + 0.085 * metalness);
    col += env * spec;

    // Final grade
    col = gradePokopia(col);

    BASE_COLOR = vec4(0.0, 0.0, 0.0, 1.0);
    EMISSIVE_COLOR = col;

    METALNESS = 0.0;
    SPECULAR_AMOUNT = 0.0;
    ROUGHNESS = 1.0;
}
