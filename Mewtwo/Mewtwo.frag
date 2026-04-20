VARYING vec2 vPhaseData;

float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }

// Jitter estável por faixa (ancorado no índice inteiro da stripe)
float stripe_jitter(float coord)
{
    // 'coord' é a coordenada contínua antes do fract; o inteiro identifica a stripe
    float k = floor(coord);
    // hash em [-0,5, +0,5]
    return hash(vec2(k, 91.32)) - 0.5;
}

void MAIN()
{
    // ciclo completo de 240s => ~60s por transição
    float t = fract((vPhaseData.y / 2.0 + uTime) / 240.0);

    float seg  = t * 4.0;          // 4 segmentos
    float fraq = fract(seg);       // posição dentro do segmento [0,1)
    int   idx  = int(floor(seg));  // qual segmento (0..3)

    // ===== Paleta Mewtwo =====
    // Corpo claro lavanda
    vec4 body   = vec4(0.890, 0.878, 0.949, 1.0); // #e3e0f2
    // Cauda roxa
    vec4 tail   = vec4(0.482, 0.173, 0.659, 1.0); // #7b2ca8
    // Brilho psíquico magenta
    vec4 psy    = vec4(1.0,   0.4,   1.0,   1.0); // #ff66ff
    // Aura roxa profunda
    vec4 aura   = vec4(0.235, 0.0,   0.427, 1.0); // #3c006d

    // Ciclo de transição:
    // body -> tail -> psy -> aura -> body ...
    vec4 c0, c1;
    if      (idx == 0) { c0 = body; c1 = tail; }
    else if (idx == 1) { c0 = tail; c1 = psy;  }
    else if (idx == 2) { c0 = psy;  c1 = aura; }
    else               { c0 = aura; c1 = body; }

    // Easing monotônico com derivada zero nas bordas
    float w = 0.5 - 0.5 * cos(3.14159265 * fraq);
    vec4 mixColor = mix(c0, c1, w);

    vec2 vUV = UV0;

    // ====== Stripes psíquicas com jitter ======
    const float stripes   = 10.0;          // ligeiramente menos stripes que antes pra ficar mais “fluido”
    const float phase     = uTime / 240.0; // mesma fase longa
    const float gap       = 0.06;          // largura da fenda
    const float jitterAmp = 0.20;          // jitter sutil

    // stripes diagonais, como se fossem ondas psíquicas cruzando
    float diagCoord = (vUV.x + vUV.y) * 0.5;
    float baseCoord = diagCoord * stripes + phase;

    float jitter = jitterAmp * stripe_jitter(baseCoord);
    float stripe = step(gap, fract(baseCoord + jitter));

    // ===== Aura psíquica no centro =====
    // Supondo UV em [0,1], criamos um leve glow no miolo
    float d = distance(vUV, vec2(0.5, 0.5));
    // quanto mais perto do centro, maior o glow
    float auraFactor = smoothstep(0.7, 0.0, d); // 0 fora, ~1 no centro

    // mistura um pouco da cor "psy" conforme auraFactor
    vec4 auraColor = mix(mixColor, psy, 0.35 * auraFactor);

    // intensidade base do material, stripes “apagando” um pouco
    float stripeBrightness = mix(0.45, 1.0, stripe);

    BASE_COLOR = auraColor * stripeBrightness;

    METALNESS        = 0.6;  // um pouco menos metálico que o verde original
    SPECULAR_AMOUNT  = 0.8;  // brilho forte, cara de energia psíquica
    ROUGHNESS        = 0.25; // ligeiramente mais liso
}
