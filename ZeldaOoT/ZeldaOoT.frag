// ZeldaOoT.frag
// The Legend of Zelda: Ocarina of Time (2026) inspired shader.
// Ancient moss-covered stone, dark emerald enamel and gilded Temple of Time
// engravings. Flowing Triforce inlays, Hylian rune borders, circulating
// Ocarina magic, and occasional Navi-blue glows.
//
// Technical properties:
// - MAIN only; no custom uniforms beyond existing uTime.
// - Seamless longitude and pole-safe 3D procedural material.
// - Fully cyclic 60s motion, including projectile/rune positions.
// - PBR metalness, roughness and physically perturbed normal.
// - No QML, texture or light-processor changes required.

VARYING vec3 vDirOS;
VARYING vec3 vWorldPos;

const float TAU = 6.28318530718;

float hash3(vec3 p)
{
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
}

float noise3(vec3 p)
{
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);

    float a = hash3(i + vec3(0.0, 0.0, 0.0));
    float b = hash3(i + vec3(1.0, 0.0, 0.0));
    float c = hash3(i + vec3(0.0, 1.0, 0.0));
    float e = hash3(i + vec3(1.0, 1.0, 0.0));
    float f0 = hash3(i + vec3(0.0, 0.0, 1.0));
    float g = hash3(i + vec3(1.0, 0.0, 1.0));
    float h = hash3(i + vec3(0.0, 1.0, 1.0));
    float j = hash3(i + vec3(1.0, 1.0, 1.0));

    float lo = mix(mix(a, b, u.x), mix(c, e, u.x), u.y);
    float hi = mix(mix(f0, g, u.x), mix(h, j, u.x), u.y);
    return mix(lo, hi, u.z);
}

float fbm3(vec3 p)
{
    float v = 0.0;
    v += 0.56 * noise3(p); p = p * 2.03 + vec3(1.7, 2.4, 0.9);
    v += 0.28 * noise3(p); p = p * 2.02 + vec3(0.2, 3.0, 1.1);
    v += 0.16 * noise3(p);
    return v;
}

float lineMask(float x, float thickness, float feather)
{
    return 1.0 - smoothstep(thickness, thickness + feather, abs(x));
}

float ringLine(float distanceToCenter, float radius, float width)
{
    return 1.0 - smoothstep(width, width + 0.015,
                            abs(distanceToCenter - radius));
}

// Signed distance to an equilateral triangle; negative inside.
float sdTriangle(vec2 p, float size)
{
    const float SQRT3 = 1.73205080757;
    p.x = abs(p.x) - size;
    p.y = p.y + size / SQRT3;
    if (p.x + SQRT3 * p.y > 0.0)
        p = 0.5 * vec2(p.x - SQRT3 * p.y, -SQRT3 * p.x - p.y);
    p.x -= clamp(p.x, -2.0 * size, 0.0);
    return -length(p) * sign(p.y);
}

float triangle(vec2 p, float size)
{
    float sd = sdTriangle(p, size);
    return 1.0 - smoothstep(-0.006, 0.010, sd);
}

// Three interlocked golden triangles, used as a continuous repeating frieze
// rather than as a stationary sticker on one side of the sphere.
float triforce(vec2 p, float size)
{
    float dx = size * 1.04;
    float dy = size * 0.62;
    float upper = triangle(p - vec2(0.0, dy), size);
    float left  = triangle(p - vec2(-dx, -dy), size);
    float right = triangle(p - vec2( dx, -dy), size);
    return max(upper, max(left, right));
}

// Return a wrapped periodic angle in [-PI, PI].
// A glyph near zero traverses the meridian without jumping.
float wrappedAngle(float phase)
{
    return atan(sin(phase), cos(phase));
}

float triforceFrieze(float phi, float y, float t)
{
    // Six groups, each performing one full revolution in 60 seconds.
    float phase = wrappedAngle(6.0 * (phi - t) + 0.30);
    vec2 q = vec2(phase * 0.21, (y - 0.36) * 1.85);
    return triforce(q, 0.108);
}

float triforceEngraving(float phi, float y, float t)
{
    float phase = wrappedAngle(6.0 * (phi - t) + 0.30);
    vec2 q = vec2(phase * 0.21, (y - 0.36) * 1.85);
    float outer = triforce(q, 0.114);
    float inner = triforce(q, 0.086);
    return max(0.0, outer - inner);
}

// Hylian-inspired geometric writing, continuously carved around a parallel.
float runeBand(float phi, float y, float t)
{
    float phase = wrappedAngle(9.0 * (phi + 2.0 * t) + 1.1);
    vec2 q = vec2(phase * 0.22, (y + 0.39) * 2.15);

    float border = lineMask(abs(q.x) + abs(q.y) - 0.205, 0.016, 0.012);
    float stem = lineMask(q.x, 0.018, 0.010) *
                 (1.0 - smoothstep(0.11, 0.15, abs(q.y)));
    float cross = lineMask(q.y + 0.02, 0.016, 0.010) *
                  (1.0 - smoothstep(0.10, 0.15, abs(q.x)));
    return clamp(max(border, max(stem, cross)), 0.0, 1.0);
}

vec3 rotateY(vec3 p, float a)
{
    float c = cos(a), s = sin(a);
    return vec3(c*p.x + s*p.z, p.y, -s*p.x + c*p.z);
}

// A glint that travels along a complete 3D orbital path on the sphere.
vec2 naviOrbit(vec3 d, float t, float phase, float height, float turns)
{
    float angle = turns * t + phase;
    float y = height + 0.08 * sin(t + phase);
    float rr = sqrt(max(0.0, 1.0 - y*y));
    vec3 center = vec3(rr*cos(angle), y, rr*sin(angle));
    float dist = length(d - center);
    float core = 1.0 - smoothstep(0.010, 0.033, dist);
    float halo = 1.0 - smoothstep(0.018, 0.140, dist);
    return vec2(core, halo);
}

void MAIN()
{
    // Exact endpoints: 1 -> 0 and 3600 -> 2PI.
    // No discontinuity when the user's timer restarts at 1.
    float t = (uTime - 1.0) * (TAU / 3599.0);
    vec3 d = normalize(vDirOS);
    float phi = atan(d.z, d.x);
    float y = d.y;
    float eq = max(0.0, 1.0 - y*y);
    float latitude = asin(clamp(y, -1.0, 1.0));

    // Material palette: forest stone, Hyrule gold, Temple of Time stone,
    // Ocarina sapphire and Navi's turquoise light.
    vec3 darkStone  = vec3(0.035, 0.063, 0.058);
    vec3 greenStone = vec3(0.100, 0.205, 0.142);
    vec3 paleStone  = vec3(0.245, 0.305, 0.220);
    vec3 moss       = vec3(0.073, 0.275, 0.118);
    vec3 forest     = vec3(0.040, 0.125, 0.078);
    vec3 blackInk   = vec3(0.017, 0.027, 0.033);
    vec3 bronze     = vec3(0.345, 0.205, 0.075);
    vec3 gold       = vec3(0.815, 0.580, 0.175);
    vec3 brightGold = vec3(1.000, 0.840, 0.365);
    vec3 ocarina    = vec3(0.055, 0.225, 0.445);
    vec3 fairy      = vec3(0.315, 0.930, 1.000);

    // ------------------------------------------------------------
    // 1. Truly seamless ancient stone and moss.
    // Object-space 3D sampling has no cylindrical UV seam or poles.
    // ------------------------------------------------------------
    float stoneA = fbm3(d * 5.2 + vec3(1.2, 2.7, 0.8));
    float stoneB = fbm3(d * 13.2 + vec3(6.4, 0.5, 2.2));
    float grain  = noise3(d * 39.0 + vec3(0.7, 3.3, 5.1));
    float mossField = fbm3(d * 8.7 + vec3(3.1, 4.8, 1.4));

    vec3 col = mix(darkStone, greenStone,
                   smoothstep(0.22, 0.78, stoneA));
    col = mix(col, paleStone,
              smoothstep(0.56, 0.84, stoneB) * 0.37);
    float mossCover = smoothstep(0.53, 0.75, mossField);
    col = mix(col, moss, mossCover * 0.53);
    col = mix(col, forest, (1.0 - grain) * 0.070);

    // Gentle cyclical twilight: 0->1->0 within exactly one 60s cycle.
    float twilight = 0.5 - 0.5 * cos(t);
    col *= mix(vec3(1.0), vec3(0.83, 0.88, 1.06), twilight * 0.36);

    // ------------------------------------------------------------
    // 2. Sculpted Temple of Time stonework and gilded borders.
    // All meridian-dependent terms use integer angular frequencies.
    // At poles, longitudinal lines fade naturally.
    // ------------------------------------------------------------
    float arc = sin(6.0*phi + 0.18*sin(8.0*latitude));
    float gateGroove = lineMask(arc, 0.055, 0.045) * eq * eq;

    float belt0 = lineMask(abs(y) - 0.76, 0.020, 0.026);
    float belt1 = lineMask(abs(y) - 0.56, 0.014, 0.021);
    float belt2 = lineMask(y + 0.11, 0.014, 0.020);
    float broadBelts = clamp(belt0 + belt1 + belt2, 0.0, 1.0);

    float fineBelt = lineMask(sin(13.0*latitude), 0.042, 0.035);
    float carvedBelt = broadBelts * 0.85 + fineBelt * 0.12;

    // Crackle remains in object space and does not turn into an aura.
    float cracks = lineMask(stoneB - 0.49, 0.010, 0.020) * 0.22;

    col = mix(col, blackInk, gateGroove * 0.70);
    col = mix(col, bronze, broadBelts * 0.76);
    col = mix(col, gold, broadBelts * 0.35);
    col = mix(col, blackInk, cracks * 0.52);

    // Curved overlapping gold filigree, not isolated sticker icons.
    float filigreePhase =
        8.0*phi + 5.0*y + 0.55*sin(6.0*phi - 2.0*y) - 2.0*t;
    float filigree = lineMask(sin(filigreePhase), 0.055, 0.045);
    filigree *= smoothstep(0.08, 0.31, eq) * 0.82;

    float filigreeEdge = lineMask(abs(sin(filigreePhase)) - 0.135,
                                  0.020, 0.020);
    filigreeEdge *= smoothstep(0.08, 0.31, eq);

    col = mix(col, bronze, filigreeEdge * 0.65);
    col = mix(col, gold, filigree * 0.64);

    // ------------------------------------------------------------
    // 3. Moving Triforce and Hylian-script engravings.
    // These are worked into continuous stone friezes.
    // ------------------------------------------------------------
    float tfSolid = triforceFrieze(phi, y, t);
    float tfOutline = triforceEngraving(phi, y, t);
    float rune = runeBand(phi, y, t);

    float tfGuide = lineMask(y - 0.36, 0.145, 0.026);
    float runeGuide = lineMask(y + 0.39, 0.108, 0.025);

    col = mix(col, darkStone, tfGuide * 0.32);
    col = mix(col, bronze, tfSolid * 0.92);
    col = mix(col, gold, tfOutline * 0.94);
    col = mix(col, brightGold, tfOutline * 0.18);

    col = mix(col, darkStone, runeGuide * 0.18);
    col = mix(col, bronze, rune * 0.44);
    col = mix(col, gold, rune * 0.74);

    // ------------------------------------------------------------
    // 4. Ocarina magic: flowing blue lines and circulating fairy light.
    // The time multipliers are integers so all motion closes in 60s.
    // ------------------------------------------------------------
    float musicalPhase = 7.0*phi - 3.0*y - 3.0*t
                       + 0.4*sin(4.0*phi + 6.0*y);
    float musicalLine = lineMask(sin(musicalPhase), 0.050, 0.055);
    musicalLine *= smoothstep(0.08, 0.30, eq);

    // Sapphire inlays stay narrow, allowing the stone and gold to dominate.
    col = mix(col, ocarina, musicalLine * 0.35);

    vec2 naviA = naviOrbit(d, t, 0.20, 0.16, 1.0);
    vec2 naviB = naviOrbit(d, t, 2.60, -0.26, -2.0);
    vec2 naviC = naviOrbit(d, t, 4.30, 0.57, 1.0);

    float fairyCore = clamp(naviA.x + naviB.x + naviC.x, 0.0, 1.0);
    float fairyHalo = clamp(naviA.y + naviB.y + naviC.y, 0.0, 1.0);

    // Rare flashes are smooth and periodic, never random frame swaps.
    float runeFlash = pow(max(0.0, sin(4.0*t + 0.75)), 14.0);
    float magicGlow = musicalLine * (0.11 + 0.23*runeFlash);
    float goldGlow = tfOutline * pow(max(0.0, sin(3.0*t + 1.1)), 10.0);

    col = mix(col, fairy, fairyHalo * 0.23);
    col = mix(col, fairy, fairyCore * 0.90);
    col = mix(col, brightGold, goldGlow * 0.40);

    // ------------------------------------------------------------
    // 5. Actual shading relief from the same carved structures.
    // ------------------------------------------------------------
    float heightField =
        0.060 * (stoneA - 0.5) +
        0.042 * (stoneB - 0.5) +
        0.014 * (grain - 0.5) +
        0.042 * mossCover -
        0.130 * gateGroove +
        0.140 * broadBelts +
        0.045 * fineBelt -
        0.045 * cracks +
        0.100 * filigree +
        0.055 * filigreeEdge +
        0.170 * tfSolid +
        0.100 * tfOutline +
        0.135 * rune +
        0.065 * musicalLine;

    vec3 N = normalize(NORMAL);
    vec3 dpdx = dFdx(vWorldPos);
    vec3 dpdy = dFdy(vWorldPos);
    float dhdx = dFdx(heightField);
    float dhdy = dFdy(heightField);

    // Height changes create edge highlights and shadowed crevices.
    float bumpStrength = 1.85;
    vec3 dx = dpdx + N * (dhdx * bumpStrength);
    vec3 dy = dpdy + N * (dhdy * bumpStrength);
    vec3 Nb = normalize(cross(dx, dy));
    if (dot(Nb, N) < 0.0) Nb = -Nb;
    NORMAL = normalize(mix(N, Nb, 0.86));

    // ------------------------------------------------------------
    // 6. Stylized fill light + actual QtQuick3D PBR materials.
    // ------------------------------------------------------------
    vec3 V = normalize(VIEW_VECTOR);
    vec3 L = normalize(vec3(-0.27, 0.86, 0.43));
    float lambert = max(dot(NORMAL, L), 0.0);
    col *= mix(0.70, 1.03, lambert);

    vec3 H = normalize(V + L);
    float spec = pow(max(dot(NORMAL, H), 0.0), 100.0);
    float metalAreas = clamp(broadBelts * 0.84 + filigree * 0.78 +
                             tfSolid + rune, 0.0, 1.0);
    col += brightGold * spec * metalAreas * 0.065;

    // A fine, neutral gold edge reflection, not a polar halo.
    float edge = pow(1.0 - max(dot(NORMAL, V), 0.0), 3.2);
    col += gold * edge * 0.023;

    BASE_COLOR = vec4(clamp(col, 0.0, 1.0), 1.0);

    EMISSIVE_COLOR = clamp(
        col * 0.22 +
        fairy * (0.78*fairyCore + 0.24*fairyHalo + magicGlow) +
        brightGold * (0.34*goldGlow + 0.025*tfOutline),
        0.0, 1.0
    );

    METALNESS = mix(0.07, 0.83, metalAreas);
    ROUGHNESS = mix(0.85, 0.25, metalAreas);
    SPECULAR_AMOUNT = mix(0.38, 0.91, metalAreas);
}
