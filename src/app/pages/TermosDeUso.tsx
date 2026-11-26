import { Link } from 'react-router';
import LegalLayout from '../components/legal/LegalLayout';

const C = {
  dark: '#0A3D1F',
  lime: '#A8C800',
  white: '#FFFFFF',
  text: '#1a1a1a',
  muted: '#6b7280',
};

export default function TermosDeUso() {
  return (
    <LegalLayout
      tipo="termos"
      titulo="Termos de Uso"
      resumo="As regras para usar a plataforma AMBISAFE: direitos, deveres, planos e responsabilidades."
      etiquetas={['Vigência: 17 de abril de 2025', 'CNPJ 60.395.913/0001-86']}
    >

            {/* 1 */}
            <section>
              <h2>
                1. Aceitação dos Termos
              </h2>
              <p>
                Ao acessar ou utilizar a plataforma AMBISAFE (doravante &ldquo;Plataforma&rdquo;), disponível
                em <strong>meuambisafe.com.br</strong>, o usuário declara ter lido, compreendido e
                aceito integralmente os presentes Termos de Uso, bem como nossa{' '}
                <Link to="/privacidade" className="underline" style={{ color: C.dark }}>
                  Política de Privacidade
                </Link>.
              </p>
              <p className="mt-3">
                Caso não concorde com qualquer disposição destes Termos, o usuário deverá
                cessar imediatamente o uso da Plataforma. O uso continuado após alterações
                publicadas constitui aceitação tácita das novas condições.
              </p>
              <p className="mt-3">
                A utilização da Plataforma é permitida exclusivamente para fins lícitos,
                relacionados à realização de inventários florestais, gestão ambiental e
                cumprimento de obrigações previstas na legislação ambiental brasileira.
              </p>
            </section>

            {/* 2 */}
            <section>
              <h2>
                2. Descrição do Serviço
              </h2>
              <p>
                A AMBISAFE é um software SaaS (Software como Serviço) voltado ao cálculo e
                gestão de inventários florestais. A Plataforma oferece as seguintes
                funcionalidades principais:
              </p>
              <ul className="list-disc ml-6 mt-3 space-y-1">
                <li>Cadastro e gerenciamento de projetos de inventário florestal;</li>
                <li>Importação e organização de dados de parcelas e medições de campo;</li>
                <li>Cálculos estatísticos (intensidade amostral, erro de amostragem, volume, área basal);</li>
                <li>Análise fitossociológica e de diversidade florística;</li>
                <li>Geração de relatórios técnicos em formato PDF;</li>
                <li>Banco de espécies florestais com informações técnicas.</li>
              </ul>
              <p className="mt-3">
                A Plataforma é disponibilizada mediante planos de acesso, incluindo um período
                de avaliação gratuita (Trial) e planos pagos com funcionalidades ampliadas,
                conforme tabela vigente disponível no site.
              </p>
            </section>

            {/* 3 */}
            <section>
              <h2>
                3. Cadastro e Responsabilidade da Conta
              </h2>
              <p>
                Para utilizar a Plataforma, o usuário deverá criar uma conta fornecendo
                informações verdadeiras, completas e atualizadas. O usuário é integralmente
                responsável pela veracidade dos dados cadastrados, bem como por quaisquer
                consequências decorrentes de informações falsas ou incorretas.
              </p>
              <p className="mt-3">
                As credenciais de acesso (e-mail e senha) são de uso pessoal e intransferível.
                É expressamente <strong>proibido compartilhar credenciais de acesso</strong> com
                terceiros. O usuário é responsável por todas as ações realizadas em sua conta,
                incluindo aquelas praticadas por terceiros em decorrência de negligência na
                guarda das credenciais.
              </p>
              <p className="mt-3">
                Em caso de suspeita de acesso não autorizado, o usuário deverá comunicar
                imediatamente a AMBISAFE pelo e-mail{' '}
                <a href="mailto:assessoria.ambisafe@gmail.com" className="underline" style={{ color: C.dark }}>
                  assessoria.ambisafe@gmail.com
                </a>.
              </p>
              <p className="mt-3">
                A AMBISAFE reserva-se o direito de suspender ou encerrar contas que violem
                estes Termos, sem aviso prévio, quando o uso indevido for evidente e
                potencialmente prejudicial à Plataforma ou a terceiros.
              </p>
            </section>

            {/* 4 */}
            <section>
              <h2>
                4. Propriedade Intelectual
              </h2>
              <p>
                Todo o conteúdo da Plataforma AMBISAFE, incluindo, mas não se limitando a:
                software, código-fonte, algoritmos de cálculo, interfaces, logotipos, textos,
                metodologias e relatórios gerados automaticamente, são de propriedade exclusiva
                de <strong>ALISSON MONTEIRO MEDEIROS</strong> (CNPJ 60.395.913/0001-86), sendo
                protegidos pela legislação brasileira de propriedade intelectual (Lei 9.279/1996
                e Lei 9.610/1998).
              </p>
              <p className="mt-3">
                O usuário recebe uma licença de uso limitada, não exclusiva, não sublicenciável
                e intransferível, válida pelo período de vigência do plano contratado, para
                acessar e utilizar as funcionalidades da Plataforma exclusivamente para seus
                fins internos.
              </p>
              <p className="mt-3">
                É expressamente <strong>proibido</strong>:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Realizar engenharia reversa, descompilar ou decompilar o software;</li>
                <li>Copiar, reproduzir ou redistribuir qualquer parte da Plataforma;</li>
                <li>Utilizar os algoritmos ou metodologias em outros sistemas;</li>
                <li>Remover avisos de direitos autorais ou propriedade intelectual;</li>
                <li>Criar obras derivadas baseadas na Plataforma sem autorização expressa.</li>
              </ul>
            </section>

            {/* 5 */}
            <section>
              <h2>
                5. Limitação de Responsabilidade
              </h2>
              <p>
                A AMBISAFE emprega boas práticas de desenvolvimento e segurança para garantir
                o correto funcionamento da Plataforma. Entretanto, a empresa <strong>não se
                responsabiliza</strong> por:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Erros, imprecisões ou omissões nos dados inseridos pelo usuário;</li>
                <li>Resultados incorretos decorrentes de medições de campo inadequadas;</li>
                <li>Decisões técnicas, administrativas ou legais tomadas com base nos relatórios gerados;</li>
                <li>Indisponibilidades ocasionais do serviço por fatores externos (falhas de internet, servidores de terceiros);</li>
                <li>Perda de dados causada por ação do próprio usuário.</li>
              </ul>
              <p className="mt-3">
                Os relatórios e documentos técnicos gerados pela Plataforma são ferramentas de
                auxílio ao trabalho do profissional habilitado. A responsabilidade técnica pelo
                conteúdo dos relatórios emitidos é do <strong>engenheiro florestal ou
                profissional habilitado signatário</strong>, nos termos da legislação
                profissional aplicável (Lei 4.771/1965 e normativas do CFBIO/CREA).
              </p>
            </section>

            {/* 6 */}
            <section>
              <h2>
                6. Pagamentos e Cancelamento
              </h2>
              <p>
                Os planos pagos são cobrados conforme a periodicidade contratada (mensal ou
                anual), mediante os métodos de pagamento disponibilizados na Plataforma. Os
                preços vigentes são os publicados no site no momento da contratação.
              </p>
              <p className="mt-3">
                O usuário poderá cancelar seu plano a qualquer momento, sem multa rescisória.
                O cancelamento entrará em vigor no término do período já pago, mantendo-se o
                acesso às funcionalidades até o vencimento.
              </p>
              <p className="mt-3">
                <strong>Não são realizados reembolsos</strong> por períodos já iniciados e
                utilizados, exceto nos casos previstos no Código de Defesa do Consumidor
                (Lei 8.078/1990), em especial o direito de arrependimento de 7 (sete) dias a
                contar da contratação para serviços adquiridos remotamente.
              </p>
              <p className="mt-3">
                Em caso de inadimplência, o acesso à Plataforma poderá ser suspenso após
                notificação, sendo restabelecido mediante regularização do pagamento.
              </p>
            </section>

            {/* 7 */}
            <section>
              <h2>
                7. Suspensão e Encerramento do Serviço
              </h2>
              <p>
                A AMBISAFE poderá suspender temporariamente o acesso à Plataforma para
                realização de manutenções programadas, atualizações ou melhorias, mediante
                aviso prévio de pelo menos 24 (vinte e quatro) horas, quando possível.
              </p>
              <p className="mt-3">
                Contas que permaneçam inativas por período superior a <strong>12 (doze)
                meses</strong>, sem acesso registrado e sem plano ativo, poderão ser
                excluídas definitivamente, após notificação por e-mail com antecedência
                mínima de 30 (trinta) dias.
              </p>
              <p className="mt-3">
                O encerramento da conta implica a exclusão dos dados associados, salvo
                obrigações legais de retenção previstas na legislação aplicável.
              </p>
            </section>

            {/* 8 */}
            <section>
              <h2>
                8. Legislação Aplicável e Foro
              </h2>
              <p>
                Estes Termos de Uso são regidos e interpretados de acordo com a legislação
                brasileira, incluindo, sem limitação:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Lei Geral de Proteção de Dados — LGPD (Lei 13.709/2018);</li>
                <li>Marco Civil da Internet (Lei 12.965/2014);</li>
                <li>Código de Defesa do Consumidor (Lei 8.078/1990);</li>
                <li>Código Civil Brasileiro (Lei 10.406/2002).</li>
              </ul>
              <p className="mt-3">
                Fica eleito o foro da <strong>Comarca de Patos, Estado da Paraíba</strong>,
                com exclusão de qualquer outro, por mais privilegiado que seja, para dirimir
                quaisquer questões oriundas destes Termos de Uso.
              </p>
            </section>

            {/* 9 */}
            <section>
              <h2>
                9. Contato
              </h2>
              <p>
                Para dúvidas, solicitações ou comunicações relacionadas a estes Termos de Uso,
                entre em contato com a AMBISAFE:
              </p>
              <div className="mt-4 p-5 rounded-xl border border-gray-200 bg-gray-50 space-y-2 text-sm">
                <p><strong>Razão Social:</strong> ALISSON MONTEIRO MEDEIROS</p>
                <p><strong>Nome Fantasia:</strong> AMBISAFE Consultoria e Assessoria Ambiental</p>
                <p><strong>CNPJ:</strong> 60.395.913/0001-86</p>
                <p><strong>Endereço:</strong> R. Pastor Eduardo Mundy, 572 — Santo Antônio, Patos/PB — CEP 58.701-160</p>
                <p>
                  <strong>E-mail:</strong>{' '}
                  <a href="mailto:assessoria.ambisafe@gmail.com" className="underline" style={{ color: C.dark }}>
                    assessoria.ambisafe@gmail.com
                  </a>
                </p>
                <p>
                  <strong>Telefone:</strong>{' '}
                  <a href="tel:+5583996028738" className="underline" style={{ color: C.dark }}>
                    (83) 9602-8738
                  </a>
                </p>
                <p>
                  <strong>Site:</strong>{' '}
                  <span>meuambisafe.com.br</span>
                </p>
              </div>
            </section>

            {/* 10 */}
            <section>
              <h2>
                10. Vigência e Alterações
              </h2>
              <p>
                Estes Termos de Uso entram em vigor na data de sua publicação:{' '}
                <strong>17 de abril de 2025</strong>.
              </p>
              <p className="mt-3">
                A AMBISAFE reserva-se o direito de alterar estes Termos a qualquer momento.
                Alterações substanciais serão comunicadas aos usuários por e-mail com
                antecedência mínima de 15 (quinze) dias. A continuidade do uso da Plataforma
                após a entrada em vigor das alterações constitui aceitação das novas condições.
              </p>
            </section>

    </LegalLayout>
  );
}
