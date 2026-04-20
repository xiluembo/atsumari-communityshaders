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
    float t = fract((vPhaseData.y / 2 + uTime) / 240.0);

    float seg  = t * 4.0;          // 4 segmentos
    float fraq = fract(seg);       // posição dentro do segmento [0,1)
    int   idx  = int(floor(seg));  // qual segmento (0..3)

    vec4 arm     = vec4(0.22, 0.867, 0.106, 1.0);
    vec4 legs    = vec4(0.051, 0.89, 0.376, 1.0);
    vec4 corex   = vec4(0.871, 0.965, 0.0, 1.0);
    vec4 balance = vec4(0.149, 0.796, 0.569, 1.0);

    vec4 c0, c1;
    if      (idx == 0) { c0 = arm;     c1 = legs;    }
    else if (idx == 1) { c0 = legs;    c1 = corex;   }
    else if (idx == 2) { c0 = corex;   c1 = balance; }
    else               { c0 = balance; c1 = arm;     }

    // Easing monotônico com derivada zero nas bordas
    // w = 0 -> c0 | w = 1 -> c1
    float w = 0.5 - 0.5 * cos(3.14159265 * fraq);
    // alternativa: float w = smoothstep(0.0, 1.0, fraq);

    vec4 mixColor = mix(c0, c1, w);
 
    vec2 vUV = UV0;

    // ====== Stripes com jitter mínimo ======
    const float stripes   = 12.0;          // densidade das stripes
    const float phase     = uTime / 240.0; // mesma fase usada antes
    const float gap       = 0.05;          // largura da fenda (threshold do step)
    const float jitterAmp = 0.25;          // amplitude do jitter em fração de ciclo (0.0–0.05 é “mínimo”)

    // coordenada base da stripe (igual à sua lógica original)
    float baseCoord = min(vUV.x, vUV.y) * stripes + phase;

    // deslocamento sutil por faixa (estável no tempo para cada faixa)
    float jitter = jitterAmp * stripe_jitter(baseCoord);

    // aplica o jitter na fase antes do fract
    float stripe = step(gap, fract(baseCoord + jitter));

    BASE_COLOR = mixColor * max(stripe, 0.4);

    // BASE_COLOR = mixColor;
    METALNESS = 0.8;
    SPECULAR_AMOUNT = 0.7;
    ROUGHNESS = 0.3;
}

