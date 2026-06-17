-- Seed: templates CFO — Anexos 5, 9 e 10
-- Fonte: CFO — Conselho Federal de Odontologia
-- Estes são formulários estáticos (sem placeholders dinâmicos).
-- Para versões com preenchimento automático de dados do paciente, substituir
-- por .docx via Configurações > Documentos > Substituir arquivo.

-- ─── ANEXO 5 — Registro de Imagens/Modelos/Enceramentos/Outros ───────────────
INSERT INTO contratos_templates (
  id, nome, tipo, categoria_documento, origem, versao, vigente, ativo,
  corpo_html, arquivo_tipo, arquivo_estatico
) VALUES (
  gen_random_uuid(),
  'Registro de Imagens/Modelos/Enceramentos/Outros',
  'consentimento',
  'tcle',
  'juridico',
  1, true, true,
  $$<div style="font-family: Arial, sans-serif; font-size: 10pt; color: #1a1a1a; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px;">

<p style="font-style: italic; color: #cc0000; margin-bottom: 24px;">
  Inserir identificação do estabelecimento de saúde (endereço, e se houver, CNPJ, CNES, telefone, logos, etc.)
</p>

<h2 style="text-align: center; text-decoration: underline; font-size: 13pt; margin-bottom: 28px; letter-spacing: 0.5px;">
  REGISTRO DE IMAGENS/MODELOS/ENCERAMENTOS/OUTROS
</h2>

<table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
  <thead>
    <tr>
      <th style="border: 1px solid #000; padding: 8px 10px; background: #f0f0f0; text-align: center; font-weight: bold; width: 15%;">Data</th>
      <th style="border: 1px solid #000; padding: 8px 10px; background: #f0f0f0; text-align: center; font-weight: bold; width: 25%;">Tipo de Registro</th>
      <th style="border: 1px solid #000; padding: 8px 10px; background: #f0f0f0; text-align: center; font-weight: bold; width: 35%;">Justificativa</th>
      <th style="border: 1px solid #000; padding: 8px 10px; background: #f0f0f0; text-align: center; font-weight: bold; width: 25%;">Local de Arquivo</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="border: 1px solid #000; height: 22px; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td></tr>
    <tr><td style="border: 1px solid #000; height: 22px; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td></tr>
    <tr><td style="border: 1px solid #000; height: 22px; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td></tr>
    <tr><td style="border: 1px solid #000; height: 22px; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td></tr>
    <tr><td style="border: 1px solid #000; height: 22px; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td></tr>
    <tr><td style="border: 1px solid #000; height: 22px; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td></tr>
    <tr><td style="border: 1px solid #000; height: 22px; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td></tr>
    <tr><td style="border: 1px solid #000; height: 22px; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td></tr>
    <tr><td style="border: 1px solid #000; height: 22px; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td></tr>
    <tr><td style="border: 1px solid #000; height: 22px; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td></tr>
    <tr><td style="border: 1px solid #000; height: 22px; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td></tr>
    <tr><td style="border: 1px solid #000; height: 22px; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td></tr>
    <tr><td style="border: 1px solid #000; height: 22px; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td></tr>
    <tr><td style="border: 1px solid #000; height: 22px; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td></tr>
    <tr><td style="border: 1px solid #000; height: 22px; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td></tr>
    <tr><td style="border: 1px solid #000; height: 22px; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td></tr>
    <tr><td style="border: 1px solid #000; height: 22px; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td></tr>
    <tr><td style="border: 1px solid #000; height: 22px; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td></tr>
    <tr><td style="border: 1px solid #000; height: 22px; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td></tr>
    <tr><td style="border: 1px solid #000; height: 22px; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td></tr>
    <tr><td style="border: 1px solid #000; height: 22px; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td></tr>
    <tr><td style="border: 1px solid #000; height: 22px; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td></tr>
    <tr><td style="border: 1px solid #000; height: 22px; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td></tr>
    <tr><td style="border: 1px solid #000; height: 22px; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td></tr>
    <tr><td style="border: 1px solid #000; height: 22px; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td></tr>
    <tr><td style="border: 1px solid #000; height: 22px; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td></tr>
    <tr><td style="border: 1px solid #000; height: 22px; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td></tr>
    <tr><td style="border: 1px solid #000; height: 22px; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td></tr>
    <tr><td style="border: 1px solid #000; height: 22px; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td></tr>
    <tr><td style="border: 1px solid #000; height: 22px; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000; padding: 4px;"></td></tr>
  </tbody>
</table>
</div>$$,
  'html', true
);


-- ─── ANEXO 9 (parte 1) — Recibo de Entrega de Documentos/Exames/Modelos ──────
INSERT INTO contratos_templates (
  id, nome, tipo, categoria_documento, origem, versao, vigente, ativo,
  corpo_html, arquivo_tipo, arquivo_estatico
) VALUES (
  gen_random_uuid(),
  'Recibo de Entrega de Documentos/Exames/Modelos',
  'consentimento',
  'tcle',
  'juridico',
  1, true, true,
  $$<div style="font-family: Arial, sans-serif; font-size: 10pt; color: #1a1a1a; line-height: 1.7; max-width: 800px; margin: 0 auto; padding: 20px;">

<p style="font-style: italic; color: #cc0000; margin-bottom: 24px;">
  Inserir identificação do estabelecimento de saúde (endereço, e se houver, CNPJ, CNES, telefone, logos, etc.)
</p>

<h2 style="text-align: center; text-decoration: underline; font-size: 13pt; margin-bottom: 8px;">
  RECIBOS DE ENTREGA DE DOCUMENTOS
</h2>

<h3 style="text-align: center; text-decoration: underline; font-size: 11pt; margin-bottom: 24px;">
  RECIBO DE ENTREGA DE DOCUMENTOS/EXAMES/MODELOS
</h3>

<p style="text-align: justify; margin-bottom: 16px;">
  Declaro ter recebido, na presente data, os documentos, exames e/ou modelo(s) abaixo elencados e marcados, manifestando ter recebido orientações, ter sido alertado e ter, portanto, ciência de que estes são importantes registros técnicos de minha condição de saúde, em diferentes períodos, estando, pois, consciente de que isto os torna fundamentais para que um Cirurgião-dentista possa estabelecer adequado diagnóstico, planejamento e/ou acompanhamento de meu caso clínico, no momento presente ou mesmo em análise ou uso futuro.
</p>

<p style="text-align: justify; margin-bottom: 24px;">
  Assim, ao recebê-los, ☐ em meio físico / ☐ em arquivo digital, assumo ser de minha inteira responsabilidade a guarda destes, em adequado acondicionamento e em segurança, confidencialidade e sigilo de acesso, isentando o profissional e/ou estabelecimento de saúde de qualquer responsabilidade para com os referidos documentos/itens ora entregues, para nada mais poder reclamar ou solicitar com relação aos mesmos.
</p>

<p style="margin-bottom: 6px;">1. ☐ Fotografias: <span style="border-bottom: 1px solid #000; display: inline-block; width: 350px;">&nbsp;</span></p>
<p style="color: #cc0000; font-size: 9pt; margin: 2px 0 10px 16px;">(especificar tipo/padrão, quantidade, data de tomada, meio de apresentação/entrega – impressa/digital – e outro dado relevante)</p>

<p style="margin-bottom: 6px;">2. ☐ Escaneamento: <span style="border-bottom: 1px solid #000; display: inline-block; width: 340px;">&nbsp;</span></p>
<p style="color: #cc0000; font-size: 9pt; margin: 2px 0 10px 16px;">(especificar dentes/arco/região, data de tomada ou outro dado relevante)</p>

<p style="margin-bottom: 6px;">3. ☐ Pasta Ortodôntica: <span style="border-bottom: 1px solid #000; display: inline-block; width: 330px;">&nbsp;</span></p>
<p style="color: #cc0000; font-size: 9pt; margin: 2px 0 10px 16px;">(especificar conteúdo, Clínica em que o exame foi realizado, data do exame, meio de apresentação/entrega – físico/digital – e outro dado relevante)</p>

<p style="margin-bottom: 6px;">4. ☐ Radiografia Periapical: <span style="border-bottom: 1px solid #000; display: inline-block; width: 315px;">&nbsp;</span></p>
<p style="color: #cc0000; font-size: 9pt; margin: 2px 0 10px 16px;">(especificar dente(s), número de radiografias, Clínica em que o exame foi realizado, data do exame, meio de apresentação/entrega – físico/digital – e outro dado relevante)</p>

<p style="margin-bottom: 6px;">5. ☐ Radiografia <em>Bitewing</em>/Interproximal: <span style="border-bottom: 1px solid #000; display: inline-block; width: 270px;">&nbsp;</span></p>
<p style="color: #cc0000; font-size: 9pt; margin: 2px 0 10px 16px;">(especificar dentes, número de radiografias, Clínica em que o exame foi realizado, data do exame, meio de apresentação/entrega – físico/digital – e outro dado relevante)</p>

<p style="margin-bottom: 6px;">6. ☐ Radiografia Panorâmica: <span style="border-bottom: 1px solid #000; display: inline-block; width: 315px;">&nbsp;</span></p>
<p style="color: #cc0000; font-size: 9pt; margin: 2px 0 10px 16px;">(especificar número de radiografias, Clínica em que o exame foi realizado, data do exame, meio de apresentação/entrega – físico/digital – e outro dado relevante)</p>

<p style="margin-bottom: 6px;">7. ☐ Radiografia Cefalométrica/Telerradiografia: <span style="border-bottom: 1px solid #000; display: inline-block; width: 240px;">&nbsp;</span></p>
<p style="color: #cc0000; font-size: 9pt; margin: 2px 0 10px 16px;">(especificar número de radiografias, Clínica em que o exame foi realizado, data do exame, meio de apresentação/entrega – físico/digital – e outro dado relevante)</p>

<p style="margin-bottom: 6px;">8. ☐ Radiografia Oclusal: <span style="border-bottom: 1px solid #000; display: inline-block; width: 330px;">&nbsp;</span></p>
<p style="color: #cc0000; font-size: 9pt; margin: 2px 0 10px 16px;">(especificar número de radiografias, Clínica em que o exame foi realizado, data do exame, meio de apresentação/entrega – físico/digital – e outro dado relevante)</p>

<p style="margin-bottom: 6px;">9. ☐ Tomografia Computadorizada: <span style="border-bottom: 1px solid #000; display: inline-block; width: 295px;">&nbsp;</span></p>
<p style="color: #cc0000; font-size: 9pt; margin: 2px 0 10px 16px;">(especificar região/cortes, Clínica em que o exame foi realizado, data do exame, meio de apresentação/entrega – físico/digital – e outro dado relevante)</p>

<p style="margin-bottom: 6px;">10. ☐ Ressonância Magnética: <span style="border-bottom: 1px solid #000; display: inline-block; width: 315px;">&nbsp;</span></p>
<p style="color: #cc0000; font-size: 9pt; margin: 2px 0 10px 16px;">(especificar região, Clínica em que o exame foi realizado, data do exame, meio de apresentação/entrega – físico/digital – e outro dado relevante)</p>

<p style="margin-bottom: 6px;">11. ☐ Sialografia: <span style="border-bottom: 1px solid #000; display: inline-block; width: 355px;">&nbsp;</span></p>
<p style="color: #cc0000; font-size: 9pt; margin: 2px 0 10px 16px;">(especificar região/glândula, Clínica em que o exame foi realizado, data do exame, meio de apresentação/entrega – físico/digital – e outro dado relevante)</p>

<p style="margin-bottom: 6px;">12. ☐ Modelo de gesso: <span style="border-bottom: 1px solid #000; display: inline-block; width: 330px;">&nbsp;</span></p>
<p style="color: #cc0000; font-size: 9pt; margin: 2px 0 10px 16px;">(especificar arco dental, Clínica em que o exame foi realizado, data do exame e outro dado relevante)</p>

<p style="margin-bottom: 6px;">13. ☐ Laudo(s) de Exame(s): <span style="border-bottom: 1px solid #000; display: inline-block; width: 315px;">&nbsp;</span></p>
<p style="color: #cc0000; font-size: 9pt; margin: 2px 0 10px 16px;">(especificar a que exame se refere, Clínica em que o laudo foi emitido e/ou profissional responsável, data do exame/laudo, meio de apresentação/entrega – físico/digital – e outro dado relevante)</p>

<p style="margin-bottom: 6px;">14. ☐ Outro(s): <span style="border-bottom: 1px solid #000; display: inline-block; width: 370px;">&nbsp;</span></p>
<p style="color: #cc0000; font-size: 9pt; margin: 2px 0 20px 16px;">(especificar)</p>

<p style="margin-bottom: 8px;">☐ Entrega em meio convencional/físico – Itens: <span style="border-bottom: 1px solid #000; display: inline-block; width: 260px;">&nbsp;</span></p>
<p style="margin-bottom: 8px;">☐ Entrega em arquivo digital por meio do dispositivo <span style="border-bottom: 1px solid #000; display: inline-block; width: 200px;">&nbsp;</span> – Itens: <span style="border-bottom: 1px solid #000; display: inline-block; width: 120px;">&nbsp;</span></p>
<p style="margin-bottom: 24px;">☐ Entrega em arquivo digital para o endereço eletrônico indicado pelo Paciente Solicitante – Itens, a saber: <span style="border-bottom: 1px solid #000; display: inline-block; width: 200px;">&nbsp;</span></p>

<p style="text-align: center; margin-top: 40px; margin-bottom: 8px;">Local e data</p>
<p style="text-align: center; margin-top: 32px;">_________________________________</p>
<p style="text-align: center; font-size: 9pt;">Assinatura do paciente</p>
</div>$$,
  'html', true
);


-- ─── ANEXO 9 (parte 2) — Recibo de Entrega de Cópia de Prontuário ────────────
INSERT INTO contratos_templates (
  id, nome, tipo, categoria_documento, origem, versao, vigente, ativo,
  corpo_html, arquivo_tipo, arquivo_estatico
) VALUES (
  gen_random_uuid(),
  'Recibo de Entrega de Cópia de Prontuário',
  'consentimento',
  'tcle',
  'juridico',
  1, true, true,
  $$<div style="font-family: Arial, sans-serif; font-size: 10pt; color: #1a1a1a; line-height: 1.7; max-width: 800px; margin: 0 auto; padding: 20px;">

<p style="font-style: italic; color: #cc0000; margin-bottom: 24px;">
  Inserir identificação do estabelecimento de saúde (endereço, e se houver, CNPJ, CNES, telefone, logos, etc.)
</p>

<h2 style="text-align: center; text-decoration: underline; font-size: 13pt; margin-bottom: 32px;">
  RECIBO DE ENTREGA DE CÓPIA DE PRONTUÁRIO
</h2>

<p style="text-align: justify; margin-bottom: 16px;">
  Recebi, na presente data, a cópia integral do meu Prontuário Odontológico referente ao tratamento com o profissional/Clínica <span style="border-bottom: 1px solid #000; display: inline-block; width: 240px;">&nbsp;</span>, contendo <span style="border-bottom: 1px solid #000; display: inline-block; width: 60px;">&nbsp;</span> folhas.
</p>

<p style="text-align: justify; margin-bottom: 16px;">
  Manifesto ter recebido orientações, ter sido alertado e ter, portanto, ciência de que os dados constantes do meu Prontuário Odontológico são importantes registros técnicos de minha condição de saúde, em diferentes períodos, estando, pois, consciente de que isto os torna fundamentais para que um Cirurgião-dentista possa estabelecer adequado diagnóstico, planejamento e/ou acompanhamento de meu caso clínico, no momento presente ou mesmo em análise ou uso futuro.
</p>

<p style="text-align: justify; margin-bottom: 24px;">
  Assim, ao recebê-lo, ☐ em meio físico / ☐ em arquivo digital, assumo ser de minha inteira responsabilidade a guarda deste, em adequada segurança, confidencialidade e sigilo de acesso, isentando o profissional e/ou estabelecimento de saúde de qualquer responsabilidade para com o referido documento ora entregue, seja relativo a avaria, a perda, ao extravio e/ou ao vazamento de informações, para nada mais poder reclamar ou solicitar com relação ao mesmo.
</p>

<p style="margin-bottom: 8px;">☐ Entrega em meio físico – N.º de Folhas: <span style="border-bottom: 1px solid #000; display: inline-block; width: 270px;">&nbsp;</span></p>
<p style="margin: 0 0 8px 16px;">Cópias: ☐ coloridas &nbsp;&nbsp; ☐ em preto e branco</p>
<p style="margin-bottom: 8px;">☐ Entrega em arquivo digital por meio do dispositivo – Itens: <span style="border-bottom: 1px solid #000; display: inline-block; width: 180px;">&nbsp;</span></p>
<p style="margin-bottom: 24px;">☐ Entrega em arquivo digital para o endereço eletrônico indicado pelo Paciente Solicitante – Itens, a saber: <span style="border-bottom: 1px solid #000; display: inline-block; width: 200px;">&nbsp;</span></p>

<p style="text-align: center; margin-top: 40px; margin-bottom: 8px;">Local e data</p>
<p style="text-align: center; margin-top: 32px;">_________________________________</p>
<p style="text-align: center; font-size: 9pt;">Assinatura do paciente</p>
</div>$$,
  'html', true
);


-- ─── ANEXO 10 (parte 1) — Autorização para Uso de Dados, Imagem e Voz ────────
INSERT INTO contratos_templates (
  id, nome, tipo, categoria_documento, origem, versao, vigente, ativo,
  corpo_html, arquivo_tipo, arquivo_estatico
) VALUES (
  gen_random_uuid(),
  'Autorização para Uso de Dados, Imagem e Voz',
  'lgpd',
  'tcle',
  'juridico',
  1, true, true,
  $$<div style="font-family: Arial, sans-serif; font-size: 10pt; color: #1a1a1a; line-height: 1.7; max-width: 800px; margin: 0 auto; padding: 20px;">

<p style="font-style: italic; color: #cc0000; margin-bottom: 24px;">
  Inserir identificação do estabelecimento de saúde (endereço, e se houver, CNPJ, CNES, telefone, logos, etc.)
</p>

<h2 style="text-align: center; text-decoration: underline; font-size: 13pt; margin-bottom: 32px;">
  AUTORIZAÇÃO PARA USO DE DADOS, IMAGEM E VOZ
</h2>

<p style="margin-bottom: 10px;">
  Eu, <span style="border-bottom: 1px solid #000; display: inline-block; width: 320px;">&nbsp;</span>
</p>
<p style="color: #cc0000; font-size: 9pt; margin: 0 0 10px 0;">(nome completo)</p>

<p style="margin-bottom: 10px;">
  brasileiro(a), <span style="border-bottom: 1px solid #000; display: inline-block; width: 180px;">&nbsp;</span> (estado civil), RG de n.º <span style="border-bottom: 1px solid #000; display: inline-block; width: 140px;">&nbsp;</span> - Órgão Expedidor <span style="border-bottom: 1px solid #000; display: inline-block; width: 100px;">&nbsp;</span>, CPF/MF de n.º <span style="border-bottom: 1px solid #000; display: inline-block; width: 160px;">&nbsp;</span>,
</p>

<p style="margin-bottom: 6px;">residente e domiciliado(a) na</p>
<p style="margin-bottom: 6px;"><span style="border-bottom: 1px solid #000; display: block; width: 100%;">&nbsp;</span></p>
<p style="margin-bottom: 20px;"><span style="border-bottom: 1px solid #000; display: block; width: 100%;">&nbsp;</span></p>

<p style="text-align: justify; margin-bottom: 16px;">
  venho, por meio deste termo, espontânea e livremente, <strong>AUTORIZAR</strong> o uso de dados do meu Prontuário Odontológico, de minhas imagens, áudios, vídeos, relativos ao tratamento odontológico a que me submeto com o Cirurgião-dentista/Clínica <span style="border-bottom: 1px solid #000; display: inline-block; width: 240px;">&nbsp;</span>, para fins diversos de divulgações de assuntos odontológicos, em específico,
</p>
<p style="margin-bottom: 4px;"><span style="border-bottom: 1px solid #000; display: block; width: 100%;">&nbsp;</span></p>
<p style="color: #cc0000; font-size: 9pt; margin: 0 0 16px 0;">(especificar os meios em que haverá a divulgação/publicação dos dados/do caso clínico)</p>

<p style="text-align: justify; margin-bottom: 16px;">
  abdicando de qualquer direito ou remuneração pelo uso destes registros, tendo a mim sido garantido que o profissional/estabelecimento sempre observará os preceitos éticos e legais vigentes, relativos à Odontologia e previstos em legislação aplicável.
</p>

<p style="text-align: justify; margin-bottom: 16px;">
  Fica o profissional/Clínica acima registrado, entretanto, obrigado a não mais usar os dados e, sendo aplicável e possível, a remover eventuais publicações neste ato autorizadas, se vier eu, a qualquer tempo, a usar da prerrogativa de revogação desta autorização.
</p>

<p style="text-align: justify; margin-bottom: 32px;">
  Em manifestação autônoma de consentimento, de forma livre e esclarecida, firmo o presente, na forma da Lei 13.709, de 14 agosto de 2018 (Lei Geral de Proteção de Dados).
</p>

<p style="text-align: center; margin-top: 40px; margin-bottom: 8px;">Local e data.</p>
<p style="text-align: center; margin-top: 32px;">_________________________________</p>
<p style="text-align: center; font-size: 9pt;">Assinatura do Paciente</p>
</div>$$,
  'html', true
);


-- ─── ANEXO 10 (parte 2) — Autorização para Uso de Dados, Imagem e Voz — Menor
INSERT INTO contratos_templates (
  id, nome, tipo, categoria_documento, origem, versao, vigente, ativo,
  corpo_html, arquivo_tipo, arquivo_estatico
) VALUES (
  gen_random_uuid(),
  'Autorização para Uso de Dados, Imagem e Voz (Paciente Menor)',
  'lgpd',
  'tcle',
  'juridico',
  1, true, true,
  $$<div style="font-family: Arial, sans-serif; font-size: 10pt; color: #1a1a1a; line-height: 1.7; max-width: 800px; margin: 0 auto; padding: 20px;">

<p style="font-style: italic; color: #cc0000; margin-bottom: 24px;">
  Inserir identificação do estabelecimento de saúde (endereço, e se houver, CNPJ, CNES, telefone, logos, etc.)
</p>

<h2 style="text-align: center; text-decoration: underline; font-size: 13pt; margin-bottom: 4px;">
  AUTORIZAÇÃO PARA USO DE DADOS, IMAGEM E VOZ
</h2>
<h3 style="text-align: center; text-decoration: underline; font-size: 11pt; margin-bottom: 32px;">
  (PACIENTE MENOR)
</h3>

<p style="margin-bottom: 10px;">
  Eu, <span style="border-bottom: 1px solid #000; display: inline-block; width: 320px;">&nbsp;</span>
</p>
<p style="color: #cc0000; font-size: 9pt; margin: 0 0 10px 0;">(nome completo)</p>

<p style="margin-bottom: 10px;">
  brasileiro(a), <span style="border-bottom: 1px solid #000; display: inline-block; width: 180px;">&nbsp;</span> (estado civil), RG de n.º <span style="border-bottom: 1px solid #000; display: inline-block; width: 140px;">&nbsp;</span> - Órgão Expedidor <span style="border-bottom: 1px solid #000; display: inline-block; width: 100px;">&nbsp;</span>, CPF/MF de n.º <span style="border-bottom: 1px solid #000; display: inline-block; width: 160px;">&nbsp;</span>,
</p>

<p style="margin-bottom: 6px;">residente e domiciliado(a) na</p>
<p style="margin-bottom: 6px;"><span style="border-bottom: 1px solid #000; display: block; width: 100%;">&nbsp;</span></p>
<p style="margin-bottom: 16px;"><span style="border-bottom: 1px solid #000; display: block; width: 100%;">&nbsp;</span></p>

<p style="margin-bottom: 10px;"><strong>RESPONSÁVEL LEGAL</strong> pelo(a) paciente menor</p>
<p style="margin-bottom: 4px;"><span style="border-bottom: 1px solid #000; display: block; width: 100%;">&nbsp;</span></p>
<p style="color: #cc0000; font-size: 9pt; margin: 0 0 10px 0;">(nome completo)</p>
<p style="margin-bottom: 16px;">
  RG de n.º <span style="border-bottom: 1px solid #000; display: inline-block; width: 160px;">&nbsp;</span> - Órgão Expedidor <span style="border-bottom: 1px solid #000; display: inline-block; width: 100px;">&nbsp;</span>, CPF/MF de n.º <span style="border-bottom: 1px solid #000; display: inline-block; width: 160px;">&nbsp;</span>,
</p>

<p style="text-align: justify; margin-bottom: 16px;">
  venho, por meio deste termo, espontânea e livremente, <strong>AUTORIZAR</strong> o uso de dados do Prontuário Odontológico do menor acima qualificado, bem como de suas imagens, áudios, vídeos, relativos ao tratamento odontológico a que se submete com o Cirurgião-dentista/Clínica <span style="border-bottom: 1px solid #000; display: inline-block; width: 220px;">&nbsp;</span>, para fins diversos de divulgações de assuntos odontológicos, em específico,
</p>
<p style="margin-bottom: 4px;"><span style="border-bottom: 1px solid #000; display: block; width: 100%;">&nbsp;</span></p>
<p style="color: #cc0000; font-size: 9pt; margin: 0 0 16px 0;">(especificar os meios em que haverá a divulgação/publicação dos dados/do caso clínico)</p>

<p style="text-align: justify; margin-bottom: 16px;">
  abdicando de qualquer direito ou remuneração pelo uso destes registros, tendo a mim sido garantido que o profissional/estabelecimento sempre observará os preceitos éticos e legais vigentes, relativos à Odontologia e previstos em legislação aplicável.
</p>

<p style="text-align: justify; margin-bottom: 16px;">
  Fica o profissional/Clínica acima registrado, entretanto, obrigado a não mais usar os dados e, sendo aplicável e possível, a remover eventuais publicações neste ato autorizadas, se vier eu, como Responsável Legal, a qualquer tempo, a usar da prerrogativa de revogação desta autorização.
</p>

<p style="text-align: justify; margin-bottom: 32px;">
  Em manifestação autônoma de consentimento, de forma livre e esclarecida, firmo o presente, na forma da Lei 13.709, de 14 agosto de 2018 (Lei Geral de Proteção de Dados).
</p>

<p style="text-align: center; margin-top: 40px; margin-bottom: 8px;">Local e data.</p>
<p style="text-align: center; margin-top: 32px;">_________________________________</p>
<p style="text-align: center; font-size: 9pt;">Assinatura do Paciente</p>
</div>$$,
  'html', true
);
