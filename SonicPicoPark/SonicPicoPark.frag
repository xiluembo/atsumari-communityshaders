// SonicPicoPark.frag
// Sonic + PICO PARK: bright minimalist cooperative puzzle sphere.
//
// - Saturated Sonic blue and clean Pico Park platform colors
// - 3D-procedural, seam-safe square tiles over the entire sphere
// - Eight pixel-cat markers moving together around the equator
// - Two rows of true golden rings, moving in opposite directions
// - Six repeating spring pads, a moving speed-loop and spin trails
// - Physical engraved/raised tile relief with QtQuick3D PBR lighting
// - No texture assets, no QML edits, no custom uniform except uTime
// - Exact visual loop: uTime = 1 and uTime = 3600 are identical

VARYING vec3 vDirOS;
VARYING vec3 vWorldPos;

const float TAU = 6.28318530718;
const float INV_TAU = 0.15915494309;

float aaBox(vec2 p, vec2 b)
{
    vec2 q = abs(p) - b;
    float sd = max(q.x, q.y);
    float aa = max(fwidth(sd), 0.0035);
    return 1.0 - smoothstep(-aa, aa, sd);
}

float aaLine(float sd, float width)
{
    float aa = max(fwidth(sd), 0.0025);
    return 1.0 - smoothstep(width - aa, width + aa, abs(sd));
}

float hash31(vec3 p)
{
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
}

float noise3(vec3 p)
{
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 w = f * f * (3.0 - 2.0 * f);

    float a = hash31(i + vec3(0.0, 0.0, 0.0));
    float b = hash31(i + vec3(1.0, 0.0, 0.0));
    float c = hash31(i + vec3(0.0, 1.0, 0.0));
    float e = hash31(i + vec3(1.0, 1.0, 0.0));
    float f0 = hash31(i + vec3(0.0, 0.0, 1.0));
    float g = hash31(i + vec3(1.0, 0.0, 1.0));
    float h = hash31(i + vec3(0.0, 1.0, 1.0));
    float j = hash31(i + vec3(1.0, 1.0, 1.0));

    float lower = mix(mix(a, b, w.x), mix(c, e, w.x), w.y);
    float upper = mix(mix(f0, g, w.x), mix(h, j, w.x), w.y);
    return mix(lower, upper, w.z);
}

// Fully 3D triplanar checkerboard and grid, blended by surface orientation.
// Neither UV wrapping nor longitude derivatives are used here.
vec3 triplanarTiles(vec3 d, float density)
{
    vec3 w = pow(abs(d), vec3(6.0));
    w /= max(w.x + w.y + w.z, 0.00001);

    vec2 xy = d.xy * density;
    vec2 yz = d.yz * density;
    vec2 zx = d.zx * density;

    vec2 fxy = abs(fract(xy) - 0.5);
    vec2 fyz = abs(fract(yz) - 0.5);
    vec2 fzx = abs(fract(zx) - 0.5);

    float cxy = mod(floor(xy.x) + floor(xy.y), 2.0);
    float cyz = mod(floor(yz.x) + floor(yz.y), 2.0);
    float czx = mod(floor(zx.x) + floor(zx.y), 2.0);

    float checker = cxy * w.z + cyz * w.x + czx * w.y;

    float edgeXY = smoothstep(0.418, 0.485, max(fxy.x, fxy.y));
    float edgeYZ = smoothstep(0.418, 0.485, max(fyz.x, fyz.y));
    float edgeZX = smoothstep(0.418, 0.485, max(fzx.x, fzx.y));
    float edge = edgeXY * w.z + edgeYZ * w.x + edgeZX * w.y;

    // Inner square creates a visibly raised platform tile.
    float coreXY = 1.0 - smoothstep(0.24, 0.41, max(fxy.x, fxy.y));
    float coreYZ = 1.0 - smoothstep(0.24, 0.41, max(fyz.x, fyz.y));
    float coreZX = 1.0 - smoothstep(0.24, 0.41, max(fzx.x, fzx.y));
    float core = coreXY * w.z + coreYZ * w.x + coreZX * w.y;

    return vec3(checker, edge, core);
}

float wrappedAngle(float a)
{
    return atan(sin(a), cos(a));
}

// Ring geometry is a closed angular distance, not a flat UV circle.
// x is locally corrected for the physical circumference of its latitude.
vec3 goldenRingLane(
    float phi, float y, float t,
    float latitude, float copies,
    float revolutions, float phase
)
{
    float offset =
        revolutions * t +
        0.035 * sin(3.0 * t + phase);

    float a = wrappedAngle(copies * (phi - offset) + phase) / copies;
    float circumference = sqrt(max(0.01, 1.0 - latitude * latitude));
    vec2 p = vec2(a * circumference, y - latitude);

    float r = length(p);
    float radius = 0.079;
    float sd = r - radius;

    float ringOuter = aaLine(sd, 0.023);
    float ringGold = aaLine(sd, 0.013);

    // Tiny gold glint on the upper-left portion of each ring.
    float glint = ringGold * smoothstep(0.15, 0.80, (-p.x + p.y) * 6.0);

    return vec3(ringOuter, ringGold, glint);
}

vec3 picoCatColor(float idx)
{
    if (idx < 0.5) return vec3(0.07, 0.76, 0.97); // Sonic blue
    if (idx < 1.5) return vec3(1.00, 0.52, 0.20); // Tails orange
    if (idx < 2.5) return vec3(0.99, 0.22, 0.30); // Knuckles red
    if (idx < 3.5) return vec3(1.00, 0.46, 0.72); // Amy pink
    if (idx < 4.5) return vec3(0.36, 0.88, 0.38); // Classic green
    if (idx < 5.5) return vec3(0.65, 0.43, 0.98); // Purple
    if (idx < 6.5) return vec3(1.00, 0.88, 0.22); // Yellow
    return vec3(0.91, 0.94, 0.98);               // White
}

// One contiguous 8-player row. The colorful cat-like silhouettes
// are embossed INTO the spherical platform (not hovering stickers).
// Returns: body, black outline/eyes, local palette index.
vec3 catRow(float phi, float y, float t)
{
    const float copies = 8.0;
    float travel = t + 0.032 * sin(2.0 * t);
    float scaled = copies * (phi - travel);

    float localAngle = wrappedAngle(scaled) / copies;
    float rawIndex = floor(scaled * INV_TAU + 0.5);
    float idx = mod(rawIndex, copies);

    vec2 p = vec2(localAngle * 1.47, y * 1.82);
    p = floor(p * 55.0 + 0.5) / 55.0;

    float head = aaBox(p - vec2(0.0, 0.035), vec2(0.222, 0.155));
    float leftEar = aaBox(p - vec2(-0.154, 0.201), vec2(0.068, 0.090));
    float rightEar = aaBox(p - vec2(0.154, 0.201), vec2(0.068, 0.090));
    float torso = aaBox(p - vec2(0.0, -0.153), vec2(0.133, 0.095));

    float body = max(max(head, leftEar), max(rightEar, torso));

    float edgeHead = aaBox(p - vec2(0.0, 0.035), vec2(0.247, 0.179));
    float edgeLeftEar = aaBox(p - vec2(-0.154, 0.201), vec2(0.092, 0.114));
    float edgeRightEar = aaBox(p - vec2(0.154, 0.201), vec2(0.092, 0.114));
    float edgeTorso = aaBox(p - vec2(0.0, -0.153), vec2(0.152, 0.115));
    float silhouette = max(max(edgeHead, edgeLeftEar), max(edgeRightEar, edgeTorso));

    float eye1 = aaBox(p - vec2(-0.080, 0.038), vec2(0.024, 0.034));
    float eye2 = aaBox(p - vec2( 0.080, 0.038), vec2(0.024, 0.034));

    float ink = clamp(silhouette - body + eye1 + eye2, 0.0, 1.0);
    return vec3(body, ink, idx);
}

// A small pixel spring: red base, white central plunger and
// an optional golden impact sparkle. Rotates on a closed orbit.
vec3 springRow(float phi, float y, float t)
{
    float copies = 6.0;
    float phase = copies * (phi + 2.0 * t) + 0.45;
    float a = wrappedAngle(phase) / copies;

    vec2 p = vec2(a * 1.9, (y + 0.78) * 2.0);
    p = floor(p * 40.0 + 0.5) / 40.0;

    float base = aaBox(p - vec2(0.0, -0.025), vec2(0.150, 0.080));
    float top = aaBox(p - vec2(0.0, 0.075), vec2(0.174, 0.057));
    float whitePlate = aaBox(p - vec2(0.0, 0.085), vec2(0.115, 0.022));
    float plunger = max(top, base);

    float flash = pow(max(0.0, sin(4.0 * t + 0.45)), 10.0);
    return vec3(plunger, whitePlate, flash * top);
}

void MAIN()
{
    float t = (uTime - 1.0) * (TAU / 3599.0);
    vec3 d = normalize(vDirOS);

    // Longitude is ONLY used inside integer-periodic / wrapped patterns.
    float phi = atan(d.z, d.x);
    float y = d.y;
    float equator = max(0.0, 1.0 - y * y);

    // ------------------------------------------------------------
    // Sonic + Pico Park palette: crisp, cheerful, recognizable.
    // ------------------------------------------------------------
    vec3 navy = vec3(0.018, 0.085, 0.23);
    vec3 sonicBlue = vec3(0.025, 0.36, 0.86);
    vec3 skyBlue = vec3(0.13, 0.71, 1.00);
    vec3 paperWhite = vec3(0.91, 0.97, 1.00);
    vec3 platformGreen = vec3(0.22, 0.81, 0.28);
    vec3 grassHighlight = vec3(0.55, 0.97, 0.38);
    vec3 springRed = vec3(1.00, 0.15, 0.20);
    vec3 ringGold = vec3(1.00, 0.69, 0.10);
    vec3 ringBright = vec3(1.00, 0.95, 0.43);

    // ------------------------------------------------------------
    // 3D texture domain: no visible seam or polar stretching.
    // Color changes are smooth, but square tiles remain sharp.
    // ------------------------------------------------------------
    vec3 tile = triplanarTiles(d, 8.8);
    float checker = tile.x;
    float tileEdges = tile.y;
    float tileCore = tile.z;

    float broad = noise3(d * 3.2 + vec3(1.1, 3.5, 2.2));
    float details = noise3(d * 7.2 + vec3(7.3, 0.2, 1.8));

    // Colors move gently without making the material slide off the sphere.
    float bluePulse = 0.5 + 0.5 * sin(2.0 * t + 4.0 * d.x + 3.0 * d.z);

    vec3 col = mix(navy, sonicBlue, 0.65 + 0.26 * broad);
    col = mix(col, skyBlue, 0.10 * bluePulse);

    float stageArea = smoothstep(0.37, 0.67, broad);
    float platformTiles = stageArea * tileCore;
    float whiteTiles = platformTiles * (0.22 + 0.78 * checker);
    float greenTiles = platformTiles * (1.0 - checker) * 0.78;

    col = mix(col, paperWhite, whiteTiles * 0.92);
    col = mix(col, platformGreen, greenTiles * 0.93);
    col = mix(col, grassHighlight, greenTiles * details * 0.25);

    // Dark outlines evoke Pico Park's simple block platforms.
    col = mix(col, navy, stageArea * tileEdges * 0.46);

    // Small digital square facets add tactile relief without static noise.
    col += vec3(0.05, 0.11, 0.14) * tileCore * (1.0 - stageArea) * 0.16;

    // ------------------------------------------------------------
    // Sonic's moving loop / speed-line system.
    // Defined as great circles in 3D, with no UV discontinuity.
    // ------------------------------------------------------------
    vec3 loopNormalA = normalize(vec3(cos(t), 0.36, sin(t)));
    vec3 loopNormalB = normalize(vec3(sin(2.0 * t), -0.44, cos(2.0 * t)));

    float loopA = aaLine(dot(d, loopNormalA), 0.031);
    float loopB = aaLine(dot(d, loopNormalB), 0.023);

    // Segmented spin speed marks, always periodic.
    float dashes = smoothstep(
        0.62, 0.82,
        sin(28.0 * dot(d, vec3(0.70, 0.20, -0.68)) + 3.0 * t)
    );

    float speedTracks = max(loopA, loopB);
    float speedMarks = speedTracks * dashes;

    col = mix(col, navy, speedTracks * 0.35);
    col = mix(col, skyBlue, loopA * 0.70);
    col = mix(col, paperWhite, speedMarks * 0.85);

    // A periodic Spin Dash energy ripple, localized on the same tracks.
    float spinBurst = pow(max(0.0, sin(3.0 * t + 5.0 * d.x)), 12.0);
    float spinGlow = speedMarks * spinBurst;

    // ------------------------------------------------------------
    // True golden rings, moving in opposite directions.
    // ------------------------------------------------------------
    vec3 ringsA = goldenRingLane(phi, y, t, 0.51, 9.0, 1.0, 0.32);
    vec3 ringsB = goldenRingLane(phi, y, t, -0.48, 10.0, -2.0, 1.15);

    float ringOuter = clamp(ringsA.x + ringsB.x, 0.0, 1.0);
    float ringBody = clamp(ringsA.y + ringsB.y, 0.0, 1.0);
    float ringGlint = clamp(ringsA.z + ringsB.z, 0.0, 1.0);

    col = mix(col, navy, ringOuter * 0.85);
    col = mix(col, ringGold, ringBody);
    col = mix(col, ringBright, ringGlint * 0.80);

    // ------------------------------------------------------------
    // Pixel-cooperative team: eight Pico Cat silhouettes.
    // They are part of the surface relief, rather than decals.
    // ------------------------------------------------------------
    vec3 cat = catRow(phi, y, t);
    float catBody = cat.x;
    float catInk = cat.y;
    vec3 teamColor = picoCatColor(cat.z);

    // Shared rail under all the cats visually connects the team.
    float coopRail = aaLine(y + 0.175, 0.012);
    float coopRailInner = aaLine(y + 0.175, 0.004);
    col = mix(col, navy, coopRail * 0.48);
    col = mix(col, paperWhite, coopRailInner * 0.56);

    col = mix(col, teamColor, catBody);
    col = mix(col, navy, catInk);

    // ------------------------------------------------------------
    // Mechanical spring pads from Sonic stages.
    // ------------------------------------------------------------
    vec3 spring = springRow(phi, y, t);
    float springBody = spring.x;
    float springWhite = spring.y;
    float springFlash = spring.z;

    col = mix(col, navy, springBody * 0.45);
    col = mix(col, springRed, springBody * 0.88);
    col = mix(col, paperWhite, springWhite);
    col = mix(col, ringBright, springFlash * 0.60);

    // ------------------------------------------------------------
    // Embossed color-coded puzzle platform relief.
    // ------------------------------------------------------------
    float h =
        platformTiles * 0.105 +
        tileCore * 0.035 -
        stageArea * tileEdges * 0.090 +
        speedTracks * 0.065 +
        speedMarks * 0.040 +
        ringOuter * 0.060 +
        ringBody * 0.125 +
        catBody * 0.100 +
        catInk * 0.014 +
        coopRail * 0.040 +
        springBody * 0.145 +
        springWhite * 0.035 +
        (broad - 0.5) * 0.030;

    vec3 N = normalize(NORMAL);
    vec3 dx = dFdx(vWorldPos);
    vec3 dy = dFdy(vWorldPos);

    vec3 Ng = normalize(cross(dx, dy));
    if (dot(Ng, N) < 0.0)
        Ng = -Ng;

    // World-space position derivatives with world-space height offset.
    float bumpStrength = 1.90;
    vec3 dxH = dx + Ng * (dFdx(h) * bumpStrength);
    vec3 dyH = dy + Ng * (dFdy(h) * bumpStrength);

    vec3 Nr = normalize(cross(dxH, dyH));
    if (dot(Nr, Ng) < 0.0)
        Nr = -Nr;

    // Actual PBR normal response, not merely fake bevel coloring.
    NORMAL = normalize(mix(N, Nr, 0.82));

    // ------------------------------------------------------------
    // Soft cartoon lighting; keeps flat areas bright and readable.
    // ------------------------------------------------------------
    vec3 L = normalize(vec3(-0.30, 0.84, 0.44));
    float lit = max(dot(NORMAL, L), 0.0);
    col *= mix(0.90, 1.0, lit);

    // Occasional restrained glows, never global polar halos.
    float ringFlash = ringGlint * pow(max(0.0, sin(4.0 * t)), 9.0);
    vec3 glow =
        ringBright * (ringFlash * 0.26 + springFlash * 0.24) +
        skyBlue * spinGlow * 0.33;

    BASE_COLOR = vec4(clamp(col, 0.0, 1.0), 1.0);
    EMISSIVE_COLOR = clamp(glow + col * 0.025, 0.0, 1.0);

    // Satin/matte Pico Park platforms, real metallic gold rings.
    METALNESS = mix(0.045, 0.83, ringBody);
    ROUGHNESS = mix(0.72, 0.23, ringBody);
    SPECULAR_AMOUNT = 0.55;
}
