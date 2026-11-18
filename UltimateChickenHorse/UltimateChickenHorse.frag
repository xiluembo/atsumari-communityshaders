// UltimateChickenHorse.frag
// Ultimate Chicken Horse inspired sphere:
// - grass / dirt / wood / sky toy-box palette
// - hazard stripes
// - checker accents
// - playful badges / arrows / stars
// - cheerful party-game shading
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

void patchProject(in vec3 dir, in vec3 centerDir, out vec2 p2, out float patchMask)
{
    vec3 up = abs(centerDir.y) > 0.9 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
    vec3 xA = normalize(cross(up, centerDir));
    vec3 yA = cross(centerDir, xA);

    float z = dot(dir, centerDir);
    vec2 q = vec2(dot(dir, xA), dot(dir, yA));

    p2 = q / max(0.18, z + 0.18);

    float maxAngle = 0.76;
    float zMin = cos(maxAngle);
    patchMask = smoothstep(zMin, zMin + 0.05, z);
}

float ringShape(vec2 p, float radius, float width)
{
    return aaLine(abs(length(p) - radius), width);
}

float boxMask(vec2 p, vec2 b, float feather)
{
    vec2 d = abs(p) - b;
    float dist = max(d.x, d.y);
    return 1.0 - smoothstep(0.0, feather, dist);
}

float starShape(vec2 p, float rOuter, float rInner, float points)
{
    float a = atan(p.y, p.x);
    float r = length(p);

    float wave = 0.5 + 0.5 * cos(a * points);
    float rr = mix(rInner, rOuter, pow(wave, 1.6));

    return 1.0 - smoothstep(rr, rr + 0.020, r);
}

float arrowShape(vec2 p)
{
    float shaft = boxMask(p - vec2(-0.03, 0.0), vec2(0.10, 0.028), 0.014);
    float headA = aaLine(abs((p.x - 0.08) - ( p.y * 0.9)), 0.030);
    float headB = aaLine(abs((p.x - 0.08) - (-p.y * 0.9)), 0.030);
    float head = max(headA, headB) * (1.0 - smoothstep(0.08, 0.18, abs(p.x - 0.08)));
    return max(shaft, head);
}

float xMark(vec2 p)
{
    float d1 = aaLine(abs((p.x - p.y) * 0.7071), 0.030);
    float d2 = aaLine(abs((p.x + p.y) * 0.7071), 0.030);
    return max(d1, d2) * (1.0 - smoothstep(0.18, 0.28, length(p)));
}

void MAIN()
{
    vec3 d = normalize(vDirOS);

    // Stable spherical UV
    vec2 uv = vec2(
        atan(d.z, d.x) / 6.2831853 + 0.5,
        d.y * 0.5 + 0.5
    );

    // Ultimate Chicken Horse-inspired palette
    vec3 skyBlue    = vec3(0.48, 0.78, 0.98);
    vec3 cloudWhite = vec3(0.98, 0.98, 0.95);
    vec3 grassGreen = vec3(0.46, 0.84, 0.26);
    vec3 leafGreen  = vec3(0.30, 0.62, 0.18);
    vec3 dirtBrown  = vec3(0.60, 0.40, 0.22);
    vec3 woodTan    = vec3(0.82, 0.62, 0.34);
    vec3 ropeOrange = vec3(0.94, 0.58, 0.18);
    vec3 warnYellow = vec3(0.98, 0.84, 0.18);
    vec3 warnRed    = vec3(0.90, 0.22, 0.18);
    vec3 inkDark    = vec3(0.10, 0.09, 0.08);
    vec3 pinkParty  = vec3(0.96, 0.44, 0.66);

    // Base terrain-like fields
    float n1 = noise21(uv * 3.0 + vec2(0.8, 1.3));
    float n2 = noise21(uv * 6.0 + vec2(2.7, 0.7));
    float n3 = noise21(uv * 10.0 + vec2(5.2, 4.1));

    vec3 col = mix(skyBlue, grassGreen, smoothstep(0.30, 0.78, n1));
    col = mix(col, dirtBrown, smoothstep(0.66, 0.94, n2) * 0.30);
    col = mix(col, woodTan,   smoothstep(0.72, 0.96, n3) * 0.16);

    // Grass-top style band
    float grassBand = 1.0 - smoothstep(0.08, 0.18, abs(d.y - 0.16));
    col = mix(col, grassGreen, grassBand * 0.32);
    col = mix(col, leafGreen,  grassBand * 0.14);

    // Wooden plank stripe accents
    float plank = abs(sin((d.x + d.z) * 12.0 + n2 * 3.0));
    float plankMask = 1.0 - smoothstep(0.06, 0.12, plank);
    col = mix(col, woodTan, plankMask * 0.12);

    // Hazard stripe band
    float hazardBand = 1.0 - smoothstep(0.10, 0.16, abs(d.x * 0.92 - d.z * 0.36 + 0.04));
    float hazardCoord = d.y * 12.0 + (d.x + d.z) * 9.0;
    float hazardStripe = step(0.0, sin(hazardCoord));
    vec3 hazardCol = mix(warnYellow, warnRed, hazardStripe);
    col = mix(col, hazardCol, hazardBand * 0.42);

    // Checker accent band
    float checkerBand = 1.0 - smoothstep(0.10, 0.15, abs(d.z * 0.88 + d.x * 0.28 - 0.06));
    vec2 checkerUV = vec2(
        atan(d.z, d.x) / 6.2831853 * 18.0,
        d.y * 12.0
    );
    vec2 cc = floor(checkerUV);
    float checker = mod(cc.x + cc.y, 2.0);
    vec3 checkerCol = mix(cloudWhite, pinkParty, checker);
    col = mix(col, checkerCol, checkerBand * 0.24);

    // Decorative badge patches
    vec3 cA = normalize(vec3( 0.76,  0.18,  0.62));
    vec3 cB = normalize(vec3(-0.52,  0.54,  0.64));
    vec3 cC = normalize(vec3( 0.10, -0.58,  0.81));

    vec2 pA, pB, pC;
    float mA, mB, mC;

    patchProject(d, cA, pA, mA);
    patchProject(d, cB, pB, mB);
    patchProject(d, cC, pC, mC);

    // Star badge
    float badgeA = ringShape(pA, 0.24, 0.018) * mA;
    float starA  = starShape(rotate2(pA, 0.25), 0.14, 0.06, 5.0) * mA;
    col = mix(col, warnYellow, badgeA * 0.55);
    col = mix(col, cloudWhite, starA  * 0.80);

    // Arrow / movement / trap cue
    float badgeB = ringShape(pB, 0.22, 0.018) * mB;
    float arrowB = arrowShape(rotate2(pB, -0.18)) * mB;
    col = mix(col, ropeOrange, badgeB * 0.45);
    col = mix(col, warnRed,    arrowB * 0.75);

    // X marker / "ouch" sign
    float badgeC = ringShape(pC, 0.23, 0.018) * mC;
    float xC     = xMark(rotate2(pC, 0.12)) * mC;
    col = mix(col, warnYellow, badgeC * 0.42);
    col = mix(col, inkDark,    xC * 0.72);

    // Confetti / party specks
    float confA = step(0.993, hash21(floor(uv * 42.0)));
    float confB = step(0.994, hash21(floor((uv + vec2(0.37, 0.12)) * 54.0)));
    vec3 confColor = mix(pinkParty, cloudWhite, 0.5 + 0.5 * sin(dot(d, vec3(4.0, 3.0, 2.0))));
    col += confColor * (confA * 0.12 + confB * 0.08);

    // Subtle outline-ish doodle strokes
    float doodle1 = abs(sin((d.x - d.z) * 18.0 + n1 * 5.0));
    float doodle2 = abs(sin((d.x + d.y) * 14.0 + n2 * 6.0));
    float doodleMask = (1.0 - smoothstep(0.04, 0.10, doodle1)) * 0.10
                     + (1.0 - smoothstep(0.03, 0.08, doodle2)) * 0.08;
    col = mix(col, inkDark, clamp(doodleMask, 0.0, 1.0));

    // Lighting
    vec3 N = normalize(NORMAL);
    vec3 V = normalize(VIEW_VECTOR);
    vec3 L = normalize(vec3(-0.30, 0.88, 0.34));

    float ndl = max(dot(N, L), 0.0);

    // Cheerful soft toon shading
    float bands = 4.0;
    float q = floor(ndl * bands) / max(1.0, (bands - 1.0));
    float lit = mix(0.76, 1.00, q);
    col *= lit;

    // Glossy toy/plastic highlight
    vec3 H = normalize(V + L);
    float ndh = max(dot(N, H), 0.0);
    float spec = pow(ndh, 90.0) * 0.10;
    col += vec3(1.0) * spec;

    // Soft environment reflection
    vec3 R = reflect(-V, N);
    vec3 envTop = vec3(0.78, 0.92, 1.00);
    vec3 envBot = vec3(0.20, 0.24, 0.16);
    float envT = clamp(R.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 env = mix(envBot, envTop, envT);

    float ndv = max(dot(N, V), 0.0);
    float fres = pow(1.0 - ndv, 2.8);
    col = mix(col, env, fres * 0.10);

    // Playful colored rim
    float rim = pow(1.0 - ndv, 2.3);
    vec3 rimColor = mix(grassGreen, warnYellow, 0.5 + 0.5 * d.y);
    col += rimColor * rim * 0.10;

    // Final grade
    col = (col - 0.5) * 1.08 + 0.5;
    col = pow(clamp(col, 0.0, 1.0), vec3(0.95));

    BASE_COLOR = vec4(0.0, 0.0, 0.0, 1.0);
    EMISSIVE_COLOR = clamp(col, 0.0, 1.0);

    METALNESS = 0.0;
    SPECULAR_AMOUNT = 0.0;
    ROUGHNESS = 1.0;
}
