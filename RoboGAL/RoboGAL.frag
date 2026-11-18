// RoboGAL.frag
// RoboGAL: Gaga Delta Lady inspired animated material.
//
// Features:
// - Saturated pink, cyan, silver and dark purple palette
// - Seamless spherical procedural pixel art
// - Mechanical panels and embossed circuitry
// - Pixelated plasma shots on five latitude lanes
// - Independent but exactly periodic projectile trajectories
// - Occasional neon flashes
// - Real PBR metallic response with perturbed normals
//
// Compatible with QtQuick3D CustomMaterial.Shaded.
// MAIN-only, no additional custom uniforms.

VARYING vec3 vDirOS;
VARYING vec3 vWorldPos;

const float TAU = 6.28318530718;
const float INV_TAU = 0.15915494309;

// ------------------------------------------------------------
// Noise and geometric helpers
// ------------------------------------------------------------

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

    vec3 u = f * f * (3.0 - 2.0 * f);

    float a = hash31(i + vec3(0.0, 0.0, 0.0));
    float b = hash31(i + vec3(1.0, 0.0, 0.0));
    float c = hash31(i + vec3(0.0, 1.0, 0.0));
    float d = hash31(i + vec3(1.0, 1.0, 0.0));

    float e = hash31(i + vec3(0.0, 0.0, 1.0));
    float f1 = hash31(i + vec3(1.0, 0.0, 1.0));
    float g = hash31(i + vec3(0.0, 1.0, 1.0));
    float h = hash31(i + vec3(1.0, 1.0, 1.0));

    float low = mix(
        mix(a, b, u.x),
        mix(c, d, u.x),
        u.y
    );

    float high = mix(
        mix(e, f1, u.x),
        mix(g, h, u.x),
        u.y
    );

    return mix(low, high, u.z);
}

vec3 rotateY(vec3 p, float a)
{
    float c = cos(a);
    float s = sin(a);

    return vec3(
         c * p.x + s * p.z,
         p.y,
        -s * p.x + c * p.z
    );
}

vec3 rotateX(vec3 p, float a)
{
    float c = cos(a);
    float s = sin(a);

    return vec3(
        p.x,
        c * p.y - s * p.z,
        s * p.y + c * p.z
    );
}

vec3 pixelDirection(vec3 d, float resolution)
{
    vec3 p = floor(d * resolution + 0.5) / resolution;
    return normalize(p);
}

float boxMask(vec2 p, vec2 halfSize, float feather)
{
    vec2 q = abs(p) - halfSize;
    float dist = max(q.x, q.y);

    return 1.0 - smoothstep(0.0, feather, dist);
}

float lineMask(float x, float halfWidth, float feather)
{
    return 1.0 - smoothstep(
        halfWidth,
        halfWidth + feather,
        abs(x)
    );
}

// ------------------------------------------------------------
// A cyclic row of pixelated plasma shots
//
// Each projectile completes an integer number of revolutions
// over the 60-second animation.
//
// The angular position is wrapped with atan(sin, cos), avoiding
// visible jumps at the longitude seam.
// ------------------------------------------------------------

vec3 plasmaLane(
    float phi,
    float y,
    float t,
    float latitude,
    float halfWidth,
    float copies,
    float direction,
    float revolutions,
    float phaseOffset
)
{
    // Smooth periodic acceleration/deceleration.
    float wobble =
        0.075 * sin(2.0 * t + phaseOffset) +
        0.035 * sin(5.0 * t + phaseOffset * 1.7);

    float traveledAngle =
        direction * (revolutions * t + wobble);

    float phase =
        copies * (phi - traveledAngle) + phaseOffset;

    // Wrapped angular distance to the nearest projectile.
    float localAngle = atan(sin(phase), cos(phase));

    vec2 p = vec2(
        localAngle * INV_TAU,
        (y - latitude) / (halfWidth * 2.0)
    );

    // Pixelated visual structure.
    vec2 q = floor(p * vec2(32.0, 28.0) + 0.5);
    q /= vec2(32.0, 28.0);

    float lane = 1.0 - smoothstep(
        halfWidth * 0.82,
        halfWidth,
        abs(y - latitude)
    );

    // Main plasma projectile.
    float coreA = boxMask(
        q,
        vec2(0.090, 0.135),
        0.016
    );

    float coreB = boxMask(
        q - vec2(0.062 * direction, 0.0),
        vec2(0.048, 0.080),
        0.015
    );

    float core = max(coreA, coreB);

    // Two small pixel trails behind the projectile.
    float trailA = boxMask(
        q + vec2(0.165 * direction, 0.0),
        vec2(0.045, 0.058),
        0.012
    );

    float trailB = boxMask(
        q + vec2(0.255 * direction, 0.0),
        vec2(0.025, 0.035),
        0.012
    );

    float trail = max(trailA * 0.85, trailB * 0.55);

    // Mechanical guide rail under the shots.
    float railDistance =
        abs(abs(y - latitude) - halfWidth * 0.88);

    float rail =
        1.0 - smoothstep(0.007, 0.019, railDistance);

    return vec3(
        core * lane,
        trail * lane,
        rail
    );
}

// ------------------------------------------------------------
// Fragment main
// ------------------------------------------------------------

void MAIN()
{
    // One complete animation cycle every 60 seconds.
    float t = uTime * (TAU / 3600.0);

    vec3 d = normalize(vDirOS);

    float phi = atan(d.z, d.x);
    float y = d.y;
    float eq = max(0.0, 1.0 - y * y);

    // --------------------------------------------------------
    // RoboGAL color palette
    // --------------------------------------------------------

    vec3 ink = vec3(0.018, 0.025, 0.075);

    vec3 darkViolet = vec3(0.105, 0.035, 0.205);
    vec3 plum       = vec3(0.280, 0.055, 0.310);

    vec3 hotPink    = vec3(0.970, 0.065, 0.490);
    vec3 candyPink  = vec3(1.000, 0.400, 0.730);

    vec3 darkTeal   = vec3(0.025, 0.205, 0.230);
    vec3 cyan       = vec3(0.070, 0.820, 0.950);
    vec3 cyanLight  = vec3(0.520, 0.950, 1.000);

    vec3 silver     = vec3(0.540, 0.700, 0.760);
    vec3 silverHi   = vec3(0.810, 0.900, 0.940);

    vec3 gold       = vec3(1.000, 0.680, 0.170);

    // --------------------------------------------------------
    // Fully spherical pixel-art domain
    //
    // Pixelization is performed in 3D object space, instead
    // of a longitude/latitude UV image. This eliminates the
    // usual texture seam and avoids polar stretching.
    // --------------------------------------------------------

    vec3 pd = pixelDirection(d, 54.0);

    // Independent closed rotations.
    vec3 pA = rotateY(pd, t);
    vec3 pB = rotateX(rotateY(pd, -2.0 * t), t);
    vec3 pC = rotateY(pd, 2.0 * t);

    float nA = noise3(pA * 5.5 + vec3(1.4, 0.8, 2.1));
    float nB = noise3(pB * 8.0 + vec3(4.2, 1.7, 0.5));
    float nC = noise3(pC * 11.0 + vec3(0.7, 5.1, 2.8));

    // --------------------------------------------------------
    // Main mechanical plating
    // --------------------------------------------------------

    float plateField =
        nA +
        0.12 * cos(6.0 * phi + y * 6.0) * eq;

    float plates = smoothstep(0.36, 0.62, plateField);

    float plateEdge =
        1.0 - smoothstep(
            0.025,
            0.085,
            abs(plateField - 0.51)
        );

    // Dark purple mechanical base.
    vec3 col = mix(
        ink,
        darkViolet,
        smoothstep(0.22, 0.78, nA)
    );

    col = mix(
        col,
        plum,
        smoothstep(0.50, 0.80, nC) * 0.48
    );

    // Silver-blue armor plates.
    col = mix(
        col,
        darkTeal,
        plates * 0.52
    );

    col = mix(
        col,
        silver,
        plates * smoothstep(0.38, 0.74, nB) * 0.62
    );

    col = mix(
        col,
        silverHi,
        plates * smoothstep(0.72, 0.95, nB) * 0.36
    );

    // Rei-Bo-inspired magenta accents.
    float pinkPanels = smoothstep(
        0.62,
        0.84,
        nC + 0.09 * sin(8.0 * phi + 4.0 * y)
    );

    col = mix(
        col,
        hotPink,
        pinkPanels * 0.60
    );

    col = mix(
        col,
        candyPink,
        pinkPanels * smoothstep(0.65, 0.90, nB) * 0.32
    );

    // Strong dark printed outlines.
    col = mix(col, ink, plateEdge * 0.78);

    // --------------------------------------------------------
    // Embossed mechanical structure
    // --------------------------------------------------------

    float angularCircuit =
        sin(12.0 * phi + 2.0 * sin(y * 5.0));

    float longitudeSeams =
        lineMask(angularCircuit, 0.055, 0.050) * eq;

    float latitudeSeams =
        lineMask(
            sin(11.0 * asin(clamp(y, -1.0, 1.0))),
            0.065,
            0.035
        );

    float seams = clamp(
        longitudeSeams * 0.75 +
        latitudeSeams * 0.55,
        0.0,
        1.0
    );

    col = mix(col, ink, seams * 0.65);

    // Embossed circuitry with closed periodic movement.
    float circuitPhase =
        9.0 * phi +
        6.0 * y -
        2.0 * t +
        1.5 * nB;

    float circuits =
        lineMask(sin(circuitPhase), 0.075, 0.045) * eq;

    float circuitEdges =
        lineMask(
            abs(sin(circuitPhase)) - 0.12,
            0.028,
            0.025
        ) * eq;

    col = mix(col, cyan, circuits * 0.30);
    col = mix(col, ink, circuitEdges * 0.38);

    // --------------------------------------------------------
    // Moving plasma shots
    //
    // Five parallels, different directions and speeds.
    // Every row returns to its original arrangement after
    // exactly 60 seconds.
    // --------------------------------------------------------

    vec3 lane1 = plasmaLane(
        phi, y, t,
        -0.62, 0.085,
        7.0, 1.0, 1.0, 0.3
    );

    vec3 lane2 = plasmaLane(
        phi, y, t,
        -0.29, 0.080,
        9.0, -1.0, 2.0, 1.4
    );

    vec3 lane3 = plasmaLane(
        phi, y, t,
        0.04, 0.090,
        11.0, 1.0, 3.0, 2.5
    );

    vec3 lane4 = plasmaLane(
        phi, y, t,
        0.38, 0.080,
        8.0, -1.0, 2.0, 3.7
    );

    vec3 lane5 = plasmaLane(
        phi, y, t,
        0.70, 0.072,
        6.0, 1.0, 1.0, 4.9
    );

    float shot = clamp(
        lane1.x + lane2.x + lane3.x +
        lane4.x + lane5.x,
        0.0, 1.0
    );

    float trail = clamp(
        lane1.y + lane2.y + lane3.y +
        lane4.y + lane5.y,
        0.0, 1.0
    );

    float rails = clamp(
        lane1.z + lane2.z + lane3.z +
        lane4.z + lane5.z,
        0.0, 1.0
    );

    // Slightly darker tracks around each parallel.
    col = mix(col, darkTeal, rails * 0.48);

    // Different stages of the projectile.
    col = mix(col, hotPink, trail * 0.58);
    col = mix(col, cyan, shot * 0.88);
    col = mix(col, cyanLight, shot * 0.38);

    // --------------------------------------------------------
    // Occasional neon energy flashes
    // --------------------------------------------------------

    // Glow intensity peaks only at selected moments.
    float flashTime =
        pow(max(0.0, sin(4.0 * t + 4.0 * phi + 2.0 * y)), 12.0);

    float glowRegions =
        smoothstep(0.66, 0.86, nC);

    float glowMask = flashTime * glowRegions;

    vec3 glowColor = mix(
        hotPink,
        cyanLight,
        0.5 + 0.5 * sin(t + 4.0 * phi)
    );

    col = mix(
        col,
        glowColor,
        glowMask * 0.55
    );

    // --------------------------------------------------------
    // Physical texture / normal relief
    //
    // The same structures create both the color pattern and
    // the surface height. Thus highlights react to the relief.
    // --------------------------------------------------------

    float h =
        plates * 0.13 +
        plateEdge * 0.045 -
        seams * 0.14 +
        pinkPanels * 0.11 +
        circuits * 0.08 +
        circuitEdges * 0.035 +
        rails * 0.10 +
        shot * 0.10 +
        trail * 0.04 +
        (nA - 0.5) * 0.055 +
        (nB - 0.5) * 0.035;

    vec3 N = normalize(NORMAL);

    vec3 dpdx = dFdx(vWorldPos);
    vec3 dpdy = dFdy(vWorldPos);

    float dhdx = dFdx(h);
    float dhdy = dFdy(h);

    float bumpStrength = 1.65;

    vec3 displacedDx =
        dpdx + N * (dhdx * bumpStrength);

    vec3 displacedDy =
        dpdy + N * (dhdy * bumpStrength);

    vec3 Nb = normalize(cross(displacedDx, displacedDy));

    // Preserve the correct normal orientation.
    if (dot(Nb, N) < 0.0)
        Nb = -Nb;

    // Use the computed relief normal for PBR lighting.
    NORMAL = normalize(mix(N, Nb, 0.78));

    // --------------------------------------------------------
    // Light stylization
    // --------------------------------------------------------

    vec3 V = normalize(VIEW_VECTOR);

    vec3 fakeLight = normalize(vec3(
        -0.35, 0.82, 0.45
    ));

    float diffuse =
        max(dot(NORMAL, fakeLight), 0.0);

    // Keep the printed/pixel-art appearance readable.
    float lightFactor = mix(
        0.78,
        1.0,
        diffuse
    );

    col *= lightFactor;

    // Small edge highlight. No pole-localized aura.
    float ndv = max(dot(NORMAL, V), 0.0);
    float fresnel = pow(1.0 - ndv, 3.0);

    col += silverHi * fresnel * 0.035;

    col = clamp(col, 0.0, 1.0);

    // --------------------------------------------------------
    // PBR material
    // --------------------------------------------------------

    BASE_COLOR = vec4(col, 1.0);

    // Low ambient self-light maintains visibility when scene
    // illumination is limited. Strong emission is reserved
    // for plasma and occasional neon flashes.
    EMISSIVE_COLOR = clamp(
        col * 0.12 +
        cyanLight * shot * 0.48 +
        cyan * trail * 0.16 +
        glowColor * glowMask * 0.65,
        0.0,
        1.0
    );

    // Mechanical armor, rather than a uniformly metallic ball.
    METALNESS = mix(0.25, 0.78, plates);

    ROUGHNESS = mix(0.47, 0.24, plates);

    SPECULAR_AMOUNT = 0.78;
}
