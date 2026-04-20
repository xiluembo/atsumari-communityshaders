VARYING vec3 pos;
VARYING vec2 vPhaseData;

void MAIN()
{
    vec3 p = VERTEX;       // posição original da malha
    float r = length(p);   // raio original

    // normal aproximada (esfera centrada na origem)
    vec3 n = normalize(p);

    // coordenadas esféricas
    float theta = atan(p.z, p.x);               // [-pi, pi]   -> ângulo em torno do eixo Y
    float phi   = acos(clamp(n.y, -1.0, 1.0)); // [0, pi]     -> 0 topo, pi fundo

    // ===== deformação "casulo psíquico" =====
    // equator ~1 no equador, ~0 nos polos
    float equator = sin(phi);

    // ondas radiais girando em torno do eixo Y
    // ANTES: sin(theta * 6.0 + uTime * 0.8);
    float swirl = sin(theta * 6.0 + uTime * 0.4);   // ~4x mais lento

    // pulso lento no raio (respiração psíquica)
    // ANTES: sin(uTime * 0.25);
    float breathe = sin(uTime * 0.12);              // bem mais suave (~80s por ciclo)

    // amplitude combinada: mais forte no equador, mais fraca nos polos
    float amp = 0.08 * equator;        // ~8% do raio ao máximo
    float radialOffset = amp * swirl * (0.6 + 0.4 * breathe);

    float newR = r * (1.0 + radialOffset);

    vec3 deformed = normalize(p) * newR;

    pos = deformed;

    // ===== fase para o fragment shader =====
    // vPhaseData.x: posição angular normalizada [0,1]
    float theta01 = (theta / 6.28318530718) + 0.5;

    // vPhaseData.y: banda “psíquica” que gira em torno do eixo Y
    float phaseY = n.y + 0.25 * sin(theta * 4.0 + uTime * 0.5);
    vPhaseData = vec2(theta01, phaseY);

    const float RADIUS_PUSH = 1.12;
    POSITION = MODELVIEWPROJECTION_MATRIX * vec4(deformed, RADIUS_PUSH);
}
