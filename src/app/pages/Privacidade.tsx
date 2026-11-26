import LegalLayout from '../components/legal/LegalLayout';

const C = {
  dark: '#0A3D1F',
  lime: '#A8C800',
  white: '#FFFFFF',
  text: '#1a1a1a',
  muted: '#6b7280',
};

export default function Privacidade() {
  return (
    <LegalLayout
      tipo="privacidade"
      titulo="Política de Privacidade"
      resumo="Como a AMBISAFE coleta, usa, guarda e protege os seus dados pessoais."
      etiquetas={['Vigência: 17 de abril de 2025', 'CNPJ 60.395.913/0001-86', 'Conforme LGPD (Lei 13.709/2018)']}
    >

            {/* 1 */}
            <section>
              <h2>
                1. Identificação do Controlador
              </h2>
              <p>
                Esta Política de Privacidade descreve como a <strong>AMBISAFE</strong> coleta,
                utiliza, armazena e protege os dados pessoais dos usuários de sua Plataforma,
                em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018).
              </p>
              <div className="mt-4 p-5 rounded-xl border border-gray-200 bg-gray-50 space-y-2 text-sm">
                <p><strong>Controlador de Dados:</strong> ALISSON MONTEIRO MEDEIROS</p>
                <p><strong>Nome Fantasia:</strong> AMBISAFE Consultoria e Assessoria Ambiental</p>
                <p><strong>CNPJ:</strong> 60.395.913/0001-86</p>
                <p><strong>Endereço:</strong> R. Pastor Eduardo Mundy, 572 — Santo Antônio, Patos/PB — CEP 58.701-160</p>
                <p>
                  <strong>E-mail do DPO / Encarregado:</strong>{' '}
                  <a href="mailto:assessoria.ambisafe@gmail.com" className="underline" style={{ color: C.dark }}>
                    assessoria.ambisafe@gmail.com
                  </a>
                </p>
              </div>
            </section>

            {/* 2 */}
            <section>
              <h2>
                2. Dados Coletados
              </h2>
              <p>A AMBISAFE coleta as seguintes categorias de dados pessoais:</p>

              <h3>
                2.1 Dados de Cadastro
              </h3>
              <ul className="list-disc ml-6 space-y-1">
                <li>Nome completo;</li>
                <li>Endereço de e-mail;</li>
                <li>Nome da empresa ou organização;</li>
                <li>Número de registro profissional (CRT/CREA), quando informado;</li>
                <li>CNPJ da empresa (opcional).</li>
              </ul>

              <h3>
                2.2 Dados de Uso da Plataforma
              </h3>
              <ul className="list-disc ml-6 space-y-1">
                <li>Projetos de inventário florestal criados;</li>
                <li>Dados de parcelas, espécies e medições inseridos pelo usuário;</li>
                <li>Relatórios gerados;</li>
                <li>Configurações e preferências da conta.</li>
              </ul>

              <h3>
                2.3 Dados Técnicos de Acesso
              </h3>
              <ul className="list-disc ml-6 space-y-1">
                <li>Endereço IP de acesso;</li>
                <li>Tipo de navegador e sistema operacional;</li>
                <li>Logs de acesso e ações realizadas na Plataforma;</li>
                <li>Data e hora de acesso.</li>
              </ul>
            </section>

            {/* 3 */}
            <section>
              <h2>
                3. Finalidade do Tratamento
              </h2>
              <p>Os dados coletados são utilizados exclusivamente para as seguintes finalidades:</p>
              <ul className="list-disc ml-6 mt-3 space-y-1">
                <li>Prestação do serviço de inventário florestal contratado;</li>
                <li>Criação e gerenciamento da conta do usuário;</li>
                <li>Geração de relatórios e documentos técnicos;</li>
                <li>Envio de comunicações relacionadas ao serviço (atualizações, notificações técnicas);</li>
                <li>Cobrança e gestão financeira dos planos contratados;</li>
                <li>Cumprimento de obrigações legais e regulatórias;</li>
                <li>Melhoria contínua da Plataforma com base em dados agregados e anonimizados;</li>
                <li>Segurança da informação e prevenção de fraudes.</li>
              </ul>
            </section>

            {/* 4 */}
            <section>
              <h2>
                4. Base Legal para o Tratamento (LGPD)
              </h2>
              <p>O tratamento de dados pessoais pela AMBISAFE fundamenta-se nas seguintes hipóteses legais previstas no Art. 7º da LGPD:</p>
              <div className="mt-3 space-y-3">
                <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                  <p className="font-semibold text-sm" style={{ color: C.dark }}>Execução de contrato — Art. 7º, V</p>
                  <p className="text-sm mt-1">Tratamento necessário para a prestação do serviço de inventário florestal contratado pelo usuário.</p>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                  <p className="font-semibold text-sm" style={{ color: C.dark }}>Legítimo interesse — Art. 7º, IX</p>
                  <p className="text-sm mt-1">Utilizado para melhoria da Plataforma, segurança e prevenção de fraudes, sempre de forma proporcional e respeitando os direitos do titular.</p>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                  <p className="font-semibold text-sm" style={{ color: C.dark }}>Cumprimento de obrigação legal — Art. 7º, II</p>
                  <p className="text-sm mt-1">Retenção de logs de acesso conforme o Marco Civil da Internet (Lei 12.965/2014) e demais obrigações legais aplicáveis.</p>
                </div>
              </div>
            </section>

            {/* 5 */}
            <section>
              <h2>
                5. Compartilhamento de Dados
              </h2>
              <p>
                A AMBISAFE <strong>não vende, aluga ou cede dados pessoais a terceiros</strong> para
                fins comerciais ou de marketing.
              </p>
              <p className="mt-3">
                Os dados poderão ser compartilhados exclusivamente com os seguintes fornecedores
                de infraestrutura tecnológica, necessários para a prestação do serviço:
              </p>
              <ul className="list-disc ml-6 mt-3 space-y-1">
                <li>
                  <strong>Supabase Inc.</strong> — banco de dados e autenticação (servidores AWS,
                  região us-east-1). Dados protegidos por criptografia e acesso restrito;
                </li>
                <li>
                  <strong>Serviços de e-mail transacional</strong> — para envio de notificações
                  operacionais e recuperação de senha;
                </li>
                <li>
                  <strong>Vercel Inc.</strong> — hospedagem da aplicação web (CDN global).
                </li>
              </ul>
              <p className="mt-3">
                Todos os fornecedores listados operam com políticas de privacidade compatíveis
                com a LGPD e o GDPR europeu, garantindo nível adequado de proteção aos dados
                transferidos.
              </p>
              <p className="mt-3">
                Os dados também poderão ser divulgados quando exigido por determinação judicial
                ou autoridade competente.
              </p>
            </section>

            {/* 6 */}
            <section>
              <h2>
                6. Armazenamento e Segurança
              </h2>
              <p>Os dados pessoais são armazenados em servidores seguros gerenciados pela Supabase/AWS, com as seguintes medidas de segurança:</p>
              <ul className="list-disc ml-6 mt-3 space-y-1">
                <li>Criptografia de dados em trânsito (TLS 1.2/1.3);</li>
                <li>Criptografia de dados em repouso (AES-256);</li>
                <li>Controle de acesso por Row-Level Security (RLS) no banco de dados;</li>
                <li>Autenticação com tokens JWT de curta duração;</li>
                <li>Acesso restrito a dados pessoais por pessoal autorizado da AMBISAFE;</li>
                <li>Backups automáticos com retenção definida por política de segurança.</li>
              </ul>
              <p className="mt-3">
                Em caso de incidente de segurança que possa afetar seus dados, a AMBISAFE
                notificará os titulares afetados e a Autoridade Nacional de Proteção de Dados
                (ANPD) dentro dos prazos legais estabelecidos.
              </p>
            </section>

            {/* 7 */}
            <section>
              <h2>
                7. Direitos do Titular dos Dados
              </h2>
              <p>
                Nos termos da LGPD (Art. 18), o titular dos dados pessoais tem os seguintes
                direitos, que podem ser exercidos a qualquer momento:
              </p>
              <ul className="list-disc ml-6 mt-3 space-y-1">
                <li><strong>Acesso:</strong> confirmar a existência e obter cópia dos dados tratados;</li>
                <li><strong>Correção:</strong> solicitar a atualização de dados incompletos, inexatos ou desatualizados;</li>
                <li><strong>Anonimização ou eliminação:</strong> solicitar a anonimização ou exclusão de dados desnecessários;</li>
                <li><strong>Portabilidade:</strong> receber seus dados em formato estruturado e interoperável;</li>
                <li><strong>Informação sobre compartilhamento:</strong> ser informado sobre com quem seus dados são compartilhados;</li>
                <li><strong>Revogação do consentimento:</strong> revogar consentimentos dados, quando aplicável;</li>
                <li><strong>Oposição:</strong> opor-se a tratamentos realizados com base em legítimo interesse.</li>
              </ul>
              <p className="mt-3">
                Para exercer qualquer um desses direitos, envie sua solicitação para:{' '}
                <a href="mailto:assessoria.ambisafe@gmail.com" className="underline" style={{ color: C.dark }}>
                  assessoria.ambisafe@gmail.com
                </a>
              </p>
              <p className="mt-2">
                O prazo de resposta é de até <strong>15 (quinze) dias úteis</strong> a contar
                do recebimento da solicitação.
              </p>
            </section>

            {/* 8 */}
            <section>
              <h2>
                8. Retenção de Dados
              </h2>
              <p>Os dados pessoais são mantidos pelos seguintes períodos:</p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm border-collapse border border-gray-200 rounded-lg overflow-hidden">
                  <thead>
                    <tr style={{ backgroundColor: C.dark, color: C.white }}>
                      <th className="text-left px-4 py-3">Categoria de Dado</th>
                      <th className="text-left px-4 py-3">Prazo de Retenção</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200 bg-white">
                      <td className="px-4 py-3">Dados de conta e projetos</td>
                      <td className="px-4 py-3">Vigência do contrato + 5 anos</td>
                    </tr>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <td className="px-4 py-3">Logs de acesso</td>
                      <td className="px-4 py-3">6 meses (Marco Civil da Internet)</td>
                    </tr>
                    <tr className="border-b border-gray-200 bg-white">
                      <td className="px-4 py-3">Registros financeiros</td>
                      <td className="px-4 py-3">5 anos (legislação tributária)</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3">Dados de suporte e comunicações</td>
                      <td className="px-4 py-3">2 anos após encerramento</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3">
                Após o término dos prazos, os dados são eliminados de forma segura ou
                anonimizados para fins estatísticos.
              </p>
            </section>

            {/* 9 */}
            <section>
              <h2>
                9. Cookies e Tecnologias de Rastreamento
              </h2>
              <p>
                A Plataforma AMBISAFE utiliza <strong>apenas cookies essenciais</strong> para
                o funcionamento da sessão autenticada do usuário. Não utilizamos:
              </p>
              <ul className="list-disc ml-6 mt-3 space-y-1">
                <li>Cookies de rastreamento ou publicidade comportamental;</li>
                <li>Pixels de rastreamento de terceiros;</li>
                <li>Ferramentas de análise que identifiquem individualmente os usuários;</li>
                <li>Redes de publicidade.</li>
              </ul>
              <p className="mt-3">
                Os cookies essenciais utilizados são necessários para manter a sessão ativa e
                garantir a segurança do acesso. Sem eles, a Plataforma não funciona corretamente.
                O usuário pode configurar seu navegador para bloquear cookies, mas isso impedirá
                o uso da Plataforma.
              </p>
            </section>

            {/* 10 */}
            <section>
              <h2>
                10. Alterações desta Política
              </h2>
              <p>
                Esta Política de Privacidade pode ser atualizada periodicamente para refletir
                mudanças nas práticas de tratamento de dados, na legislação aplicável ou nas
                funcionalidades da Plataforma.
              </p>
              <p className="mt-3">
                Em caso de alterações relevantes que afetem os direitos dos titulares, os
                usuários serão notificados por <strong>e-mail</strong> com antecedência mínima
                de 15 (quinze) dias antes da entrada em vigor das mudanças.
              </p>
              <p className="mt-3">
                A versão atualizada será publicada nesta página com indicação da nova data de
                vigência. O uso continuado da Plataforma após as alterações constitui aceite
                das novas condições.
              </p>
            </section>

            {/* 11 */}
            <section>
              <h2>
                11. Contato e Encarregado de Proteção de Dados (DPO)
              </h2>
              <p>
                Para exercer seus direitos, esclarecer dúvidas ou registrar reclamações
                relacionadas ao tratamento de seus dados pessoais:
              </p>
              <div className="mt-4 p-5 rounded-xl border border-gray-200 bg-gray-50 space-y-2 text-sm">
                <p><strong>Encarregado (DPO):</strong> Alisson Monteiro Medeiros</p>
                <p>
                  <strong>E-mail:</strong>{' '}
                  <a href="mailto:assessoria.ambisafe@gmail.com" className="underline" style={{ color: C.dark }}>
                    assessoria.ambisafe@gmail.com
                  </a>
                </p>
                <p><strong>Endereço:</strong> R. Pastor Eduardo Mundy, 572 — Santo Antônio, Patos/PB — CEP 58.701-160</p>
                <p>
                  <strong>Telefone:</strong>{' '}
                  <a href="tel:+5583996028738" className="underline" style={{ color: C.dark }}>
                    (83) 9602-8738
                  </a>
                </p>
              </div>
              <p className="mt-4">
                Caso não esteja satisfeito com a resposta da AMBISAFE, você poderá contatar a
                Autoridade Nacional de Proteção de Dados (ANPD) pelo site{' '}
                <strong>gov.br/anpd</strong>.
              </p>
            </section>

            {/* 12 */}
            <section>
              <h2>
                12. Vigência
              </h2>
              <p>
                Esta Política de Privacidade entra em vigor em <strong>17 de abril de 2025</strong>{' '}
                e substitui quaisquer versões anteriores.
              </p>
            </section>

    </LegalLayout>
  );
}
